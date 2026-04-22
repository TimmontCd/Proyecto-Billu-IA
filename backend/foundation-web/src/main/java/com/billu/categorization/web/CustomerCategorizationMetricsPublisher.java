package com.billu.categorization.web;

import com.billu.categorization.domain.CustomerCategorizationDashboard;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomerCategorizationMetricsPublisher {
  private static final Logger LOGGER =
      LoggerFactory.getLogger(CustomerCategorizationMetricsPublisher.class);
  private final AtomicLong dashboardRequests = new AtomicLong();
  private final AtomicLong lookupRequests = new AtomicLong();

  public void recordDashboard(CustomerCategorizationDashboard dashboard, String correlationId) {
    long currentCount = dashboardRequests.incrementAndGet();
    LOGGER.info(
        "metric=customer.categorization.dashboard count={} dashboardId={} sourceMode={} correlationId={}",
        Long.valueOf(currentCount),
        dashboard.getDashboardId(),
        dashboard.getSourceMode(),
        correlationId);
  }

  public void recordLookup(String environment, String rewardsId, String correlationId) {
    long currentCount = lookupRequests.incrementAndGet();
    LOGGER.info(
        "metric=customer.categorization.lookup count={} environment={} rewardsId={} correlationId={}",
        Long.valueOf(currentCount),
        environment,
        rewardsId,
        correlationId);
  }
}
