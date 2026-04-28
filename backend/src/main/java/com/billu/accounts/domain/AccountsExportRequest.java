package com.billu.accounts.domain;

import java.util.Map;

public class AccountsExportRequest {
  private String exportType;
  private String environment;
  private String requestedBy;
  private Map<String, Object> filters;
  private String correlationId;
  private String outcome;

  public AccountsExportRequest() {
  }

  public AccountsExportRequest(String exportType, String environment, String requestedBy,
      Map<String, Object> filters, String correlationId, String outcome) {
    this.exportType = exportType;
    this.environment = environment;
    this.requestedBy = requestedBy;
    this.filters = filters;
    this.correlationId = correlationId;
    this.outcome = outcome;
  }

  public String getExportType() { return exportType; }
  public void setExportType(String exportType) { this.exportType = exportType; }
  public String getEnvironment() { return environment; }
  public void setEnvironment(String environment) { this.environment = environment; }
  public String getRequestedBy() { return requestedBy; }
  public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
  public Map<String, Object> getFilters() { return filters; }
  public void setFilters(Map<String, Object> filters) { this.filters = filters; }
  public String getCorrelationId() { return correlationId; }
  public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
  public String getOutcome() { return outcome; }
  public void setOutcome(String outcome) { this.outcome = outcome; }
}
