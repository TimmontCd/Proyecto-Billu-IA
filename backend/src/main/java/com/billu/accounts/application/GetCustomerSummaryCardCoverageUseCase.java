package com.billu.accounts.application;

import com.billu.accounts.domain.CardCoverageSnapshot;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class GetCustomerSummaryCardCoverageUseCase {
  private final AccountsCardCoverageGateway accountsCardCoverageGateway;
  private final CustomerSummaryAuditService customerSummaryAuditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerSummaryMappingValidator mappingValidator;

  public GetCustomerSummaryCardCoverageUseCase(AccountsCardCoverageGateway accountsCardCoverageGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(accountsCardCoverageGateway, customerSummaryAuditService, accessContextQueryUseCase,
        new CustomerSummaryMappingValidator());
  }

  public GetCustomerSummaryCardCoverageUseCase(AccountsCardCoverageGateway accountsCardCoverageGateway,
      CustomerSummaryAuditService customerSummaryAuditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerSummaryMappingValidator mappingValidator) {
    this.accountsCardCoverageGateway = accountsCardCoverageGateway;
    this.customerSummaryAuditService = customerSummaryAuditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.mappingValidator = mappingValidator;
  }

  public CardCoverageSnapshot execute(String correlationId) {
    CardCoverageSnapshot snapshot =
        mappingValidator.validateCardCoverage(accountsCardCoverageGateway.getCoverage());
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    customerSummaryAuditService.recordCardCoverageRequest(
        accessContext.getPrincipalName(),
        snapshot.getEnvironment(),
        correlationId,
        snapshot.getCoveredAccounts(),
        snapshot.getTransactionalAccounts());
    return snapshot;
  }
}
