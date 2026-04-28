package com.billu.foundation.application.jobs;

public class JobExecutionCommand {
  private final String jobKey;
  private final String requestedMode;
  private final String requestedBy;
  private final boolean dryRun;
  private final String correlationId;

  public JobExecutionCommand(String jobKey, String requestedMode, String requestedBy) {
    this(jobKey, requestedMode, requestedBy, false, "unavailable");
  }

  public JobExecutionCommand(String jobKey, String requestedMode, String requestedBy, boolean dryRun,
      String correlationId) {
    this.jobKey = jobKey;
    this.requestedMode = requestedMode;
    this.requestedBy = requestedBy;
    this.dryRun = dryRun;
    this.correlationId = correlationId;
  }

  public String getJobKey() { return jobKey; }
  public String getRequestedMode() { return requestedMode; }
  public String getRequestedBy() { return requestedBy; }
  public boolean isDryRun() { return dryRun; }
  public String getCorrelationId() { return correlationId; }
}
