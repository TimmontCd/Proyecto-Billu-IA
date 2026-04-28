package com.billu.accounts.infrastructure.legacy;

import com.billu.accounts.application.AccountsExportGateway;
import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;

public class LegacyAccountsExportAdapter implements AccountsExportGateway {
  @Override
  public AccountsExportResult exportData(AccountsExportRequest request) {
    return new AccountsExportResult(
        request.getExportType(),
        "SUCCEEDED",
        buildFileName(request),
        resolveRowCount(request.getExportType()),
        request.getCorrelationId(),
        "Legacy read-only bridge generated export metadata for " + request.getExportType());
  }

  private String buildFileName(AccountsExportRequest request) {
    String exportType = request.getExportType().toLowerCase().replace('_', '-');
    if ("CARD_COVERAGE".equals(request.getExportType())) {
      return "legacy-customer-summary-" + exportType + ".csv";
    }
    Object year = request.getFilters().get("selectedYear");
    Object month = request.getFilters().get("selectedMonth");
    return "legacy-customer-summary-" + exportType + "-" + year + "-" + month + ".csv";
  }

  private int resolveRowCount(String exportType) {
    if ("HISTORICAL_MONTH".equals(exportType)) {
      return 74;
    }
    if ("FIRST30_MONTH".equals(exportType)) {
      return 34;
    }
    return 3;
  }
}
