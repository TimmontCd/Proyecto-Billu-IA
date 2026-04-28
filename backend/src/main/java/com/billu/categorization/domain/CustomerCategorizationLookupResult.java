package com.billu.categorization.domain;

import java.util.List;
import java.util.Map;

public class CustomerCategorizationLookupResult {
  private String environment;
  private String rewardsId;
  private int totalMatches;
  private String executiveSummary;
  private String fileName;
  private String csvContent;
  private List<Map<String, Object>> rows;

  public CustomerCategorizationLookupResult() {
  }

  public CustomerCategorizationLookupResult(String environment, String rewardsId, int totalMatches,
      String executiveSummary, List<Map<String, Object>> rows) {
    this(environment, rewardsId, totalMatches, executiveSummary, null, null, rows);
  }

  public CustomerCategorizationLookupResult(String environment, String rewardsId, int totalMatches,
      String executiveSummary, String fileName, String csvContent,
      List<Map<String, Object>> rows) {
    this.environment = environment;
    this.rewardsId = rewardsId;
    this.totalMatches = totalMatches;
    this.executiveSummary = executiveSummary;
    this.fileName = fileName;
    this.csvContent = csvContent;
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
  public String getFileName() { return fileName; }
  public void setFileName(String fileName) { this.fileName = fileName; }
  public String getCsvContent() { return csvContent; }
  public void setCsvContent(String csvContent) { this.csvContent = csvContent; }
  public List<Map<String, Object>> getRows() { return rows; }
  public void setRows(List<Map<String, Object>> rows) { this.rows = rows; }
}
