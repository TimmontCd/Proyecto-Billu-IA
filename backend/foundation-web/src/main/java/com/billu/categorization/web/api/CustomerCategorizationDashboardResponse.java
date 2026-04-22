package com.billu.categorization.web.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class CustomerCategorizationDashboardResponse {
  private final String dashboardId;
  private final String environment;
  private final String sourceMode;
  private final String executiveSummary;
  private final String correlationId;
  private final Instant generatedAt;
  private final Map<String, Double> kpis;
  private final List<CustomerSegmentSummaryResponse> segmentSummary;

  public CustomerCategorizationDashboardResponse(String dashboardId, String environment,
      String sourceMode, String executiveSummary, String correlationId, Instant generatedAt,
      Map<String, Double> kpis, List<CustomerSegmentSummaryResponse> segmentSummary) {
    this.dashboardId = dashboardId;
    this.environment = environment;
    this.sourceMode = sourceMode;
    this.executiveSummary = executiveSummary;
    this.correlationId = correlationId;
    this.generatedAt = generatedAt;
    this.kpis = kpis;
    this.segmentSummary = segmentSummary;
  }

  public String getDashboardId() { return dashboardId; }
  public String getEnvironment() { return environment; }
  public String getSourceMode() { return sourceMode; }
  public String getExecutiveSummary() { return executiveSummary; }
  public String getCorrelationId() { return correlationId; }
  public Instant getGeneratedAt() { return generatedAt; }
  public Map<String, Double> getKpis() { return kpis; }
  public List<CustomerSegmentSummaryResponse> getSegmentSummary() { return segmentSummary; }
}
