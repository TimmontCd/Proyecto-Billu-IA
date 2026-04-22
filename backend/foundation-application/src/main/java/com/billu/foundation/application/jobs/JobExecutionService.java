package com.billu.foundation.application.jobs;

import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.JobDefinition;
import com.billu.foundation.domain.JobExecution;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class JobExecutionService implements JobExecutionUseCase, JobExecutionQueryUseCase {
  private final EnvironmentProfile environmentProfile;
  private final JsonSchedulerExecutor schedulerExecutor;
  private final AuditTrailService auditTrailService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final Map<String, JobExecution> executions = new ConcurrentHashMap<String, JobExecution>();

  public JobExecutionService(EnvironmentProfile environmentProfile, JsonSchedulerExecutor schedulerExecutor,
      AuditTrailService auditTrailService, AccessContextQueryUseCase accessContextQueryUseCase) {
    this.environmentProfile = environmentProfile;
    this.schedulerExecutor = schedulerExecutor;
    this.auditTrailService = auditTrailService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
  }

  @Override
  public JobExecution execute(JobExecutionCommand command) {
    JobDefinition definition = schedulerExecutor.getJobDefinition(command.getJobKey());
    if (definition == null) {
      throw new IllegalArgumentException("Job not registered: " + command.getJobKey());
    }
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    String executionId = UUID.randomUUID().toString();
    String requestedBy = command.getRequestedBy() == null || command.getRequestedBy().trim().isEmpty()
        ? accessContext.getPrincipalName()
        : command.getRequestedBy().trim();
    String effectiveMode = resolveRunMode(command, definition);
    String summary = schedulerExecutor.execute(command.getJobKey(), effectiveMode, command.isDryRun());
    JobExecution execution = new JobExecution(
        executionId,
        command.getJobKey(),
        requestedBy,
        environmentProfile.getEnvironmentKey(),
        effectiveMode,
        Instant.now(),
        Instant.now(),
        "SUCCEEDED",
        command.getCorrelationId(),
        summary + " (catalog " + schedulerExecutor.getCatalogVersion() + ")");
    executions.put(buildStoreKey(command.getJobKey(), executionId), execution);
    auditTrailService.record(
        "JOB_EXECUTED",
        "JOB_EXECUTION",
        executionId,
        requestedBy,
        environmentProfile.getEnvironmentKey(),
        command.getCorrelationId(),
        execution.getSummary());
    return execution;
  }

  @Override
  public JobExecution find(String jobKey, String executionId) {
    JobExecution execution = executions.get(buildStoreKey(jobKey, executionId));
    if (execution == null) {
      throw new IllegalArgumentException("Job execution not found: " + executionId);
    }
    return execution;
  }

  private String resolveRunMode(JobExecutionCommand command, JobDefinition definition) {
    if (command.getRequestedMode() != null && !command.getRequestedMode().trim().isEmpty()) {
      return command.getRequestedMode().trim().toUpperCase();
    }
    return definition.getExecutionMode();
  }

  private String buildStoreKey(String jobKey, String executionId) {
    return jobKey + "::" + executionId;
  }
}
