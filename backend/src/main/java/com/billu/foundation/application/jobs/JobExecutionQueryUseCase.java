package com.billu.foundation.application.jobs;

import com.billu.foundation.domain.JobExecution;

public interface JobExecutionQueryUseCase {
  JobExecution find(String jobKey, String executionId);
}
