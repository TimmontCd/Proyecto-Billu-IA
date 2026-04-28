package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class FindCustomerCategorizationByRewardsIdUseCase {
  private final CustomerCategorizationLookupGateway lookupGateway;
  private final CustomerCategorizationAuditService auditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerCategorizationRequestValidator requestValidator;
  private final CustomerCategorizationMappingValidator mappingValidator;

  public FindCustomerCategorizationByRewardsIdUseCase(
      CustomerCategorizationLookupGateway lookupGateway,
      CustomerCategorizationAuditService auditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(lookupGateway, auditService, accessContextQueryUseCase,
        new CustomerCategorizationRequestValidator(),
        new CustomerCategorizationMappingValidator());
  }

  public FindCustomerCategorizationByRewardsIdUseCase(
      CustomerCategorizationLookupGateway lookupGateway,
      CustomerCategorizationAuditService auditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerCategorizationRequestValidator requestValidator,
      CustomerCategorizationMappingValidator mappingValidator) {
    this.lookupGateway = lookupGateway;
    this.auditService = auditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.requestValidator = requestValidator;
    this.mappingValidator = mappingValidator;
  }

  public CustomerCategorizationLookupResult execute(String rewardsId, String correlationId) {
    String validatedRewardsId = requestValidator.validateRewardsId(rewardsId);
    CustomerCategorizationLookupResult result =
        mappingValidator.validateLookup(lookupGateway.findByRewardsId(validatedRewardsId));
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    auditService.recordLookupRequest(
        accessContext.getPrincipalName(),
        result.getEnvironment(),
        correlationId,
        result.getRewardsId(),
        result.getTotalMatches());
    return result;
  }
}
