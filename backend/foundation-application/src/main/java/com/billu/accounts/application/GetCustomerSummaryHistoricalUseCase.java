package com.billu.accounts.application;

import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class GetCustomerSummaryHistoricalUseCase {
  private final AccountsHistoricalGateway accountsHistoricalGateway;
  private final CustomerSummaryAuditService customerSummaryAuditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerSummaryRequestValidator requestValidator;
  private final CustomerSummaryMappingValidator mappingValidator;

  public GetCustomerSummaryHistoricalUseCase(AccountsHistoricalGateway accountsHistoricalGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(accountsHistoricalGateway, customerSummaryAuditService, accessContextQueryUseCase,
        new CustomerSummaryRequestValidator(), new CustomerSummaryMappingValidator());
  }

  public GetCustomerSummaryHistoricalUseCase(AccountsHistoricalGateway accountsHistoricalGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerSummaryRequestValidator requestValidator,
      CustomerSummaryMappingValidator mappingValidator) {
    this.accountsHistoricalGateway = accountsHistoricalGateway;
    this.customerSummaryAuditService = customerSummaryAuditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.requestValidator = requestValidator;
    this.mappingValidator = mappingValidator;
  }

  public CustomerSummaryHistoricalView execute(String startDate, String endDate, String correlationId) {
    requestValidator.validateHistoricalRange(startDate, endDate);
    CustomerSummaryHistoricalView historicalView = mappingValidator.validateHistorical(
        accountsHistoricalGateway.getHistorical(startDate, endDate));
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    customerSummaryAuditService.recordHistoricalRequest(
        accessContext.getPrincipalName(),
        historicalView.getEnvironment(),
        correlationId,
        startDate,
        endDate);
    return historicalView;
  }
}
