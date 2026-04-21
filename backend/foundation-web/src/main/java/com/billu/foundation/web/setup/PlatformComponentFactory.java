package com.billu.foundation.web.setup;

import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.application.validation.MockDatasetGateway;
import com.billu.foundation.application.validation.OracleReadinessGateway;
import com.billu.foundation.infrastructure.mock.MockDatasetLoader;
import com.billu.foundation.infrastructure.mock.MockDatasetRepository;
import com.billu.foundation.infrastructure.oracle.OracleReadinessProbe;
import com.billu.foundation.web.config.ProfileSwitchConfig;

public final class PlatformComponentFactory {
  private static volatile LocalValidationService localValidationService;

  private PlatformComponentFactory() {
  }

  public static LocalValidationService getLocalValidationService() {
    if (localValidationService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (localValidationService == null) {
          localValidationService = buildLocalValidationService();
        }
      }
    }
    return localValidationService;
  }

  private static LocalValidationService buildLocalValidationService() {
    final ProfileSwitchConfig profileSwitchConfig = new ProfileSwitchConfig();
    final OracleReadinessProbe oracleReadinessProbe = new OracleReadinessProbe();
    final MockDatasetLoader mockDatasetLoader = new MockDatasetLoader(new MockDatasetRepository());

    OracleReadinessGateway oracleReadinessGateway = new OracleReadinessGateway() {
      @Override
      public boolean isReady() {
        return oracleReadinessProbe.isReady(
            profileSwitchConfig.getOracleUrl(),
            profileSwitchConfig.getOracleUser(),
            profileSwitchConfig.getOraclePassword());
      }
    };

    MockDatasetGateway mockDatasetGateway = new MockDatasetGateway() {
      @Override
      public com.billu.foundation.domain.MockDataset load(String datasetKey, boolean resetBeforeLoad)
          throws java.io.IOException {
        String effectiveKey = datasetKey == null || datasetKey.trim().isEmpty()
            ? profileSwitchConfig.getBootstrapDatasetKey()
            : datasetKey;
        return mockDatasetLoader.load(effectiveKey);
      }
    };

    return new LocalValidationService(
        profileSwitchConfig.resolveEnvironmentProfile(),
        profileSwitchConfig.getServiceName(),
        profileSwitchConfig.getServiceVersion(),
        profileSwitchConfig.getSchedulerCatalogPath(),
        profileSwitchConfig.getSecretProvider(),
        oracleReadinessGateway,
        mockDatasetGateway);
  }
}
