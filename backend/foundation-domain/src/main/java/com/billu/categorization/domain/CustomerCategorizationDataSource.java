package com.billu.categorization.domain;

public class CustomerCategorizationDataSource {
  private String environment;
  private String sourceMode;
  private String origin;
  private String lastUpdatedAt;

  public CustomerCategorizationDataSource() {
  }

  public CustomerCategorizationDataSource(String environment, String sourceMode, String origin,
      String lastUpdatedAt) {
    this.environment = environment;
    this.sourceMode = sourceMode;
    this.origin = origin;
    this.lastUpdatedAt = lastUpdatedAt;
  }

  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public String getSourceMode() { return sourceMode; }
  public void setSourceMode(String sourceMode) { this.sourceMode = sourceMode; }
  public String getOrigin() { return origin; }
  public void setOrigin(String origin) { this.origin = origin; }
  public String getLastUpdatedAt() { return lastUpdatedAt; }
  public void setLastUpdatedAt(String lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
}
