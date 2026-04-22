package com.billu.accounts.application;

import com.billu.foundation.application.observability.AuditTrailService;

public class CustomerSummaryAuditService {
  private final AuditTrailService auditTrailService;

  public CustomerSummaryAuditService(AuditTrailService auditTrailService) {
    this.auditTrailService = auditTrailService;
  }

  public void recordOverviewRequest(String actor, String environment, String correlationId,
      String sourceMode, String summaryId) {
    auditTrailService.record(
        "CUSTOMER_SUMMARY_OVERVIEW_REQUESTED",
        "CUSTOMER_SUMMARY",
        summaryId,
        actor,
        environment,
        correlationId,
        "Overview requested using source " + sourceMode);
  }

  public void recordHistoricalRequest(String actor, String environment, String correlationId,
      String startDate, String endDate) {
    auditTrailService.record(
        "CUSTOMER_SUMMARY_HISTORICAL_REQUESTED",
        "CUSTOMER_SUMMARY_HISTORICAL",
        actor + ":" + startDate + ":" + endDate,
        actor,
        environment,
        correlationId,
        "Historical requested from " + startDate + " to " + endDate);
  }

  public void recordFirst30Request(String actor, String environment, String correlationId,
      String referenceDate) {
    auditTrailService.record(
        "CUSTOMER_SUMMARY_FIRST30_REQUESTED",
        "CUSTOMER_SUMMARY_FIRST30",
        actor + ":" + referenceDate,
        actor,
        environment,
        correlationId,
        "First30 requested with reference date " + referenceDate);
  }

  public void recordCardCoverageRequest(String actor, String environment, String correlationId,
      int coveredAccounts, int transactionalAccounts) {
    auditTrailService.record(
        "CUSTOMER_SUMMARY_CARD_COVERAGE_REQUESTED",
        "CUSTOMER_SUMMARY_CARD_COVERAGE",
        actor + ":" + coveredAccounts + ":" + transactionalAccounts,
        actor,
        environment,
        correlationId,
        "Card coverage requested with covered accounts " + coveredAccounts);
  }

  public void recordExportRequest(String actor, String environment, String correlationId,
      String exportType, String outcome, String fileName) {
    auditTrailService.record(
        "CUSTOMER_SUMMARY_EXPORT_REQUESTED",
        "CUSTOMER_SUMMARY_EXPORT",
        actor + ":" + exportType + ":" + fileName,
        actor,
        environment,
        correlationId,
        "Export requested for " + exportType + " with outcome " + outcome);
  }
}
