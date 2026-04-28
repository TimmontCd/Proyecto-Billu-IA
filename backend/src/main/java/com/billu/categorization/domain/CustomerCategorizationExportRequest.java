package com.billu.categorization.domain;

public class CustomerCategorizationExportRequest {
  private String exportType;
  private String environment;
  private String actor;
  private String segmentId;
  private String correlationId;
  private String status;

  public CustomerCategorizationExportRequest() {
  }

  public CustomerCategorizationExportRequest(String exportType, String environment, String actor,
      String segmentId, String correlationId, String status) {
    this.exportType = exportType;
    this.environment = environment;
    this.actor = actor;
    this.segmentId = segmentId;
    this.correlationId = correlationId;
    this.status = status;
  }

  public String getExportType() { return exportType; }
  public void setExportType(String exportType) { this.exportType = exportType; }
  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public String getActor() { return actor; }
  public void setActor(String actor) { this.actor = actor; }
  public String getSegmentId() { return segmentId; }
  public void setSegmentId(String segmentId) { this.segmentId = segmentId; }
  public String getCorrelationId() { return correlationId; }
  public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
