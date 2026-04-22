package com.billu.accounts.web.api;

import java.util.Map;

public class CardCoverageResponse {
  private final String environment;
  private final String correlationId;
  private final Map<String, Object> summary;

  public CardCoverageResponse(String environment, String correlationId, Map<String, Object> summary) {
    this.environment = environment;
    this.correlationId = correlationId;
    this.summary = summary;
  }

  public String getEnvironment() { return environment; }
  public String getCorrelationId() { return correlationId; }
  public Map<String, Object> getSummary() { return summary; }
}
