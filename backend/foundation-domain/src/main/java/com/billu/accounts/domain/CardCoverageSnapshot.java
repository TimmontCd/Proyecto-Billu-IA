package com.billu.accounts.domain;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class CardCoverageSnapshot {
  private String environment;
  private int coveredAccounts;
  private int uncoveredAccounts;
  private int transactionalAccounts;
  private int coveredTransactionalAccounts;
  private List<Map<String, Object>> segments;
  private Instant generatedAt;

  public CardCoverageSnapshot() {
  }

  public CardCoverageSnapshot(String environment, int coveredAccounts, int uncoveredAccounts,
      int transactionalAccounts, int coveredTransactionalAccounts, List<Map<String, Object>> segments,
      Instant generatedAt) {
    this.environment = environment;
    this.coveredAccounts = coveredAccounts;
    this.uncoveredAccounts = uncoveredAccounts;
    this.transactionalAccounts = transactionalAccounts;
    this.coveredTransactionalAccounts = coveredTransactionalAccounts;
    this.segments = segments;
    this.generatedAt = generatedAt;
  }

  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public int getCoveredAccounts() { return coveredAccounts; }
  public void setCoveredAccounts(int coveredAccounts) { this.coveredAccounts = coveredAccounts; }
  public int getUncoveredAccounts() { return uncoveredAccounts; }
  public void setUncoveredAccounts(int uncoveredAccounts) { this.uncoveredAccounts = uncoveredAccounts; }
  public int getTransactionalAccounts() { return transactionalAccounts; }
  public void setTransactionalAccounts(int transactionalAccounts) { this.transactionalAccounts = transactionalAccounts; }
  public int getCoveredTransactionalAccounts() { return coveredTransactionalAccounts; }
  public void setCoveredTransactionalAccounts(int coveredTransactionalAccounts) { this.coveredTransactionalAccounts = coveredTransactionalAccounts; }
  public List<Map<String, Object>> getSegments() { return segments; }
  public void setSegments(List<Map<String, Object>> segments) { this.segments = segments; }
  public Instant getGeneratedAt() { return generatedAt; }
  public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
