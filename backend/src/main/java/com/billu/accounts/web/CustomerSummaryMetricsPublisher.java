package com.billu.accounts.web;

import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.accounts.domain.AccountsExportResult;
import com.billu.accounts.domain.CardCoverageSnapshot;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomerSummaryMetricsPublisher {
  private static final Logger LOGGER = LoggerFactory.getLogger(CustomerSummaryMetricsPublisher.class);
  private final AtomicLong overviewRequests = new AtomicLong();
  private final AtomicLong historicalRequests = new AtomicLong();
  private final AtomicLong first30Requests = new AtomicLong();
  private final AtomicLong cardCoverageRequests = new AtomicLong();
  private final AtomicLong exportRequests = new AtomicLong();

  public void recordOverview(CustomerAccountSummary summary, String correlationId) {
    long currentCount = overviewRequests.incrementAndGet();
    LOGGER.info(
        "metric=customer.summary.overview count={} summaryId={} sourceMode={} correlationId={}",
        Long.valueOf(currentCount),
        summary.getSummaryId(),
        summary.getSourceMode(),
        correlationId);
  }

  public void recordHistorical(String environment, String correlationId) {
    long currentCount = historicalRequests.incrementAndGet();
    LOGGER.info("metric=customer.summary.historical count={} environment={} correlationId={}",
        Long.valueOf(currentCount), environment, correlationId);
  }

  public void recordFirst30(String environment, String correlationId) {
    long currentCount = first30Requests.incrementAndGet();
    LOGGER.info("metric=customer.summary.first30 count={} environment={} correlationId={}",
        Long.valueOf(currentCount), environment, correlationId);
  }

  public void recordCardCoverage(CardCoverageSnapshot snapshot, String correlationId) {
    long currentCount = cardCoverageRequests.incrementAndGet();
    LOGGER.info(
        "metric=customer.summary.card.coverage count={} environment={} coveredAccounts={} correlationId={}",
        Long.valueOf(currentCount),
        snapshot.getEnvironment(),
        Integer.valueOf(snapshot.getCoveredAccounts()),
        correlationId);
  }

  public void recordExport(AccountsExportResult result) {
    long currentCount = exportRequests.incrementAndGet();
    LOGGER.info(
        "metric=customer.summary.export count={} exportType={} outcome={} rowCount={} correlationId={}",
        Long.valueOf(currentCount),
        result.getExportType(),
        result.getOutcome(),
        Integer.valueOf(result.getRowCount()),
        result.getCorrelationId());
  }
}
