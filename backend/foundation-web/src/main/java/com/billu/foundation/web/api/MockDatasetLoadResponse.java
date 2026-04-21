package com.billu.foundation.web.api;

public class MockDatasetLoadResponse {
  private final String datasetKey;
  private final String status;
  private final String environment;
  private final String version;
  private final String correlationId;

  public MockDatasetLoadResponse(String datasetKey, String status, String environment,
      String version, String correlationId) {
    this.datasetKey = datasetKey;
    this.status = status;
    this.environment = environment;
    this.version = version;
    this.correlationId = correlationId;
  }

  public String getDatasetKey() { return datasetKey; }
  public String getStatus() { return status; }
  public String getEnvironment() { return environment; }
  public String getVersion() { return version; }
  public String getCorrelationId() { return correlationId; }
}
