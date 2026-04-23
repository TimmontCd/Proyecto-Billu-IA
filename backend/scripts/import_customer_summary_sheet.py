#!/usr/bin/env python3
"""Import a shared Google Sheet snapshot into the Oracle customer-summary tables.

Usage examples:

python3 backend/scripts/import_customer_summary_sheet.py \
  --snapshot-date 2026-04-30

python3 backend/scripts/import_customer_summary_sheet.py \
  --snapshot-date 2026-04-30 \
  --apply
"""

from __future__ import print_function

import argparse
import csv
import datetime as dt
import io
import os
import subprocess
import sys
import tempfile
import urllib.request
from decimal import Decimal, InvalidOperation


DEFAULT_SHEET_ID = "1GJUGDH3JCC40cxcsGKOUDVMkQxirBMggmFoSea7GLBY"
DEFAULT_GID = "0"
DEFAULT_SOURCE_SHEET_NAME = "CLIENT_BALANCE_SHEET_NAME"
DEFAULT_SOURCE_SYSTEM = "GSHEET_REAL_BALANCES"
DEFAULT_DOCKER_CONTEXT = "desktop-linux"
DEFAULT_CONTAINER = "billu-oracle-free"
DEFAULT_CONNECT_STRING = "BILLU_READ/BilluRead2026!@localhost:1521/FREEPDB1"
DEFAULT_BATCH_PREFIX = "gsheet-customer-summary"
DEFAULT_COMMIT_SIZE = 1000
CSV_HEADERS = (
    "ID RECOMPENSA",
    "ESTATUS DE LA CUENTA",
    "FECHA DE APERTURA CUENTA",
    "PRODUCTO DE LA CUENTA",
    "ESTADO",
    "GENERO",
    "EDAD",
    "SALDO PROMEDIO",
    "SALDO PUNTUAL",
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate and optionally apply Oracle SQL from the shared customer summary sheet."
    )
    parser.add_argument("--sheet-id", default=DEFAULT_SHEET_ID,
                        help="Google Sheet id. Defaults to the current Saldos sheet.")
    parser.add_argument("--gid", default=DEFAULT_GID,
                        help="Google Sheet tab gid. Defaults to 0.")
    parser.add_argument("--snapshot-date", required=True,
                        help="Snapshot date to load into Oracle tables (YYYY-MM-DD).")
    parser.add_argument("--source-sheet-name", default=DEFAULT_SOURCE_SHEET_NAME,
                        help="Source sheet name stored in Oracle metadata.")
    parser.add_argument("--source-system", default=DEFAULT_SOURCE_SYSTEM,
                        help="Source system label stored in Oracle metadata.")
    parser.add_argument("--batch-prefix", default=DEFAULT_BATCH_PREFIX,
                        help="Prefix used to build INGESTION_BATCH_ID.")
    parser.add_argument("--output",
                        help="Destination SQL file. Defaults to a temp file.")
    parser.add_argument("--apply", action="store_true",
                        help="Apply the generated SQL through Docker/sqlplus after generation.")
    parser.add_argument("--docker-context", default=DEFAULT_DOCKER_CONTEXT,
                        help="Docker context used when --apply is set.")
    parser.add_argument("--container", default=DEFAULT_CONTAINER,
                        help="Oracle container name used when --apply is set.")
    parser.add_argument("--connect-string", default=DEFAULT_CONNECT_STRING,
                        help="sqlplus connect string used when --apply is set.")
    parser.add_argument("--commit-size", type=int, default=DEFAULT_COMMIT_SIZE,
                        help="How many inserts to emit before each COMMIT.")
    return parser.parse_args()


def build_csv_url(sheet_id, gid):
    return "https://docs.google.com/spreadsheets/d/{}/export?format=csv&gid={}".format(
        sheet_id, gid
    )


