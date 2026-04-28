package com.billu.foundation.web.setup;

import com.billu.accounts.web.api.CustomerSummaryOverviewController;
import com.billu.accounts.web.api.CustomerSummaryHistoricalController;
import com.billu.accounts.web.api.CustomerSummaryFirst30Controller;
import com.billu.accounts.web.api.CustomerSummaryCardCoverageController;
import com.billu.accounts.web.api.CustomerSummaryExportController;
import com.billu.categorization.web.api.CustomerCategorizationDashboardController;
import com.billu.categorization.web.api.CustomerCategorizationExportController;
import com.billu.categorization.web.api.CustomerCategorizationLookupController;
import com.billu.foundation.web.api.PlatformAuthController;
import com.billu.foundation.web.api.PlatformHealthController;
import com.billu.foundation.web.api.PlatformJobController;
import com.billu.foundation.web.api.PlatformMockDatasetController;
import com.billu.foundation.web.api.PlatformReadinessController;
import com.billu.foundation.web.api.LegacyDependencyController;
import com.billu.foundation.web.api.TransitionController;
import com.billu.foundation.web.errors.GlobalExceptionMapper;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.glassfish.jersey.server.ResourceConfig;

public class PlatformApplication extends ResourceConfig {
  public PlatformApplication() {
    register(PlatformHealthController.class);
    register(PlatformReadinessController.class);
    register(PlatformAuthController.class);
    register(PlatformJobController.class);
    register(PlatformMockDatasetController.class);
    register(LegacyDependencyController.class);
    register(TransitionController.class);
    register(CustomerSummaryOverviewController.class);
    register(CustomerSummaryHistoricalController.class);
    register(CustomerSummaryFirst30Controller.class);
    register(CustomerSummaryCardCoverageController.class);
    register(CustomerSummaryExportController.class);
    register(CustomerCategorizationDashboardController.class);
    register(CustomerCategorizationLookupController.class);
    register(CustomerCategorizationExportController.class);
    register(GlobalExceptionMapper.class);
    register(JacksonFeature.class);
    register(ObjectMapperProvider.class);
  }
}
