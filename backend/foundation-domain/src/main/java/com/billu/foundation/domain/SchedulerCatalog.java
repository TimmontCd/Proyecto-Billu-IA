package com.billu.foundation.domain;

import java.time.Instant;
import java.util.List;

public class SchedulerCatalog {
  private String catalogVersion;
  private String environmentKey;
  private String sourcePath;
  private List<JobDefinition> jobs;
  private Instant updatedAt;
  private String status;

  public SchedulerCatalog() {
  }

  public SchedulerCatalog(String catalogVersion, String environmentKey, String sourcePath,
      List<JobDefinition> jobs, Instant updatedAt, String status) {
    this.catalogVersion = catalogVersion;
    this.environmentKey = environmentKey;
    this.sourcePath = sourcePath;
    this.jobs = jobs;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  public String getCatalogVersion() { return catalogVersion; }
  public String getEnvironmentKey() { return environmentKey; }
  public String getSourcePath() { return sourcePath; }
  public List<JobDefinition> getJobs() { return jobs; }
  public Instant getUpdatedAt() { return updatedAt; }
  public String getStatus() { return status; }
}
