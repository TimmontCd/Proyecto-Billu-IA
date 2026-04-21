package com.billu.foundation.application.jobs;

public class JobExecutionCommand {
  private final String jobKey;
  private final String requestedMode;
  private final String requestedBy;

  public JobExecutionCommand(String jobKey, String requestedMode, String requestedBy) {
    this.jobKey = jobKey;
    this.requestedMode = requestedMode;
    this.requestedBy = requestedBy;
  }

  public String getJobKey() { return jobKey; }
  public String getRequestedMode() { return requestedMode; }
  public String getRequestedBy() { return requestedBy; }
}
