package com.billu.accounts.domain;

import java.util.Map;

public class CustomerSummaryHistoricalView {
  private String environment;
  private Map<String, Object> filters;
  private Map<String, Object> trend;
  private Map<String, Object> monthlySummary;

  public CustomerSummaryHistoricalView() {
  }

  public CustomerSummaryHistoricalView(String environment, Map<String, Object> filters,
      Map<String, Object> trend, Map<String, Object> monthlySummary) {
    this.environment = environment;
    this.filters = filters;
    this.trend = trend;
    this.monthlySummary = monthlySummary;
  }

  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public Map<String, Object> getFilters() { return filters; }
  public void setFilters(Map<String, Object> filters) { this.filters = filters; }
  public Map<String, Object> getTrend() { return trend; }
  public void setTrend(Map<String, Object> trend) { this.trend = trend; }
  public Map<String, Object> getMonthlySummary() { return monthlySummary; }
  public void setMonthlySummary(Map<String, Object> monthlySummary) { this.monthlySummary = monthlySummary; }
}
