package com.billu.foundation.web.api;

import java.util.List;

public class ReadinessResponse {
  private final String status;
  private final String environment;
  private final List<DependencySummaryResponse> checks;

  public ReadinessResponse(String status, String environment, List<DependencySummaryResponse> checks) {
    this.status = status;
    this.environment = environment;
    this.checks = checks;
  }

  public String getStatus() { return status; }
  public String getEnvironment() { return environment; }
  public List<DependencySummaryResponse> getChecks() { return checks; }
}
