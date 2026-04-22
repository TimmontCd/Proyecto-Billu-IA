package com.billu.foundation.web.api;

public class LegacyDependencyResponse {
  private final String dependencyKey;
  private final String dependencyType;
  private final String sourceReference;
  private final String businessCapability;
  private final String accessMode;
  private final String owner;
  private final String exitCriteria;
  private final String riskLevel;
  private final String status;

  public LegacyDependencyResponse(String dependencyKey, String dependencyType, String sourceReference,
      String businessCapability, String accessMode, String owner, String exitCriteria,
      String riskLevel, String status) {
    this.dependencyKey = dependencyKey;
    this.dependencyType = dependencyType;
    this.sourceReference = sourceReference;
    this.businessCapability = businessCapability;
    this.accessMode = accessMode;
    this.owner = owner;
    this.exitCriteria = exitCriteria;
    this.riskLevel = riskLevel;
    this.status = status;
  }

  public String getDependencyKey() { return dependencyKey; }
  public String getDependencyType() { return dependencyType; }
  public String getSourceReference() { return sourceReference; }
  public String getBusinessCapability() { return businessCapability; }
  public String getAccessMode() { return accessMode; }
  public String getOwner() { return owner; }
  public String getExitCriteria() { return exitCriteria; }
  public String getRiskLevel() { return riskLevel; }
  public String getStatus() { return status; }
}
