package com.billu.accounts.web.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class CustomerSummaryOverviewResponse {
  private final String summaryId;
  private final String environment;
  private final String sourceMode;
  private final String executiveSummary;
  private final String correlationId;
  private final Instant generatedAt;
  private final Map<String, Double> kpis;
  private final List<ProductSummaryResponse> productSummary;

  public CustomerSummaryOverviewResponse(String summaryId, String environment, String sourceMode,
      String executiveSummary, String correlationId, Instant generatedAt, Map<String, Double> kpis,
      List<ProductSummaryResponse> productSummary) {
    this.summaryId = summaryId;
    this.environment = environment;
    this.sourceMode = sourceMode;
    this.executiveSummary = executiveSummary;
    this.correlationId = correlationId;
    this.generatedAt = generatedAt;
    this.kpis = kpis;
    this.productSummary = productSummary;
  }

  public String getSummaryId() { return summaryId; }
  public String getEnvironment() { return environment; }
  public String getSourceMode() { return sourceMode; }
  public String getExecutiveSummary() { return executiveSummary; }
  public String getCorrelationId() { return correlationId; }
  public Instant getGeneratedAt() { return generatedAt; }
  public Map<String, Double> getKpis() { return kpis; }
  public List<ProductSummaryResponse> getProductSummary() { return productSummary; }
}
