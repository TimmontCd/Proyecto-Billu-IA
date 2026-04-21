package com.billu.foundation.application.readiness;

public class ReadinessStatus {
  private final String status;
  private final String environment;

  public ReadinessStatus(String status, String environment) {
    this.status = status;
    this.environment = environment;
  }

  public String getStatus() { return status; }
  public String getEnvironment() { return environment; }
}
