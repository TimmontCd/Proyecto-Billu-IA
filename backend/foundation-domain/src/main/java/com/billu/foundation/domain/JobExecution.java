package com.billu.foundation.domain;

import java.time.Instant;

public class JobExecution {
  private String executionId;
  private String jobKey;
  private String requestedBy;
  private String environmentKey;
  private String runMode;
  private Instant startedAt;
  private Instant finishedAt;
  private String outcome;
  private String correlationId;
  private String summary;

  public JobExecution() {
  }

  public JobExecution(String executionId, String jobKey, String requestedBy, String environmentKey,
      String runMode, Instant startedAt, Instant finishedAt, String outcome, String correlationId,
      String summary) {
    this.executionId = executionId;
    this.jobKey = jobKey;
    this.requestedBy = requestedBy;
    this.environmentKey = environmentKey;
    this.runMode = runMode;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
    this.outcome = outcome;
    this.correlationId = correlationId;
    this.summary = summary;
  }

  public String getExecutionId() { return executionId; }
  public String getJobKey() { return jobKey; }
  public String getRequestedBy() { return requestedBy; }
  public String getEnvironmentKey() { return environmentKey; }
  public String getRunMode() { return runMode; }
  public Instant getStartedAt() { return startedAt; }
  public Instant getFinishedAt() { return finishedAt; }
  public String getOutcome() { return outcome; }
  public String getCorrelationId() { return correlationId; }
  public String getSummary() { return summary; }
}
