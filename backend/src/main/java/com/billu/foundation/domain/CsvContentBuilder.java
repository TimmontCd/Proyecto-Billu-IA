package com.billu.foundation.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class CsvContentBuilder {
  private CsvContentBuilder() {
  }

  public static String fromRows(String[] headers, List<String[]> rows) {
    List<String[]> allRows = new ArrayList<String[]>();
    allRows.add(headers);
    if (rows != null) {
      allRows.addAll(rows);
    }
    return fromRows(allRows);
  }

  public static String fromMaps(String[] headers, List<? extends Map<String, Object>> rows) {
    List<String[]> values = new ArrayList<String[]>();
    if (rows != null) {
      for (Map<String, Object> row : rows) {
        String[] rowValues = new String[headers.length];
        for (int index = 0; index < headers.length; index += 1) {
          Object value = row.get(headers[index]);
          rowValues[index] = value == null ? "" : String.valueOf(value);
        }
        values.add(rowValues);
      }
    }
    return fromRows(headers, values);
  }

  public static String fromRows(List<String[]> rows) {
    StringBuilder csv = new StringBuilder();
    if (rows == null) {
      return "";
    }
    for (String[] row : rows) {
      appendRow(csv, row);
    }
    return csv.toString();
  }

  private static void appendRow(StringBuilder csv, String[] values) {
    if (values == null) {
      csv.append("\r\n");
      return;
    }
    for (int index = 0; index < values.length; index += 1) {
      if (index > 0) {
        csv.append(',');
      }
      appendValue(csv, values[index]);
    }
    csv.append("\r\n");
  }

  private static void appendValue(StringBuilder csv, String value) {
    String safeValue = value == null ? "" : value.replace("\r", " ").replace("\n", " ");
    csv.append('"').append(safeValue.replace("\"", "\"\"")).append('"');
  }
}
