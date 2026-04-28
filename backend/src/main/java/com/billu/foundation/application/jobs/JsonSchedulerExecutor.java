package com.billu.foundation.application.jobs;

import com.billu.foundation.domain.JobDefinition;
import com.billu.foundation.domain.SchedulerCatalog;
import java.io.IOException;

public class JsonSchedulerExecutor {
  private final SchedulerCatalogLoader schedulerCatalogLoader;
  private final SchedulerCatalogValidator schedulerCatalogValidator;
  private final String schedulerCatalogPath;
  private volatile JobRegistry jobRegistry;

  public JsonSchedulerExecutor(SchedulerCatalogLoader schedulerCatalogLoader, String schedulerCatalogPath) {
    this(schedulerCatalogLoader, new SchedulerCatalogValidator(), schedulerCatalogPath);
  }

  public JsonSchedulerExecutor(SchedulerCatalogLoader schedulerCatalogLoader,
      SchedulerCatalogValidator schedulerCatalogValidator, String schedulerCatalogPath) {
    this.schedulerCatalogLoader = schedulerCatalogLoader;
    this.schedulerCatalogValidator = schedulerCatalogValidator;
    this.schedulerCatalogPath = schedulerCatalogPath;
  }

  public JobDefinition getJobDefinition(String jobKey) {
    return getJobRegistry().find(jobKey);
  }

  public String execute(String jobKey, String requestedMode, boolean dryRun) {
    JobDefinition definition = getJobDefinition(jobKey);
    if (definition == null) {
      throw new IllegalArgumentException("Job not registered: " + jobKey);
    }
    String effectiveMode = requestedMode == null || requestedMode.trim().isEmpty()
        ? definition.getExecutionMode()
        : requestedMode.trim().toUpperCase();
    if ("INACTIVE".equalsIgnoreCase(definition.getStatus())) {
      throw new IllegalStateException("Job is not active: " + jobKey);
    }
    String action = dryRun ? "validated without execution" : "executed from scheduler catalog";
    return definition.getJobName() + " " + action + " using mode " + effectiveMode;
  }

  public String getCatalogVersion() {
    return loadCatalog().getCatalogVersion();
  }

  private JobRegistry getJobRegistry() {
    if (jobRegistry == null) {
      synchronized (this) {
        if (jobRegistry == null) {
          jobRegistry = buildRegistry(loadCatalog());
        }
      }
    }
    return jobRegistry;
  }

  private SchedulerCatalog loadCatalog() {
    try {
      SchedulerCatalog schedulerCatalog = schedulerCatalogLoader.load(schedulerCatalogPath);
      schedulerCatalogValidator.validate(schedulerCatalog);
      return schedulerCatalog;
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load scheduler catalog from " + schedulerCatalogPath,
          exception);
    }
  }

  private JobRegistry buildRegistry(SchedulerCatalog schedulerCatalog) {
    JobRegistry registry = new JobRegistry();
    for (JobDefinition definition : schedulerCatalog.getJobs()) {
      registry.register(definition);
    }
    return registry;
  }
}
