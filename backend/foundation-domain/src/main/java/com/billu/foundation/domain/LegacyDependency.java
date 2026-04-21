package com.billu.foundation.domain;

public class LegacyDependency {
  private String dependencyKey;
  private String dependencyType;
  private String sourceReference;
  private String businessCapability;
  private String accessMode;
  private String owner;
  private String exitCriteria;
  private String riskLevel;
  private String status;

  public LegacyDependency() {
  }

  public LegacyDependency(String dependencyKey, String dependencyType, String sourceReference,
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
