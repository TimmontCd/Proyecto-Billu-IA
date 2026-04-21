package com.billu.foundation.application.jobs;

import com.billu.foundation.domain.JobDefinition;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class JobRegistry {
  private final Map<String, JobDefinition> jobDefinitions = new LinkedHashMap<String, JobDefinition>();

  public void register(JobDefinition jobDefinition) {
    jobDefinitions.put(jobDefinition.getJobKey(), jobDefinition);
  }

  public JobDefinition find(String jobKey) {
    return jobDefinitions.get(jobKey);
  }

  public Collection<JobDefinition> getAll() {
    return Collections.unmodifiableCollection(jobDefinitions.values());
  }
}
