package com.billu.accounts.application;

import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class GetCustomerSummaryFirst30UseCase {
  private final AccountsHistoricalGateway accountsHistoricalGateway;
  private final CustomerSummaryAuditService customerSummaryAuditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerSummaryMappingValidator mappingValidator;

  public GetCustomerSummaryFirst30UseCase(AccountsHistoricalGateway accountsHistoricalGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(accountsHistoricalGateway, customerSummaryAuditService, accessContextQueryUseCase,
        new CustomerSummaryMappingValidator());
  }

  public GetCustomerSummaryFirst30UseCase(AccountsHistoricalGateway accountsHistoricalGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerSummaryMappingValidator mappingValidator) {
    this.accountsHistoricalGateway = accountsHistoricalGateway;
    this.customerSummaryAuditService = customerSummaryAuditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.mappingValidator = mappingValidator;
  }

  public CustomerSummaryFirst30View execute(String correlationId) {
    CustomerSummaryFirst30View first30View =
        mappingValidator.validateFirst30(accountsHistoricalGateway.getFirst30());
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    customerSummaryAuditService.recordFirst30Request(
        accessContext.getPrincipalName(),
        first30View.getEnvironment(),
        correlationId,
        first30View.getReferenceDate());
    return first30View;
  }
}
