package com.billu.accounts.domain;

import java.util.List;
import java.util.Map;

public class CustomerSummaryFirst30View {
  private String environment;
  private String referenceDate;
  private Map<String, Object> totalSummary;
  private List<Map<String, Object>> monthlySummary;

  public CustomerSummaryFirst30View() {
  }

  public CustomerSummaryFirst30View(String environment, String referenceDate,
      Map<String, Object> totalSummary, List<Map<String, Object>> monthlySummary) {
    this.environment = environment;
    this.referenceDate = referenceDate;
    this.totalSummary = totalSummary;
    this.monthlySummary = monthlySummary;
  }

  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public String getReferenceDate() { return referenceDate; }
  public void setReferenceDate(String referenceDate) { this.referenceDate = referenceDate; }
  public Map<String, Object> getTotalSummary() { return totalSummary; }
  public void setTotalSummary(Map<String, Object> totalSummary) { this.totalSummary = totalSummary; }
  public List<Map<String, Object>> getMonthlySummary() { return monthlySummary; }
  public void setMonthlySummary(List<Map<String, Object>> monthlySummary) { this.monthlySummary = monthlySummary; }
}