def download_rows(sheet_id, gid):
    request = urllib.request.Request(
        build_csv_url(sheet_id, gid),
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response = urllib.request.urlopen(request)
    text = response.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    headers = tuple(reader.fieldnames or ())
    if headers != CSV_HEADERS:
        raise ValueError(
            "Unexpected CSV headers: {}. Expected {}.".format(headers, CSV_HEADERS)
        )
    return list(reader)


def parse_money(value):
    text = "" if value is None else str(value).strip()
    if not text:
        return Decimal("0.00")
    negative = text.startswith("-")
    normalized = text.replace("$", "").replace(",", "").replace(" ", "")
    if normalized.startswith("-"):
        normalized = normalized[1:]
    if not normalized:
        return Decimal("0.00")
    amount = Decimal(normalized)
    if negative:
        amount = -amount
    return amount.quantize(Decimal("0.01"))


def parse_opening_date(value):
    text = "" if value is None else str(value).strip()
    if text.endswith(".0"):
        text = text[:-2]
    digits = "".join(ch for ch in text if ch.isdigit())
    if len(digits) != 8:
        raise ValueError("Invalid opening date: {}".format(value))
    year = int(digits[0:4])
    month = int(digits[4:6])
    day = int(digits[6:8])
    return dt.date(year, month, day)


def normalize_status(value):
    text = "" if value is None else str(value).strip().upper()
    if text.startswith("A-") or text == "ACTIVE":
        return "ACTIVE"
    if text.startswith("C-") or text in ("CANCELLED", "CANCELED"):
        return "CANCELLED"
    return "INACTIVE"


def normalize_gender(value):
    text = "" if value is None else str(value).strip().upper()
    return text if text in ("M", "F", "E") else None


def normalize_age(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    age = int(float(text))
    return age if 0 <= age <= 120 else None


def normalize_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def sql_string(value):
    if value is None:
        return "NULL"
    return "'{}'".format(str(value).replace("'", "''"))


def money_to_sql(value):
    return format(value, "f")


def monthly_label(snapshot_date):
    return snapshot_date.strftime("Saldos %Y-%m")


def batch_id(batch_prefix):
    return "{}-{}".format(batch_prefix, dt.date.today().strftime("%Y%m%d"))


def transform_rows(rows):
    customers = []
    products = []
    monthly = []
    stats = {
        "total_rows": len(rows),
        "loaded_rows": 0,
        "skipped_null_rewards": 0,
        "skipped_bad_date": 0,
        "skipped_bad_balance": 0,
    }

    for row in rows:
        rewards_id = normalize_text(row["ID RECOMPENSA"])
        if rewards_id is None or rewards_id.upper() == "NULL":
            stats["skipped_null_rewards"] += 1
            continue

        try:
            opening_date = parse_opening_date(row["FECHA DE APERTURA CUENTA"])
        except (TypeError, ValueError):
            stats["skipped_bad_date"] += 1
            continue

        try:
            average_balance = parse_money(row["SALDO PROMEDIO"])
            puntual_balance = parse_money(row["SALDO PUNTUAL"])
        except (InvalidOperation, TypeError, ValueError):
            stats["skipped_bad_balance"] += 1
            continue

        account_status = normalize_status(row["ESTATUS DE LA CUENTA"])
        product_code = normalize_text(row["PRODUCTO DE LA CUENTA"]) or "UNKNOWN"
        product_active_flag = "N" if account_status == "CANCELLED" else "Y"

        customers.append({
            "rewards_id": rewards_id,
            "account_status": account_status,
            "opening_date": opening_date,
            "state_name": normalize_text(row["ESTADO"]),
            "gender_code": normalize_gender(row["GENERO"]),
            "age_years": normalize_age(row["EDAD"]),
        })
        products.append({
            "rewards_id": rewards_id,
            "product_code": product_code,
            "product_label": product_code,
            "product_active_flag": product_active_flag,
            "product_balance_amount": puntual_balance,
            "account_status": account_status,
        })
        monthly.append({
            "rewards_id": rewards_id,
            "balance_amount": average_balance,
        })
        stats["loaded_rows"] += 1

    return customers, products, monthly, stats


def write_import_sql(path, snapshot_date, source_system, source_sheet_id, source_sheet_name,
                     batch_prefix, customers, products, monthly, commit_size):
    batch = batch_id(batch_prefix)
    label = monthly_label(snapshot_date)
    with io.open(path, "w", encoding="utf-8") as handle:
        handle.write("WHENEVER SQLERROR EXIT SQL.SQLCODE\n")
        handle.write("SET DEFINE OFF\n")
        handle.write("SET FEEDBACK OFF\n")
        handle.write("SET ECHO OFF\n")
        handle.write("SET HEADING OFF\n")
        handle.write("SET TERMOUT OFF\n")
        handle.write("DELETE FROM DLK_TRANSACTION;\n")
        handle.write("DELETE FROM DLK_CARD_STATUS;\n")
        handle.write("DELETE FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT;\n")
        handle.write("DELETE FROM DLK_CUSTOMER;\n")
        handle.write("DELETE FROM DLK_MONTHLY_BALANCE;\n")
        handle.write("COMMIT;\n\n")

        emit_customer_inserts(handle, customers, source_system, source_sheet_id,
                              source_sheet_name, batch, commit_size)
        emit_product_inserts(handle, products, snapshot_date, source_system, batch, commit_size)
        emit_monthly_inserts(handle, monthly, snapshot_date, label, source_system,
                             source_sheet_id, source_sheet_name, batch, commit_size)
        handle.write("EXIT;\n")


def emit_customer_inserts(handle, customers, source_system, source_sheet_id, source_sheet_name,
                          batch, commit_size):
    for index, row in enumerate(customers, start=1):
        handle.write(
            "INSERT INTO DLK_CUSTOMER ("
            "REWARDS_ID, ACCOUNT_STATUS, OPENING_DATE, STATE_NAME, GENDER_CODE, AGE_YEARS, "
            "SOURCE_SYSTEM, SOURCE_SPREADSHEET_ID, SOURCE_SHEET_NAME, INGESTION_BATCH_ID"
            ") VALUES ("
        )
        handle.write(", ".join([
            sql_string(row["rewards_id"]),
            sql_string(row["account_status"]),
            "DATE '{}'".format(row["opening_date"].isoformat()),
            sql_string(row["state_name"]),
            sql_string(row["gender_code"]),
            "NULL" if row["age_years"] is None else str(row["age_years"]),
            sql_string(source_system),
            sql_string(source_sheet_id),
            sql_string(source_sheet_name),
            sql_string(batch),
        ]))
        handle.write(");\n")
        if index % commit_size == 0:
            handle.write("COMMIT;\n")
    handle.write("COMMIT;\n\n")


def emit_product_inserts(handle, products, snapshot_date, source_system, batch, commit_size):
    for index, row in enumerate(products, start=1):
        handle.write(
            "INSERT INTO DLK_CUSTOMER_PRODUCT_SNAPSHOT ("
            "REWARDS_ID, SNAPSHOT_DATE, PRODUCT_CODE, PRODUCT_LABEL, PRODUCT_ACTIVE_FLAG, "
            "PRODUCT_BALANCE_AMOUNT, ACCOUNT_STATUS, SOURCE_SYSTEM, INGESTION_BATCH_ID"
            ") VALUES ("
        )
        handle.write(", ".join([
            sql_string(row["rewards_id"]),
            "DATE '{}'".format(snapshot_date.isoformat()),
            sql_string(row["product_code"]),
            sql_string(row["product_label"]),
            sql_string(row["product_active_flag"]),
            money_to_sql(row["product_balance_amount"]),
            sql_string(row["account_status"]),
            sql_string(source_system),
            sql_string(batch),
        ]))
        handle.write(");\n")
        if index % commit_size == 0:
            handle.write("COMMIT;\n")
    handle.write("COMMIT;\n\n")


def emit_monthly_inserts(handle, monthly, snapshot_date, label, source_system, source_sheet_id,
                         source_sheet_name, batch, commit_size):
    for index, row in enumerate(monthly, start=1):
        handle.write(
            "INSERT INTO DLK_MONTHLY_BALANCE ("
            "REWARDS_ID, BALANCE_MONTH, BALANCE_AMOUNT, MONTH_HEADER_LABEL, IS_IMPUTED_FLAG, "
            "SOURCE_SYSTEM, SOURCE_SPREADSHEET_ID, SOURCE_SHEET_NAME, INGESTION_BATCH_ID"
            ") VALUES ("
        )
        handle.write(", ".join([
            sql_string(row["rewards_id"]),
            "DATE '{}'".format(snapshot_date.isoformat()),
            money_to_sql(row["balance_amount"]),
            sql_string(label),
            sql_string("N"),
            sql_string(source_system),
            sql_string(source_sheet_id),
            sql_string(source_sheet_name),
            sql_string(batch),
        ]))
        handle.write(");\n")
        if index % commit_size == 0:
            handle.write("COMMIT;\n")
    handle.write("COMMIT;\n\n")


def apply_sql(path, docker_context, container, connect_string):
    command = [
        "docker",
        "--context",
        docker_context,
        "exec",
        "-i",
        container,
        "bash",
        "-lc",
        "sqlplus -s '{}'".format(connect_string.replace("'", "'\"'\"'")),
    ]
    with open(path, "rb") as sql_file:
        completed = subprocess.run(command, stdin=sql_file)
    if completed.returncode != 0:
        raise RuntimeError("Oracle import failed with exit code {}".format(completed.returncode))


def resolve_output_path(value, snapshot_date):
    if value:
        return value
    prefix = "billu_customer_summary_{}_".format(snapshot_date.isoformat())
    fd, path = tempfile.mkstemp(prefix=prefix, suffix=".sql")
    os.close(fd)
    return path


def main():
    args = parse_args()
    snapshot_date = dt.datetime.strptime(args.snapshot_date, "%Y-%m-%d").date()
    rows = download_rows(args.sheet_id, args.gid)
    customers, products, monthly, stats = transform_rows(rows)
    output = resolve_output_path(args.output, snapshot_date)
    write_import_sql(
        output,
        snapshot_date,
        args.source_system,
        args.sheet_id,
        args.source_sheet_name,
        args.batch_prefix,
        customers,
        products,
        monthly,
        args.commit_size,
    )

    print("SQL file:", output)
    print("Rows downloaded:", stats["total_rows"])
    print("Rows loaded:", stats["loaded_rows"])
    print("Skipped null rewards:", stats["skipped_null_rewards"])
    print("Skipped bad date:", stats["skipped_bad_date"])
    print("Skipped bad balance:", stats["skipped_bad_balance"])

    if args.apply:
        apply_sql(output, args.docker_context, args.container, args.connect_string)
        print("Oracle import applied successfully.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
