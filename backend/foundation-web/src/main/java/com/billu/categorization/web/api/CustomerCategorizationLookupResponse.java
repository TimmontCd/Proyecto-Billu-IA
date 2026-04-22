package com.billu.categorization.web.api;

import java.util.List;
import java.util.Map;

public class CustomerCategorizationLookupResponse {
  private final String environment;
  private final String correlationId;
  private final String rewardsId;
  private final int totalMatches;
  private final String executiveSummary;
  private final List<Map<String, Object>> rows;

  public CustomerCategorizationLookupResponse(String environment, String correlationId,
      String rewardsId, int totalMatches, String executiveSummary,
      List<Map<String, Object>> rows) {
    this.environment = environment;
    this.correlationId = correlationId;
    this.rewardsId = rewardsId;
    this.totalMatches = totalMatches;
    this.executiveSummary = executiveSummary;
    this.rows = rows;
  }

  public String getEnvironment() { return environment; }
  public String getCorrelationId() { return correlationId; }
  public String getRewardsId() { return rewardsId; }
  public int getTotalMatches() { return totalMatches; }
  public String getExecutiveSummary() { return executiveSummary; }
  public List<Map<String, Object>> getRows() { return rows; }
}
