package com.billu.accounts.infrastructure.mock;

import com.billu.accounts.application.AccountsExportGateway;
import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;
import java.util.Map;

public class MockAccountsExportRepository implements AccountsExportGateway {
  @Override
  public AccountsExportResult exportData(AccountsExportRequest request) {
    int rowCount = resolveRowCount(request);
    String suffix = request.getExportType().toLowerCase().replace('_', '-');
    String fileName = request.getExportType().equals("CARD_COVERAGE")
        ? "customer-summary-" + suffix + ".csv"
        : "customer-summary-" + suffix + "-"
            + request.getFilters().get("selectedYear") + "-"
            + padMonth(request.getFilters().get("selectedMonth")) + ".csv";
    return new AccountsExportResult(
        request.getExportType(),
        "SUCCEEDED",
        fileName,
        rowCount,
        request.getCorrelationId(),
        "Mock export generated for " + request.getExportType());
  }

  private int resolveRowCount(AccountsExportRequest request) {
    Map<String, Object> filters = request.getFilters();
    if ("CARD_COVERAGE".equals(request.getExportType())) {
      return 3;
    }
    if ("HISTORICAL_MONTH".equals(request.getExportType())) {
      return Integer.valueOf(34).intValue();
    }
    if ("FIRST30_MONTH".equals(request.getExportType())) {
      return Integer.valueOf(15).intValue();
    }
    return filters == null ? 0 : filters.size();
  }

  private String padMonth(Object value) {
    if (value == null) {
      return "00";
    }
    int month = ((Number) value).intValue();
    return month < 10 ? "0" + month : String.valueOf(month);
  }
}
