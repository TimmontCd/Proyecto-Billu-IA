package com.billu.foundation.application.jobs;

import com.billu.foundation.domain.JobExecution;

public interface JobExecutionUseCase {
  JobExecution execute(JobExecutionCommand command);
}
