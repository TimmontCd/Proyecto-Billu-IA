package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;

public class CustomerCategorizationMappingValidator {
  public CustomerCategorizationDashboard validateDashboard(CustomerCategorizationDashboard dashboard) {
    require(dashboard != null, "Customer categorization dashboard is required");
    require(notBlank(dashboard.getDashboardId()), "Customer categorization dashboardId is required");
    require(notBlank(dashboard.getEnvironment()), "Customer categorization environment is required");
    require(notBlank(dashboard.getSourceMode()), "Customer categorization sourceMode is required");
    require(dashboard.getKpis() != null, "Customer categorization kpis are required");
    require(dashboard.getSegmentSummary() != null, "Customer categorization segmentSummary is required");
    for (com.billu.categorization.domain.CustomerSegmentSummary segment : dashboard.getSegmentSummary()) {
      require(segment != null, "Customer categorization segment entry is required");
      require(notBlank(segment.getSegmentId()), "Customer categorization segmentId is required");
      require(notBlank(segment.getSegmentLabel()), "Customer categorization segmentLabel is required");
      require(segment.getClients() >= 0, "Customer categorization segment clients must be >= 0");
    }
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

  public CustomerCategorizationExportResult validateExport(
      CustomerCategorizationExportResult exportResult) {
    require(exportResult != null, "Customer categorization export result is required");
    require(notBlank(exportResult.getExportType()),
        "Customer categorization exportType is required");
    require(notBlank(exportResult.getSegmentId()),
        "Customer categorization export segmentId is required");
    require(notBlank(exportResult.getSegmentLabel()),
        "Customer categorization export segmentLabel is required");
    require(notBlank(exportResult.getOutcome()),
        "Customer categorization export outcome is required");
    require(notBlank(exportResult.getFileName()),
        "Customer categorization export fileName is required");
    require(notBlank(exportResult.getCorrelationId()),
        "Customer categorization export correlationId is required");
    require(exportResult.getRowCount() >= 0,
        "Customer categorization export rowCount must be >= 0");
    return exportResult;
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
