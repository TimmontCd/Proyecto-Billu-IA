package com.billu.foundation.application.jobs;

import com.billu.foundation.domain.JobDefinition;
import com.billu.foundation.domain.SchedulerCatalog;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SchedulerCatalogLoader {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public SchedulerCatalog load(String path) throws IOException {
    JsonNode root = objectMapper.readTree(new File(path));
    List<JobDefinition> jobs = new ArrayList<JobDefinition>();
    for (JsonNode item : root.path("jobs")) {
      jobs.add(new JobDefinition(
          item.path("jobKey").asText(),
          item.path("jobName").asText(),
          item.path("triggerMode").asText(),
          item.path("idempotencyKeyStrategy").asText(),
          item.path("executionMode").asText(),
          item.path("owner").asText(),
          item.path("auditRequired").asBoolean(),
          item.path("status").asText()));
    }
    return new SchedulerCatalog(
        root.path("catalogVersion").asText(),
        root.path("environmentKey").asText(),
        path,
        jobs,
        Instant.now(),
        "VALID");
  }
}
