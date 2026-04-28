package com.billu.foundation.web.api;

public class TransitionStatusResponse {
  private final String status;
  private final String rollbackState;
  private final String activeSystem;
  private final String environment;
  private final String evidence;

  public TransitionStatusResponse(String status, String rollbackState, String activeSystem,
      String environment, String evidence) {
    this.status = status;
    this.rollbackState = rollbackState;
    this.activeSystem = activeSystem;
    this.environment = environment;
    this.evidence = evidence;
  }

  public String getStatus() { return status; }
  public String getRollbackState() { return rollbackState; }
  public String getActiveSystem() { return activeSystem; }
  public String getEnvironment() { return environment; }
  public String getEvidence() { return evidence; }
}
