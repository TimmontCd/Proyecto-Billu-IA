package com.billu.accounts.application;

import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;
import java.util.LinkedHashMap;
import java.util.Map;

public class ExportCustomerSummaryUseCase {
  public static final String EXPORT_TYPE_HISTORICAL_MONTH = "HISTORICAL_MONTH";
  public static final String EXPORT_TYPE_FIRST30_MONTH = "FIRST30_MONTH";
  public static final String EXPORT_TYPE_CARD_COVERAGE = "CARD_COVERAGE";

  private final AccountsExportGateway accountsExportGateway;
  private final CustomerSummaryAuditService customerSummaryAuditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerSummaryRequestValidator requestValidator;

  public ExportCustomerSummaryUseCase(AccountsExportGateway accountsExportGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(accountsExportGateway, customerSummaryAuditService, accessContextQueryUseCase,
        new CustomerSummaryRequestValidator());
  }

  public ExportCustomerSummaryUseCase(AccountsExportGateway accountsExportGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerSummaryRequestValidator requestValidator) {
    this.accountsExportGateway = accountsExportGateway;
    this.customerSummaryAuditService = customerSummaryAuditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.requestValidator = requestValidator;
  }

  public AccountsExportResult exportHistoricalMonth(Integer selectedYear, Integer selectedMonth,
      String correlationId) {
    return export(EXPORT_TYPE_HISTORICAL_MONTH, selectedYear, selectedMonth, correlationId);
  }

  public AccountsExportResult exportFirst30Month(Integer selectedYear, Integer selectedMonth,
      String correlationId) {
    return export(EXPORT_TYPE_FIRST30_MONTH, selectedYear, selectedMonth, correlationId);
  }

  public AccountsExportResult exportCardCoverage(String correlationId) {
    return export(EXPORT_TYPE_CARD_COVERAGE, null, null, correlationId);
  }

  private AccountsExportResult export(String exportType, Integer selectedYear, Integer selectedMonth,
      String correlationId) {
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    Map<String, Object> filters = new LinkedHashMap<String, Object>();
    if (!EXPORT_TYPE_CARD_COVERAGE.equals(exportType)) {
      requestValidator.validateExportMonth(selectedYear, selectedMonth, exportType);
      filters.put("selectedYear", selectedYear);
      filters.put("selectedMonth", selectedMonth);
    }
    AccountsExportResult result = accountsExportGateway.exportData(new AccountsExportRequest(
        exportType,
        accessContext.getEnvironmentKey(),
        accessContext.getPrincipalName(),
        filters,
        correlationId,
        "REQUESTED"));
    customerSummaryAuditService.recordExportRequest(
        accessContext.getPrincipalName(),
        accessContext.getEnvironmentKey(),
        correlationId,
        result.getExportType(),
        result.getOutcome(),
        result.getFileName());
    return result;
  }
}
