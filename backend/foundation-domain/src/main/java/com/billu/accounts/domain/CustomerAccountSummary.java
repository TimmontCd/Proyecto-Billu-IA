package com.billu.accounts.domain;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class CustomerAccountSummary {
  private String summaryId;
  private String environment;
  private int totalAccounts;
  private double totalBalance;
  private int activeAccounts;
  private int inactiveAccounts;
  private String executiveSummary;
  private String sourceMode;
  private Instant generatedAt;
  private Map<String, Double> kpis;
  private List<ProductSummaryItem> productSummary;

  public CustomerAccountSummary() {
  }

  public CustomerAccountSummary(String summaryId, String environment, int totalAccounts,
      double totalBalance, int activeAccounts, int inactiveAccounts, String executiveSummary,
      String sourceMode, Instant generatedAt, Map<String, Double> kpis,
      List<ProductSummaryItem> productSummary) {
    this.summaryId = summaryId;
    this.environment = environment;
    this.totalAccounts = totalAccounts;
    this.totalBalance = totalBalance;
    this.activeAccounts = activeAccounts;
    this.inactiveAccounts = inactiveAccounts;
    this.executiveSummary = executiveSummary;
    this.sourceMode = sourceMode;
    this.generatedAt = generatedAt;
    this.kpis = kpis;
    this.productSummary = productSummary;
  }

  public String getSummaryId() { return summaryId; }
  public void setSummaryId(String summaryId) { this.summaryId = summaryId; }
  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public int getTotalAccounts() { return totalAccounts; }
  public void setTotalAccounts(int totalAccounts) { this.totalAccounts = totalAccounts; }
  public double getTotalBalance() { return totalBalance; }
  public void setTotalBalance(double totalBalance) { this.totalBalance = totalBalance; }
  public int getActiveAccounts() { return activeAccounts; }
  public void setActiveAccounts(int activeAccounts) { this.activeAccounts = activeAccounts; }
  public int getInactiveAccounts() { return inactiveAccounts; }
  public void setInactiveAccounts(int inactiveAccounts) { this.inactiveAccounts = inactiveAccounts; }
  public String getExecutiveSummary() { return executiveSummary; }
  public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
  public String getSourceMode() { return sourceMode; }
  public void setSourceMode(String sourceMode) { this.sourceMode = sourceMode; }
  public Instant getGeneratedAt() { return generatedAt; }
  public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
  public Map<String, Double> getKpis() { return kpis; }
  public void setKpis(Map<String, Double> kpis) { this.kpis = kpis; }
  public List<ProductSummaryItem> getProductSummary() { return productSummary; }
  public void setProductSummary(List<ProductSummaryItem> productSummary) { this.productSummary = productSummary; }
}
