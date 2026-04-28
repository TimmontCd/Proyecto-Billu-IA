package com.billu.accounts.application;

import com.billu.accounts.domain.CardCoverageSnapshot;
import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;

public class CustomerSummaryMappingValidator {
  public CustomerAccountSummary validateOverview(CustomerAccountSummary summary) {
    require(summary != null, "Overview payload is required");
    require(notBlank(summary.getEnvironment()), "Overview environment is required");
    require(notBlank(summary.getSourceMode()), "Overview sourceMode is required");
    require(summary.getKpis() != null, "Overview kpis are required");
    require(summary.getProductSummary() != null, "Overview productSummary is required");
    return summary;
  }

  public CustomerSummaryHistoricalView validateHistorical(CustomerSummaryHistoricalView view) {
    require(view != null, "Historical payload is required");
    require(notBlank(view.getEnvironment()), "Historical environment is required");
    require(view.getFilters() != null, "Historical filters are required");
    require(view.getTrend() != null, "Historical trend is required");
    require(view.getMonthlySummary() != null, "Historical monthlySummary is required");
    return view;
  }

  public CustomerSummaryFirst30View validateFirst30(CustomerSummaryFirst30View view) {
    require(view != null, "First30 payload is required");
    require(notBlank(view.getEnvironment()), "First30 environment is required");
    require(notBlank(view.getReferenceDate()), "First30 referenceDate is required");
    require(view.getTotalSummary() != null, "First30 totalSummary is required");
    require(view.getMonthlySummary() != null, "First30 monthlySummary is required");
    return view;
  }

  public CardCoverageSnapshot validateCardCoverage(CardCoverageSnapshot snapshot) {
    require(snapshot != null, "Card coverage payload is required");
    require(notBlank(snapshot.getEnvironment()), "Card coverage environment is required");
    require(snapshot.getSegments() != null, "Card coverage segments are required");
    require(snapshot.getCoveredAccounts() >= 0, "Card coverage counts must be non-negative");
    require(snapshot.getUncoveredAccounts() >= 0, "Card coverage counts must be non-negative");
    return snapshot;
  }

  private void require(boolean condition, String message) {
    if (!condition) {
      throw new IllegalStateException(message);
    }
  }

  private boolean notBlank(String value) {
    return value != null && !value.trim().isEmpty();
  }
}
