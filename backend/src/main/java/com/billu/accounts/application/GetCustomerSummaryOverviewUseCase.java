package com.billu.accounts.application;

import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class GetCustomerSummaryOverviewUseCase {
  private final AccountsSummaryGateway accountsSummaryGateway;
  private final CustomerSummaryAuditService customerSummaryAuditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerSummaryMappingValidator mappingValidator;

  public GetCustomerSummaryOverviewUseCase(AccountsSummaryGateway accountsSummaryGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(accountsSummaryGateway, customerSummaryAuditService, accessContextQueryUseCase,
        new CustomerSummaryMappingValidator());
  }

  public GetCustomerSummaryOverviewUseCase(AccountsSummaryGateway accountsSummaryGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerSummaryMappingValidator mappingValidator) {
    this.accountsSummaryGateway = accountsSummaryGateway;
    this.customerSummaryAuditService = customerSummaryAuditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.mappingValidator = mappingValidator;
  }

  public CustomerAccountSummary execute(String correlationId) {
    CustomerAccountSummary summary = mappingValidator.validateOverview(accountsSummaryGateway.getOverview());
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    customerSummaryAuditService.recordOverviewRequest(
        accessContext.getPrincipalName(),
        summary.getEnvironment(),
        correlationId,
        summary.getSourceMode(),
        summary.getSummaryId());
    return summary;
  }
}
