package com.billu.categorization.domain;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class CustomerCategorizationDashboard {
  private String dashboardId;
  private String environment;
  private String sourceMode;
  private String executiveSummary;
  private Instant generatedAt;
  private Map<String, Double> kpis;
  private List<CustomerSegmentSummary> segmentSummary;

  public CustomerCategorizationDashboard() {
  }

  public CustomerCategorizationDashboard(String dashboardId, String environment, String sourceMode,
      String executiveSummary, Instant generatedAt, Map<String, Double> kpis,
      List<CustomerSegmentSummary> segmentSummary) {
    this.dashboardId = dashboardId;
    this.environment = environment;
    this.sourceMode = sourceMode;
    this.executiveSummary = executiveSummary;
    this.generatedAt = generatedAt;
    this.kpis = kpis;
    this.segmentSummary = segmentSummary;
  }

  public String getDashboardId() { return dashboardId; }
  public void setDashboardId(String dashboardId) { this.dashboardId = dashboardId; }
  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public String getSourceMode() { return sourceMode; }
  public void setSourceMode(String sourceMode) { this.sourceMode = sourceMode; }
  public String getExecutiveSummary() { return executiveSummary; }
  public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
  public Instant getGeneratedAt() { return generatedAt; }
  public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
  public Map<String, Double> getKpis() { return kpis; }
  public void setKpis(Map<String, Double> kpis) { this.kpis = kpis; }
  public List<CustomerSegmentSummary> getSegmentSummary() { return segmentSummary; }
  public void setSegmentSummary(List<CustomerSegmentSummary> segmentSummary) { this.segmentSummary = segmentSummary; }
}
