package com.billu.categorization.web.api;

import java.util.List;
import java.util.Map;

public class CustomerCategorizationLookupResponse {
  private final String environment;
  private final String correlationId;
  private final String rewardsId;
  private final int totalMatches;
  private final String executiveSummary;
  private final String fileName;
  private final String csvContent;
  private final List<Map<String, Object>> rows;

  public CustomerCategorizationLookupResponse(String environment, String correlationId,
      String rewardsId, int totalMatches, String executiveSummary, String fileName,
      String csvContent, List<Map<String, Object>> rows) {
    this.environment = environment;
    this.correlationId = correlationId;
    this.rewardsId = rewardsId;
    this.totalMatches = totalMatches;
    this.executiveSummary = executiveSummary;
    this.fileName = fileName;
    this.csvContent = csvContent;
    this.rows = rows;
  }

  public String getEnvironment() { return environment; }
  public String getCorrelationId() { return correlationId; }
  public String getRewardsId() { return rewardsId; }
  public int getTotalMatches() { return totalMatches; }
  public String getExecutiveSummary() { return executiveSummary; }
  public String getFileName() { return fileName; }
  public String getCsvContent() { return csvContent; }
  public List<Map<String, Object>> getRows() { return rows; }
}
