package com.billu.foundation.web.api;

public class JobExecutionRequest {
  private String requestedMode;
  private boolean dryRun;
  private String requestedBy;

  public JobExecutionRequest() {
  }

  public String getRequestedMode() { return requestedMode; }
  public boolean isDryRun() { return dryRun; }
  public String getRequestedBy() { return requestedBy; }
  public void setRequestedMode(String requestedMode) { this.requestedMode = requestedMode; }
  public void setDryRun(boolean dryRun) { this.dryRun = dryRun; }
  public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
}
