package com.billu.foundation.domain;

public class JobDefinition {
  private String jobKey;
  private String jobName;
  private String triggerMode;
  private String idempotencyKeyStrategy;
  private String executionMode;
  private String owner;
  private boolean auditRequired;
  private String status;

  public JobDefinition() {
  }

  public JobDefinition(String jobKey, String jobName, String triggerMode, String idempotencyKeyStrategy,
      String executionMode, String owner, boolean auditRequired, String status) {
    this.jobKey = jobKey;
    this.jobName = jobName;
    this.triggerMode = triggerMode;
    this.idempotencyKeyStrategy = idempotencyKeyStrategy;
    this.executionMode = executionMode;
    this.owner = owner;
    this.auditRequired = auditRequired;
    this.status = status;
  }

  public String getJobKey() { return jobKey; }
  public String getJobName() { return jobName; }
  public String getTriggerMode() { return triggerMode; }
  public String getIdempotencyKeyStrategy() { return idempotencyKeyStrategy; }
  public String getExecutionMode() { return executionMode; }
  public String getOwner() { return owner; }
  public boolean isAuditRequired() { return auditRequired; }
  public String getStatus() { return status; }
}
