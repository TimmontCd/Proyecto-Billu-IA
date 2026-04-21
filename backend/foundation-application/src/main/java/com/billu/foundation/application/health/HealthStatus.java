package com.billu.foundation.application.health;

public class HealthStatus {
  private final String status;
  private final String service;
  private final String environment;

  public HealthStatus(String status, String service, String environment) {
    this.status = status;
    this.service = service;
    this.environment = environment;
  }

  public String getStatus() { return status; }
  public String getService() { return service; }
  public String getEnvironment() { return environment; }
}
