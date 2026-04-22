package com.billu.foundation.application.jobs;

import com.billu.foundation.domain.JobDefinition;
import com.billu.foundation.domain.SchedulerCatalog;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class SchedulerCatalogValidator {
  public void validate(SchedulerCatalog schedulerCatalog) {
    if (schedulerCatalog == null) {
      throw new IllegalArgumentException("Scheduler catalog is required");
    }
    if (isBlank(schedulerCatalog.getCatalogVersion())) {
      throw new IllegalArgumentException("Scheduler catalog version is required");
    }
    if (isBlank(schedulerCatalog.getEnvironmentKey())) {
      throw new IllegalArgumentException("Scheduler catalog environment is required");
    }
    List<JobDefinition> jobs = schedulerCatalog.getJobs();
    if (jobs == null || jobs.isEmpty()) {
      throw new IllegalArgumentException("Scheduler catalog must contain at least one job");
    }
    Set<String> jobKeys = new HashSet<String>();
    for (JobDefinition job : jobs) {
      validateJob(job, jobKeys);
    }
  }

  private void validateJob(JobDefinition job, Set<String> jobKeys) {
    if (job == null) {
      throw new IllegalArgumentException("Scheduler job definition is required");
    }
    if (isBlank(job.getJobKey())) {
      throw new IllegalArgumentException("Scheduler job key is required");
    }
    if (!jobKeys.add(job.getJobKey())) {
      throw new IllegalArgumentException("Scheduler job key must be unique: " + job.getJobKey());
    }
    if (isBlank(job.getJobName())) {
      throw new IllegalArgumentException("Scheduler job name is required for " + job.getJobKey());
    }
    if (isBlank(job.getTriggerMode())) {
      throw new IllegalArgumentException("Scheduler trigger mode is required for " + job.getJobKey());
    }
    if (isBlank(job.getExecutionMode())) {
      throw new IllegalArgumentException("Scheduler execution mode is required for " + job.getJobKey());
    }
    if (isBlank(job.getOwner())) {
      throw new IllegalArgumentException("Scheduler owner is required for " + job.getJobKey());
    }
    if (isBlank(job.getStatus())) {
      throw new IllegalArgumentException("Scheduler status is required for " + job.getJobKey());
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }
}
