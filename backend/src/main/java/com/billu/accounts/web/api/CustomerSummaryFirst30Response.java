package com.billu.accounts.web.api;

import java.util.List;
import java.util.Map;

public class CustomerSummaryFirst30Response {
  private final String environment;
  private final String correlationId;
  private final String referenceDate;
  private final Map<String, Object> totalSummary;
  private final List<Map<String, Object>> monthlySummary;

  public CustomerSummaryFirst30Response(String environment, String correlationId, String referenceDate,
      Map<String, Object> totalSummary, List<Map<String, Object>> monthlySummary) {
    this.environment = environment;
    this.correlationId = correlationId;
    this.referenceDate = referenceDate;
    this.totalSummary = totalSummary;
    this.monthlySummary = monthlySummary;
  }

  public String getEnvironment() { return environment; }
  public String getCorrelationId() { return correlationId; }
  public String getReferenceDate() { return referenceDate; }
  public Map<String, Object> getTotalSummary() { return totalSummary; }
  public List<Map<String, Object>> getMonthlySummary() { return monthlySummary; }
}
