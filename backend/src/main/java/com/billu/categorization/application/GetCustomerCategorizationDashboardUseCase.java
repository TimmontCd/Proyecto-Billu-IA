package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class GetCustomerCategorizationDashboardUseCase {
  private final CustomerCategorizationDashboardGateway dashboardGateway;
  private final CustomerCategorizationAuditService auditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerCategorizationMappingValidator mappingValidator;

  public GetCustomerCategorizationDashboardUseCase(
      CustomerCategorizationDashboardGateway dashboardGateway,
      CustomerCategorizationAuditService auditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(dashboardGateway, auditService, accessContextQueryUseCase,
        new CustomerCategorizationMappingValidator());
  }

  public GetCustomerCategorizationDashboardUseCase(
      CustomerCategorizationDashboardGateway dashboardGateway,
      CustomerCategorizationAuditService auditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerCategorizationMappingValidator mappingValidator) {
    this.dashboardGateway = dashboardGateway;
    this.auditService = auditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.mappingValidator = mappingValidator;
  }

  public CustomerCategorizationDashboard execute(String correlationId) {
    CustomerCategorizationDashboard dashboard =
        mappingValidator.validateDashboard(dashboardGateway.getDashboard());
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    auditService.recordDashboardRequest(
        accessContext.getPrincipalName(),
        dashboard.getEnvironment(),
        correlationId,
        dashboard.getSourceMode(),
        dashboard.getDashboardId());
    return dashboard;
  }
}
