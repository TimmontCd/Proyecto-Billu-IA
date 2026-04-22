package com.billu.foundation.web.api;

public class JobExecutionResponse {
  private final String executionId;
  private final String jobKey;
  private final String outcome;
  private final String environment;
  private final String runMode;
  private final String correlationId;
  private final String summary;

  public JobExecutionResponse(String executionId, String jobKey, String outcome, String environment,
      String runMode, String correlationId, String summary) {
    this.executionId = executionId;
    this.jobKey = jobKey;
    this.outcome = outcome;
    this.environment = environment;
    this.runMode = runMode;
    this.correlationId = correlationId;
    this.summary = summary;
  }

  public String getExecutionId() { return executionId; }
  public String getJobKey() { return jobKey; }
  public String getOutcome() { return outcome; }
  public String getEnvironment() { return environment; }
  public String getRunMode() { return runMode; }
  public String getCorrelationId() { return correlationId; }
  public String getSummary() { return summary; }
}
