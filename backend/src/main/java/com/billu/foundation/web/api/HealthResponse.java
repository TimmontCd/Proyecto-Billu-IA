package com.billu.foundation.web.api;

import java.time.Instant;

public class HealthResponse {
  private final String status;
  private final String service;
  private final String environment;
  private final Instant timestamp;
  private final String version;
  private final String correlationId;

  public HealthResponse(String status, String service, String environment, Instant timestamp,
      String version, String correlationId) {
    this.status = status;
    this.service = service;
    this.environment = environment;
    this.timestamp = timestamp;
    this.version = version;
    this.correlationId = correlationId;
  }

  public String getStatus() { return status; }
  public String getService() { return service; }
  public String getEnvironment() { return environment; }
  public Instant getTimestamp() { return timestamp; }
  public String getVersion() { return version; }
  public String getCorrelationId() { return correlationId; }
}
