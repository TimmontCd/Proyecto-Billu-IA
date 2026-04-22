package com.billu.categorization.domain;

import java.util.List;
import java.util.Map;

public class CustomerCategorizationLookupResult {
  private String environment;
  private String rewardsId;
  private int totalMatches;
  private String executiveSummary;
  private List<Map<String, Object>> rows;

  public CustomerCategorizationLookupResult() {
  }

  public CustomerCategorizationLookupResult(String environment, String rewardsId, int totalMatches,
      String executiveSummary, List<Map<String, Object>> rows) {
    this.environment = environment;
    this.rewardsId = rewardsId;
    this.totalMatches = totalMatches;
    this.executiveSummary = executiveSummary;
    this.rows = rows;
  }

  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public String getRewardsId() { return rewardsId; }
  public void setRewardsId(String rewardsId) { this.rewardsId = rewardsId; }
  public int getTotalMatches() { return totalMatches; }
  public void setTotalMatches(int totalMatches) { this.totalMatches = totalMatches; }
  public String getExecutiveSummary() { return executiveSummary; }
  public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
  public List<Map<String, Object>> getRows() { return rows; }
  public void setRows(List<Map<String, Object>> rows) { this.rows = rows; }
}
