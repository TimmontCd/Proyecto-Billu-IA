package com.billu.foundation.web.metrics;

import com.billu.foundation.domain.JobExecution;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PlatformMetricsPublisher {
  private static final Logger LOGGER = LoggerFactory.getLogger(PlatformMetricsPublisher.class);
  private final AtomicLong totalJobExecutions = new AtomicLong();

  public void recordJobExecution(JobExecution execution) {
    long currentCount = totalJobExecutions.incrementAndGet();
    LOGGER.info(
        "metric=platform.job.execution count={} jobKey={} outcome={} correlationId={} runMode={}",
        Long.valueOf(currentCount),
        execution.getJobKey(),
        execution.getOutcome(),
        execution.getCorrelationId(),
        execution.getRunMode());
  }

  public long getTotalJobExecutions() {
    return totalJobExecutions.get();
  }
}
