package com.billu.categorization.web;

import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.CustomerCategorizationDashboardGateway;
import com.billu.categorization.application.CustomerCategorizationExportGateway;
import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.application.FindCustomerCategorizationByRewardsIdUseCase;
import com.billu.categorization.application.GetCustomerCategorizationDashboardUseCase;
import com.billu.categorization.infrastructure.legacy.LegacyCustomerCategorizationExportAdapter;
import com.billu.categorization.infrastructure.legacy.LegacyCustomerCategorizationLookupAdapter;
import com.billu.categorization.infrastructure.legacy.LegacyCustomerCategorizationDashboardAdapter;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationLookupGateway;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationLookupRepository;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationDashboardRepository;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationDatasetLoader;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationExportRepository;
import com.billu.categorization.infrastructure.oracle.OracleCustomerCategorizationExportRepository;
import com.billu.categorization.infrastructure.oracle.OracleCustomerCategorizationLookupRepository;
import com.billu.categorization.infrastructure.oracle.OracleCustomerCategorizationDashboardRepository;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.web.config.ProfileSwitchConfig;
import com.billu.foundation.web.setup.PlatformComponentFactory;

public final class CustomerCategorizationComponentFactory {
  private static volatile GetCustomerCategorizationDashboardUseCase dashboardUseCase;
  private static volatile FindCustomerCategorizationByRewardsIdUseCase lookupUseCase;
  private static volatile ExportCustomerCategorizationUseCase exportUseCase;
  private static volatile CustomerCategorizationMetricsPublisher metricsPublisher;

  private CustomerCategorizationComponentFactory() {
  }

  public static GetCustomerCategorizationDashboardUseCase getDashboardUseCase() {
    if (dashboardUseCase == null) {
      synchronized (CustomerCategorizationComponentFactory.class) {
        if (dashboardUseCase == null) {
          dashboardUseCase = new GetCustomerCategorizationDashboardUseCase(
              buildDashboardGateway(),
              new CustomerCategorizationAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return dashboardUseCase;
  }

  public static CustomerCategorizationMetricsPublisher getMetricsPublisher() {
    if (metricsPublisher == null) {
      synchronized (CustomerCategorizationComponentFactory.class) {
        if (metricsPublisher == null) {
          metricsPublisher = new CustomerCategorizationMetricsPublisher();
        }
      }
    }
    return metricsPublisher;
  }

  public static FindCustomerCategorizationByRewardsIdUseCase getLookupUseCase() {
    if (lookupUseCase == null) {
      synchronized (CustomerCategorizationComponentFactory.class) {
        if (lookupUseCase == null) {
          lookupUseCase = new FindCustomerCategorizationByRewardsIdUseCase(
              buildLookupGateway(),
              new CustomerCategorizationAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return lookupUseCase;
  }

  public static ExportCustomerCategorizationUseCase getExportUseCase() {
    if (exportUseCase == null) {
      synchronized (CustomerCategorizationComponentFactory.class) {
        if (exportUseCase == null) {
          exportUseCase = new ExportCustomerCategorizationUseCase(
              buildExportGateway(),
              new CustomerCategorizationAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return exportUseCase;
  }

  private static CustomerCategorizationDashboardGateway buildDashboardGateway() {
    ProfileSwitchConfig profileSwitchConfig = PlatformComponentFactory.getProfileSwitchConfig();
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new MockCustomerCategorizationDatasetLoader(
          new MockCustomerCategorizationDashboardRepository());
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyCustomerCategorizationDashboardAdapter();
    }
    return new OracleCustomerCategorizationDashboardRepository(
        profileSwitchConfig.getActiveEnvironment(),
        profileSwitchConfig.getOracleUrl(),
        profileSwitchConfig.getOracleUser(),
        profileSwitchConfig.getOraclePassword());
  }

  private static CustomerCategorizationLookupGateway buildLookupGateway() {
    ProfileSwitchConfig profileSwitchConfig = PlatformComponentFactory.getProfileSwitchConfig();
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new MockCustomerCategorizationLookupGateway(
          new MockCustomerCategorizationLookupRepository());
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyCustomerCategorizationLookupAdapter();
    }
    return new OracleCustomerCategorizationLookupRepository(
        profileSwitchConfig.getActiveEnvironment(),
        profileSwitchConfig.getOracleUrl(),
        profileSwitchConfig.getOracleUser(),
        profileSwitchConfig.getOraclePassword());
  }

  private static CustomerCategorizationExportGateway buildExportGateway() {
    ProfileSwitchConfig profileSwitchConfig = PlatformComponentFactory.getProfileSwitchConfig();
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new MockCustomerCategorizationExportRepository();
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyCustomerCategorizationExportAdapter();
    }
    return new OracleCustomerCategorizationExportRepository(
        profileSwitchConfig.getActiveEnvironment(),
        profileSwitchConfig.getOracleUrl(),
        profileSwitchConfig.getOracleUser(),
        profileSwitchConfig.getOraclePassword());
  }
}
