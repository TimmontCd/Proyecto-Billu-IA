package com.billu.accounts.web.api;

import java.util.Map;

public class CustomerSummaryHistoricalResponse {
  private final String environment;
  private final String correlationId;
  private final Map<String, Object> filters;
  private final Map<String, Object> trend;
  private final Map<String, Object> monthlySummary;

  public CustomerSummaryHistoricalResponse(String environment, String correlationId,
      Map<String, Object> filters, Map<String, Object> trend, Map<String, Object> monthlySummary) {
    this.environment = environment;
    this.correlationId = correlationId;
    this.filters = filters;
    this.trend = trend;
    this.monthlySummary = monthlySummary;
  }

  public String getEnvironment() { return environment; }
  public String getCorrelationId() { return correlationId; }
  public Map<String, Object> getFilters() { return filters; }
  public Map<String, Object> getTrend() { return trend; }
  public Map<String, Object> getMonthlySummary() { return monthlySummary; }
}
