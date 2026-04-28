package com.billu.accounts.infrastructure.legacy;

import com.billu.accounts.application.AccountsHistoricalGateway;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LegacyAccountsHistoricalAdapter implements AccountsHistoricalGateway {
  @Override
  public CustomerSummaryHistoricalView getHistorical(String startDate, String endDate) {
    Map<String, Object> filters = new LinkedHashMap<String, Object>();
    filters.put("startDate", startDate == null ? "2026-01-01" : startDate);
    filters.put("endDate", endDate == null ? "2026-03-31" : endDate);

    Map<String, Object> trend = new LinkedHashMap<String, Object>();
    trend.put("totalAccounts", Integer.valueOf(214));
    trend.put("averagePerDay", Double.valueOf(2.4));
    trend.put("peak", "2026-02");

    Map<String, Object> monthlySummary = new LinkedHashMap<String, Object>();
    monthlySummary.put("year", Integer.valueOf(2026));
    monthlySummary.put("month", Integer.valueOf(2));
    monthlySummary.put("totalAccounts", Integer.valueOf(74));
    monthlySummary.put("activeAccounts", Integer.valueOf(58));
    monthlySummary.put("cancelledAccounts", Integer.valueOf(5));

    return new CustomerSummaryHistoricalView("legacy-bridge", filters, trend, monthlySummary);
  }

  @Override
  public CustomerSummaryFirst30View getFirst30() {
    Map<String, Object> totalSummary = new LinkedHashMap<String, Object>();
    totalSummary.put("openingAccounts", Integer.valueOf(95));
    totalSummary.put("qualifiedAccounts", Integer.valueOf(48));
    totalSummary.put("transactionalAccounts", Integer.valueOf(52));

    List<Map<String, Object>> monthlySummary = Arrays.<Map<String, Object>>asList(
        monthRow(2026, 1, 32, 18, 20),
        monthRow(2026, 2, 29, 15, 17),
        monthRow(2026, 3, 34, 15, 15));
    return new CustomerSummaryFirst30View("legacy-bridge", "2026-03-31", totalSummary,
        monthlySummary);
  }

  private Map<String, Object> monthRow(int year, int month, int openingAccounts,
      int qualifiedAccounts, int transactionalAccounts) {
    Map<String, Object> row = new LinkedHashMap<String, Object>();
    row.put("year", Integer.valueOf(year));
    row.put("month", Integer.valueOf(month));
    row.put("openingAccounts", Integer.valueOf(openingAccounts));
    row.put("qualifiedAccounts", Integer.valueOf(qualifiedAccounts));
    row.put("transactionalAccounts", Integer.valueOf(transactionalAccounts));
    return row;
  }
}
