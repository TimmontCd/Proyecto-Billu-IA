package com.billu.accounts.web;

import com.billu.accounts.application.AccountsHistoricalGateway;
import com.billu.accounts.application.AccountsSummaryGateway;
import com.billu.accounts.application.AccountsCardCoverageGateway;
import com.billu.accounts.application.AccountsExportGateway;
import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.ExportCustomerSummaryUseCase;
import com.billu.accounts.application.GetCustomerSummaryCardCoverageUseCase;
import com.billu.accounts.application.GetCustomerSummaryFirst30UseCase;
import com.billu.accounts.application.GetCustomerSummaryHistoricalUseCase;
import com.billu.accounts.application.GetCustomerSummaryOverviewUseCase;
import com.billu.accounts.infrastructure.legacy.LegacyAccountsCardCoverageAdapter;
import com.billu.accounts.infrastructure.legacy.LegacyAccountsExportAdapter;
import com.billu.accounts.infrastructure.legacy.LegacyAccountsSummaryAdapter;
import com.billu.accounts.infrastructure.mock.MockAccountsCardCoverageRepository;
import com.billu.accounts.infrastructure.mock.MockAccountsDatasetLoader;
import com.billu.accounts.infrastructure.mock.MockAccountsExportRepository;
import com.billu.accounts.infrastructure.mock.MockAccountsHistoricalRepository;
import com.billu.accounts.infrastructure.mock.MockAccountsSummaryRepository;
import com.billu.accounts.infrastructure.legacy.LegacyAccountsHistoricalAdapter;
import com.billu.accounts.infrastructure.oracle.OracleAccountsCardCoverageRepository;
import com.billu.accounts.infrastructure.oracle.OracleAccountsExportRepository;
import com.billu.accounts.infrastructure.oracle.OracleAccountsHistoricalRepository;
import com.billu.accounts.infrastructure.oracle.OracleAccountsSummaryRepository;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.web.config.ProfileSwitchConfig;
import com.billu.foundation.web.setup.PlatformComponentFactory;

public final class CustomerSummaryComponentFactory {
  private static volatile GetCustomerSummaryOverviewUseCase overviewUseCase;
  private static volatile GetCustomerSummaryHistoricalUseCase historicalUseCase;
  private static volatile GetCustomerSummaryFirst30UseCase first30UseCase;
  private static volatile GetCustomerSummaryCardCoverageUseCase cardCoverageUseCase;
  private static volatile ExportCustomerSummaryUseCase exportUseCase;
  private static volatile CustomerSummaryMetricsPublisher metricsPublisher;

  private CustomerSummaryComponentFactory() {
  }

  public static GetCustomerSummaryOverviewUseCase getOverviewUseCase() {
    if (overviewUseCase == null) {
      synchronized (CustomerSummaryComponentFactory.class) {
        if (overviewUseCase == null) {
          overviewUseCase = new GetCustomerSummaryOverviewUseCase(
              buildAccountsSummaryGateway(),
              new CustomerSummaryAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return overviewUseCase;
  }

  public static CustomerSummaryMetricsPublisher getMetricsPublisher() {
    if (metricsPublisher == null) {
      synchronized (CustomerSummaryComponentFactory.class) {
        if (metricsPublisher == null) {
          metricsPublisher = new CustomerSummaryMetricsPublisher();
        }
      }
    }
    return metricsPublisher;
  }

  public static GetCustomerSummaryHistoricalUseCase getHistoricalUseCase() {
    if (historicalUseCase == null) {
      synchronized (CustomerSummaryComponentFactory.class) {
        if (historicalUseCase == null) {
          historicalUseCase = new GetCustomerSummaryHistoricalUseCase(
              buildAccountsHistoricalGateway(),
              new CustomerSummaryAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return historicalUseCase;
  }

  public static GetCustomerSummaryFirst30UseCase getFirst30UseCase() {
    if (first30UseCase == null) {
      synchronized (CustomerSummaryComponentFactory.class) {
        if (first30UseCase == null) {
          first30UseCase = new GetCustomerSummaryFirst30UseCase(
              buildAccountsHistoricalGateway(),
              new CustomerSummaryAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return first30UseCase;
  }

  public static GetCustomerSummaryCardCoverageUseCase getCardCoverageUseCase() {
    if (cardCoverageUseCase == null) {
      synchronized (CustomerSummaryComponentFactory.class) {
        if (cardCoverageUseCase == null) {
          cardCoverageUseCase = new GetCustomerSummaryCardCoverageUseCase(
              buildAccountsCardCoverageGateway(),
              new CustomerSummaryAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return cardCoverageUseCase;
  }

  public static ExportCustomerSummaryUseCase getExportUseCase() {
    if (exportUseCase == null) {
      synchronized (CustomerSummaryComponentFactory.class) {
        if (exportUseCase == null) {
          exportUseCase = new ExportCustomerSummaryUseCase(
              buildAccountsExportGateway(),
              new CustomerSummaryAuditService(PlatformComponentFactory.getAuditTrailService()),
              PlatformComponentFactory.getAccessContextService());
        }
      }
    }
    return exportUseCase;
  }

  private static AccountsSummaryGateway buildAccountsSummaryGateway() {
    ProfileSwitchConfig profileSwitchConfig = PlatformComponentFactory.getProfileSwitchConfig();
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new MockAccountsDatasetLoader(
          new MockAccountsSummaryRepository(),
          new MockAccountsHistoricalRepository());
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyAccountsSummaryAdapter();
    }
    return new OracleAccountsSummaryRepository(
        profileSwitchConfig.getActiveEnvironment(),
        profileSwitchConfig.getOracleUrl(),
        profileSwitchConfig.getOracleUser(),
        profileSwitchConfig.getOraclePassword());
  }

  private static AccountsHistoricalGateway buildAccountsHistoricalGateway() {
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new MockAccountsDatasetLoader(
          new MockAccountsSummaryRepository(),
          new MockAccountsHistoricalRepository());
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyAccountsHistoricalAdapter();
    }
    return new OracleAccountsHistoricalRepository();
  }

  private static AccountsCardCoverageGateway buildAccountsCardCoverageGateway() {
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new AccountsCardCoverageGateway() {
        @Override
        public com.billu.accounts.domain.CardCoverageSnapshot getCoverage() {
          try {
            return new MockAccountsCardCoverageRepository().loadCoverage();
          } catch (java.io.IOException exception) {
            throw new IllegalStateException("Unable to load customer summary card coverage mock dataset",
                exception);
          }
        }
      };
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyAccountsCardCoverageAdapter();
    }
    return new OracleAccountsCardCoverageRepository();
  }

  private static AccountsExportGateway buildAccountsExportGateway() {
    EnvironmentProfile environmentProfile = PlatformComponentFactory.getProfileSwitchConfig()
        .resolveEnvironmentProfile();
    if (environmentProfile.isMockModeEnabled()) {
      return new MockAccountsExportRepository();
    }
    if (environmentProfile.isLegacyBridgeEnabled()) {
      return new LegacyAccountsExportAdapter();
    }
    return new OracleAccountsExportRepository();
  }
}
