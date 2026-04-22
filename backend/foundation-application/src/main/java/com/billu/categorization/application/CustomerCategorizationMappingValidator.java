package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;

public class CustomerCategorizationMappingValidator {
  public CustomerCategorizationDashboard validateDashboard(CustomerCategorizationDashboard dashboard) {
    require(dashboard != null, "Customer categorization dashboard is required");
    require(notBlank(dashboard.getDashboardId()), "Customer categorization dashboardId is required");
    require(notBlank(dashboard.getEnvironment()), "Customer categorization environment is required");
    require(notBlank(dashboard.getSourceMode()), "Customer categorization sourceMode is required");
    require(dashboard.getKpis() != null, "Customer categorization kpis are required");
    require(dashboard.getSegmentSummary() != null, "Customer categorization segmentSummary is required");
    return dashboard;
  }

  public CustomerCategorizationLookupResult validateLookup(
      CustomerCategorizationLookupResult lookupResult) {
    require(lookupResult != null, "Customer categorization lookup result is required");
    require(notBlank(lookupResult.getEnvironment()), "Customer categorization lookup environment is required");
    require(notBlank(lookupResult.getRewardsId()), "Customer categorization lookup rewardsId is required");
    require(lookupResult.getRows() != null, "Customer categorization lookup rows are required");
    return lookupResult;
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
