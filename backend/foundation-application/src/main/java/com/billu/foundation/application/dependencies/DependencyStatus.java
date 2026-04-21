package com.billu.foundation.application.dependencies;

public class DependencyStatus {
  private final String dependencyKey;
  private final String dependencyType;
  private final String status;
  private final String mode;
  private final String details;

  public DependencyStatus(String dependencyKey, String status) {
    this(dependencyKey, "UNKNOWN", status, "UNKNOWN", "");
  }

  public DependencyStatus(String dependencyKey, String dependencyType, String status, String mode,
      String details) {
    this.dependencyKey = dependencyKey;
    this.dependencyType = dependencyType;
    this.status = status;
    this.mode = mode;
    this.details = details;
  }

  public String getDependencyKey() { return dependencyKey; }
  public String getDependencyType() { return dependencyType; }
  public String getStatus() { return status; }
  public String getMode() { return mode; }
  public String getDetails() { return details; }
}
