package com.billu.categorization.application;

import com.billu.foundation.application.observability.AuditTrailService;

public class CustomerCategorizationAuditService {
  private final AuditTrailService auditTrailService;

  public CustomerCategorizationAuditService(AuditTrailService auditTrailService) {
    this.auditTrailService = auditTrailService;
  }

  public void recordDashboardRequest(String actor, String environment, String correlationId,
      String sourceMode, String dashboardId) {
    auditTrailService.record(
        "CUSTOMER_CATEGORIZATION_DASHBOARD_REQUESTED",
        "CUSTOMER_CATEGORIZATION",
        dashboardId,
        actor,
        environment,
        correlationId,
        "Dashboard requested using source " + sourceMode);
  }

  public void recordLookupRequest(String actor, String environment, String correlationId,
      String rewardsId, int totalMatches) {
    auditTrailService.record(
        "CUSTOMER_CATEGORIZATION_LOOKUP_REQUESTED",
        "CUSTOMER_CATEGORIZATION_LOOKUP",
        rewardsId,
        actor,
        environment,
        correlationId,
        "Lookup requested for rewardsId " + rewardsId + " with matches " + totalMatches);
  }

  public void recordExportRequest(String actor, String environment, String correlationId,
      String exportType, String segmentId, String outcome, String fileName) {
    auditTrailService.record(
        "CUSTOMER_CATEGORIZATION_EXPORT_REQUESTED",
        "CUSTOMER_CATEGORIZATION_EXPORT",
        segmentId,
        actor,
        environment,
        correlationId,
        "Export " + exportType + " for segment " + segmentId + " finished as "
            + outcome + " using file " + fileName);
  }
}
