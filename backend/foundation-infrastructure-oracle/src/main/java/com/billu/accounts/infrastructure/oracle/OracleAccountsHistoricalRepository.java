package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsHistoricalGateway;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OracleAccountsHistoricalRepository extends OracleRepositorySupport
    implements AccountsHistoricalGateway {
  private static final String HISTORICAL_MONTHLY_SQL =
      "SELECT EXTRACT(YEAR FROM OPENING_DATE) AS open_year, "
          + "EXTRACT(MONTH FROM OPENING_DATE) AS open_month, "
          + "COUNT(*) AS total_accounts, "
          + "SUM(CASE WHEN UPPER(NVL(ACCOUNT_STATUS, 'ACTIVE')) = 'ACTIVE' "
          + "    THEN 1 ELSE 0 END) AS active_accounts, "
          + "SUM(CASE WHEN UPPER(NVL(ACCOUNT_STATUS, 'ACTIVE')) <> 'ACTIVE' "
          + "    THEN 1 ELSE 0 END) AS inactive_accounts, "
          + "SUM(CASE WHEN UPPER(NVL(ACCOUNT_STATUS, 'ACTIVE')) IN ('CANCELLED', 'CANCELED') "
          + "    THEN 1 ELSE 0 END) AS cancelled_accounts "
          + "FROM DLK_CUSTOMER "
          + "WHERE OPENING_DATE BETWEEN ? AND ? "
          + "GROUP BY EXTRACT(YEAR FROM OPENING_DATE), EXTRACT(MONTH FROM OPENING_DATE) "
          + "ORDER BY open_year, open_month";
  private static final String OPENING_DATE_RANGE_SQL =
      "SELECT MIN(OPENING_DATE) AS min_opening_date, "
          + "MAX(OPENING_DATE) AS max_opening_date "
          + "FROM DLK_CUSTOMER "
          + "WHERE OPENING_DATE IS NOT NULL";
  private static final String FIRST30_MONTHLY_SQL =
      "SELECT EXTRACT(YEAR FROM customer.OPENING_DATE) AS cohort_year, "
          + "EXTRACT(MONTH FROM customer.OPENING_DATE) AS cohort_month, "
          + "COUNT(*) AS opening_accounts, "
          + "SUM(CASE WHEN EXISTS ("
          + "    SELECT 1 "
          + "    FROM DLK_TRANSACTION txn "
          + "    WHERE txn.REWARDS_ID = customer.REWARDS_ID "
          + "      AND txn.TRANSACTION_DATE BETWEEN customer.OPENING_DATE "
          + "          AND customer.OPENING_DATE + 30"
          + "  ) THEN 1 ELSE 0 END) AS transactional_accounts, "
          + "SUM(CASE WHEN ("
          + "    SELECT COUNT(*) "
          + "    FROM DLK_TRANSACTION txn "
          + "    WHERE txn.REWARDS_ID = customer.REWARDS_ID "
          + "      AND txn.TRANSACTION_DATE BETWEEN customer.OPENING_DATE "
          + "          AND customer.OPENING_DATE + 30"
          + "  ) >= 3 THEN 1 ELSE 0 END) AS qualified_accounts "
          + "FROM DLK_CUSTOMER customer "
          + "WHERE customer.OPENING_DATE IS NOT NULL "
          + "GROUP BY EXTRACT(YEAR FROM customer.OPENING_DATE), "
          + "EXTRACT(MONTH FROM customer.OPENING_DATE) "
          + "ORDER BY cohort_year, cohort_month";

  public OracleAccountsHistoricalRepository(String environment, String url, String user,
      String password) {
    super(environment, url, user, password);
  }

  OracleAccountsHistoricalRepository(String environment, String url, String user, String password,
      OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public CustomerSummaryHistoricalView getHistorical(String startDate, String endDate) {
    try (Connection connection = openConnection()) {
      DateWindow dateWindow = resolveHistoricalWindow(connection, startDate, endDate);
      List<MonthlyHistoricalAggregate> monthlyRows = loadHistoricalRows(connection, dateWindow);
      MonthlyHistoricalAggregate selectedMonth = resolveSelectedMonth(monthlyRows, dateWindow.endDate);
      return new CustomerSummaryHistoricalView(
          getEnvironment(),
          buildHistoricalFilters(dateWindow),
          buildHistoricalTrend(monthlyRows, dateWindow),
          buildHistoricalMonthlySummary(selectedMonth));
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer summary historical projection", exception);
    }
  }

  @Override
  public CustomerSummaryFirst30View getFirst30() {
    try (Connection connection = openConnection()) {
      List<First30MonthlyAggregate> monthlyRows = loadFirst30Rows(connection);
      LocalDate referenceDate = loadReferenceDate(connection);
      return new CustomerSummaryFirst30View(
          getEnvironment(),
          referenceDate.toString(),
          buildFirst30TotalSummary(monthlyRows),
          buildFirst30MonthlySummary(monthlyRows));
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer summary First30 projection", exception);
    }
  }

  private DateWindow resolveHistoricalWindow(Connection connection, String startDate, String endDate)
      throws SQLException {
    LocalDate datasetMin = null;
    LocalDate datasetMax = null;
    try (PreparedStatement statement = connection.prepareStatement(OPENING_DATE_RANGE_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      if (resultSet.next()) {
        datasetMin = toLocalDate(resultSet.getDate("min_opening_date"));
        datasetMax = toLocalDate(resultSet.getDate("max_opening_date"));
      }
    }

    LocalDate effectiveStart = hasText(startDate) ? LocalDate.parse(startDate) : datasetMin;
    LocalDate effectiveEnd = hasText(endDate) ? LocalDate.parse(endDate) : datasetMax;
    if (effectiveStart == null && effectiveEnd == null) {
      LocalDate today = LocalDate.now();
      effectiveStart = today;
      effectiveEnd = today;
    } else if (effectiveStart == null) {
      effectiveStart = effectiveEnd;
    } else if (effectiveEnd == null) {
      effectiveEnd = effectiveStart;
    }
    return new DateWindow(effectiveStart, effectiveEnd);
  }

  private List<MonthlyHistoricalAggregate> loadHistoricalRows(Connection connection, DateWindow dateWindow)
      throws SQLException {
    List<MonthlyHistoricalAggregate> rows = new ArrayList<MonthlyHistoricalAggregate>();
    try (PreparedStatement statement = connection.prepareStatement(HISTORICAL_MONTHLY_SQL)) {
      statement.setDate(1, Date.valueOf(dateWindow.startDate));
      statement.setDate(2, Date.valueOf(dateWindow.endDate));
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          rows.add(new MonthlyHistoricalAggregate(
              resultSet.getInt("open_year"),
              resultSet.getInt("open_month"),
              resultSet.getInt("total_accounts"),
              resultSet.getInt("active_accounts"),
              resultSet.getInt("inactive_accounts"),
              resultSet.getInt("cancelled_accounts")));
        }
      }
    }
    return rows;
  }

  private LocalDate loadReferenceDate(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(OPENING_DATE_RANGE_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      if (resultSet.next()) {
        LocalDate maxDate = toLocalDate(resultSet.getDate("max_opening_date"));
        if (maxDate != null) {
          return maxDate;
        }
      }
    }
    return LocalDate.now();
  }

  private List<First30MonthlyAggregate> loadFirst30Rows(Connection connection) throws SQLException {
    List<First30MonthlyAggregate> rows = new ArrayList<First30MonthlyAggregate>();
    try (PreparedStatement statement = connection.prepareStatement(FIRST30_MONTHLY_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      while (resultSet.next()) {
        int openingAccounts = resultSet.getInt("opening_accounts");
        int qualifiedAccounts = resultSet.getInt("qualified_accounts");
        int transactionalAccounts = resultSet.getInt("transactional_accounts");
        rows.add(new First30MonthlyAggregate(
            resultSet.getInt("cohort_year"),
            resultSet.getInt("cohort_month"),
            openingAccounts,
            qualifiedAccounts,
            transactionalAccounts,
            pct(qualifiedAccounts, openingAccounts)));
      }
    }
    return rows;
  }

  private Map<String, Object> buildHistoricalFilters(DateWindow dateWindow) {
    Map<String, Object> filters = new LinkedHashMap<String, Object>();
    filters.put("startDate", dateWindow.startDate.toString());
    filters.put("endDate", dateWindow.endDate.toString());
    filters.put("selectedYear", Integer.valueOf(dateWindow.endDate.getYear()));
    filters.put("selectedMonth", Integer.valueOf(dateWindow.endDate.getMonthValue()));
    return filters;
  }

  private Map<String, Object> buildHistoricalTrend(List<MonthlyHistoricalAggregate> monthlyRows,
      DateWindow dateWindow) {
    int totalAccounts = 0;
    String peak = "-";
    int peakAccounts = -1;
    for (MonthlyHistoricalAggregate row : monthlyRows) {
      totalAccounts += row.totalAccounts;
      if (row.totalAccounts > peakAccounts) {
        peakAccounts = row.totalAccounts;
        peak = row.year + "-" + padMonth(row.month);
      }
    }
    long daysInWindow = ChronoUnit.DAYS.between(dateWindow.startDate, dateWindow.endDate) + 1L;
    Map<String, Object> trend = new LinkedHashMap<String, Object>();
    trend.put("totalAccounts", Integer.valueOf(totalAccounts));
    trend.put("averagePerDay", Double.valueOf(daysInWindow <= 0L
        ? 0
        : round1(totalAccounts / (double) daysInWindow)));
    trend.put("peak", peak);
    return trend;
  }

  private Map<String, Object> buildHistoricalMonthlySummary(MonthlyHistoricalAggregate selectedMonth) {
    Map<String, Object> summary = new LinkedHashMap<String, Object>();
    summary.put("year", Integer.valueOf(selectedMonth.year));
    summary.put("month", Integer.valueOf(selectedMonth.month));
    summary.put("totalAccounts", Integer.valueOf(selectedMonth.totalAccounts));
    summary.put("activeAccounts", Integer.valueOf(selectedMonth.activeAccounts));
    summary.put("inactiveAccounts", Integer.valueOf(selectedMonth.inactiveAccounts));
    summary.put("cancelledAccounts", Integer.valueOf(selectedMonth.cancelledAccounts));
    return summary;
  }

  private Map<String, Object> buildFirst30TotalSummary(List<First30MonthlyAggregate> monthlyRows) {
    int openingAccounts = 0;
    int qualifiedAccounts = 0;
    int transactionalAccounts = 0;
    for (First30MonthlyAggregate row : monthlyRows) {
      openingAccounts += row.openingAccounts;
      qualifiedAccounts += row.qualifiedAccounts;
      transactionalAccounts += row.transactionalAccounts;
    }
    Map<String, Object> totalSummary = new LinkedHashMap<String, Object>();
    totalSummary.put("openingAccounts", Integer.valueOf(openingAccounts));
    totalSummary.put("qualifiedAccounts", Integer.valueOf(qualifiedAccounts));
    totalSummary.put("transactionalAccounts", Integer.valueOf(transactionalAccounts));
    return totalSummary;
  }

  private List<Map<String, Object>> buildFirst30MonthlySummary(List<First30MonthlyAggregate> monthlyRows) {
    List<Map<String, Object>> summary = new ArrayList<Map<String, Object>>();
    for (First30MonthlyAggregate row : monthlyRows) {
      Map<String, Object> value = new LinkedHashMap<String, Object>();
      value.put("year", Integer.valueOf(row.year));
      value.put("month", Integer.valueOf(row.month));
      value.put("openingAccounts", Integer.valueOf(row.openingAccounts));
      value.put("qualifiedAccounts", Integer.valueOf(row.qualifiedAccounts));
      value.put("transactionalAccounts", Integer.valueOf(row.transactionalAccounts));
      value.put("qualifiedPct", Double.valueOf(row.qualifiedPct));
      value.put("status", row.transactionalAccounts > 0 ? "ACTIVE" : "DORMANT");
      summary.add(value);
    }
    return summary;
  }

  private MonthlyHistoricalAggregate resolveSelectedMonth(List<MonthlyHistoricalAggregate> monthlyRows,
      LocalDate selectedDate) {
    for (MonthlyHistoricalAggregate row : monthlyRows) {
      if (row.year == selectedDate.getYear() && row.month == selectedDate.getMonthValue()) {
        return row;
      }
    }
    return new MonthlyHistoricalAggregate(
        selectedDate.getYear(),
        selectedDate.getMonthValue(),
        0,
        0,
        0,
        0);
  }

  private LocalDate toLocalDate(Date value) {
    return value == null ? null : value.toLocalDate();
  }

  private String padMonth(int month) {
    return month < 10 ? "0" + month : String.valueOf(month);
  }

  private static final class DateWindow {
    private final LocalDate startDate;
    private final LocalDate endDate;

    private DateWindow(LocalDate startDate, LocalDate endDate) {
      this.startDate = startDate;
      this.endDate = endDate;
    }
  }

  private static final class MonthlyHistoricalAggregate {
    private final int year;
    private final int month;
    private final int totalAccounts;
    private final int activeAccounts;
    private final int inactiveAccounts;
    private final int cancelledAccounts;

    private MonthlyHistoricalAggregate(int year, int month, int totalAccounts, int activeAccounts,
        int inactiveAccounts, int cancelledAccounts) {
      this.year = year;
      this.month = month;
      this.totalAccounts = totalAccounts;
      this.activeAccounts = activeAccounts;
      this.inactiveAccounts = inactiveAccounts;
      this.cancelledAccounts = cancelledAccounts;
    }
  }

  private static final class First30MonthlyAggregate {
    private final int year;
    private final int month;
    private final int openingAccounts;
    private final int qualifiedAccounts;
    private final int transactionalAccounts;
    private final double qualifiedPct;

    private First30MonthlyAggregate(int year, int month, int openingAccounts,
        int qualifiedAccounts, int transactionalAccounts, double qualifiedPct) {
      this.year = year;
      this.month = month;
      this.openingAccounts = openingAccounts;
      this.qualifiedAccounts = qualifiedAccounts;
      this.transactionalAccounts = transactionalAccounts;
      this.qualifiedPct = qualifiedPct;
    }
  }
}
