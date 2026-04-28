package com.billu.foundation.web.setup;

import com.billu.foundation.application.auth.AccessContextService;
import com.billu.foundation.application.dependencies.LegacyDependencyInventoryGateway;
import com.billu.foundation.application.dependencies.LegacyDependencyService;
import com.billu.foundation.application.jobs.JobExecutionService;
import com.billu.foundation.application.jobs.JsonSchedulerExecutor;
import com.billu.foundation.application.jobs.SchedulerCatalogLoader;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.application.transition.TransitionStatusService;
import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.application.validation.MockDatasetGateway;
import com.billu.foundation.application.validation.OracleReadinessGateway;
import com.billu.foundation.infrastructure.legacy.LegacyDependencyCatalog;
import com.billu.foundation.infrastructure.mock.MockDatasetLoader;
import com.billu.foundation.infrastructure.mock.MockDatasetRepository;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import com.billu.foundation.infrastructure.oracle.OracleReadinessProbe;
import com.billu.foundation.infrastructure.secrets.CyberArkSecretProvider;
import com.billu.foundation.infrastructure.secrets.LocalSecretProvider;
import com.billu.foundation.infrastructure.secrets.SecretResolutionService;
import com.billu.foundation.web.metrics.PlatformMetricsPublisher;
import com.billu.foundation.web.config.ProfileSwitchConfig;

public final class PlatformComponentFactory {
  private static volatile LocalValidationService localValidationService;
  private static volatile ProfileSwitchConfig profileSwitchConfig;
  private static volatile LegacyDependencyService legacyDependencyService;
  private static volatile TransitionStatusService transitionStatusService;
  private static volatile AccessContextService accessContextService;
  private static volatile SecretResolutionService secretResolutionService;
  private static volatile AuditTrailService auditTrailService;
  private static volatile JobExecutionService jobExecutionService;
  private static volatile PlatformMetricsPublisher platformMetricsPublisher;

  private PlatformComponentFactory() {
  }

  public static ProfileSwitchConfig getProfileSwitchConfig() {
    if (profileSwitchConfig == null) {
      synchronized (PlatformComponentFactory.class) {
        if (profileSwitchConfig == null) {
          profileSwitchConfig = new ProfileSwitchConfig();
        }
      }
    }
    return profileSwitchConfig;
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

  public static LegacyDependencyService getLegacyDependencyService() {
    if (legacyDependencyService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (legacyDependencyService == null) {
          legacyDependencyService = buildLegacyDependencyService();
        }
      }
    }
    return legacyDependencyService;
  }

  public static TransitionStatusService getTransitionStatusService() {
    if (transitionStatusService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (transitionStatusService == null) {
          transitionStatusService = buildTransitionStatusService();
        }
      }
    }
    return transitionStatusService;
  }

  public static AccessContextService getAccessContextService() {
    if (accessContextService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (accessContextService == null) {
          accessContextService = new AccessContextService(getProfileSwitchConfig().resolveEnvironmentProfile());
        }
      }
    }
    return accessContextService;
  }

  public static SecretResolutionService getSecretResolutionService() {
    if (secretResolutionService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (secretResolutionService == null) {
          secretResolutionService = new SecretResolutionService(
              new LocalSecretProvider(),
              new CyberArkSecretProvider(),
              getProfileSwitchConfig().getSecretProvider());
        }
      }
    }
    return secretResolutionService;
  }

  public static AuditTrailService getAuditTrailService() {
    if (auditTrailService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (auditTrailService == null) {
          auditTrailService = new AuditTrailService(new AuditEventRepository(), new AuditPublisher());
        }
      }
    }
    return auditTrailService;
  }

  public static JobExecutionService getJobExecutionService() {
    if (jobExecutionService == null) {
      synchronized (PlatformComponentFactory.class) {
        if (jobExecutionService == null) {
          jobExecutionService = new JobExecutionService(
              getProfileSwitchConfig().resolveEnvironmentProfile(),
              new JsonSchedulerExecutor(
                  new SchedulerCatalogLoader(),
                  getProfileSwitchConfig().getSchedulerCatalogPath()),
              getAuditTrailService(),
              getAccessContextService());
        }
      }
    }
    return jobExecutionService;
  }

  public static PlatformMetricsPublisher getPlatformMetricsPublisher() {
    if (platformMetricsPublisher == null) {
      synchronized (PlatformComponentFactory.class) {
        if (platformMetricsPublisher == null) {
          platformMetricsPublisher = new PlatformMetricsPublisher();
        }
      }
    }
    return platformMetricsPublisher;
  }

  private static LocalValidationService buildLocalValidationService() {
    final ProfileSwitchConfig profileSwitchConfig = getProfileSwitchConfig();
    final SecretResolutionService secretResolutionService = getSecretResolutionService();
    final OracleReadinessProbe oracleReadinessProbe = new OracleReadinessProbe();
    final MockDatasetLoader mockDatasetLoader = new MockDatasetLoader(new MockDatasetRepository());

    OracleReadinessGateway oracleReadinessGateway = new OracleReadinessGateway() {
      @Override
      public boolean isReady() {
        return oracleReadinessProbe.isReady(
            profileSwitchConfig.getOracleUrl(),
            profileSwitchConfig.getOracleUser(),
            secretResolutionService.resolve("BILLU_ORACLE_PASSWORD"));
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
        secretResolutionService.getEffectiveProvider(),
        oracleReadinessGateway,
        mockDatasetGateway);
  }

  private static LegacyDependencyService buildLegacyDependencyService() {
    final ProfileSwitchConfig profileSwitchConfig = getProfileSwitchConfig();
    final LegacyDependencyCatalog legacyDependencyCatalog = new LegacyDependencyCatalog();
    LegacyDependencyInventoryGateway inventoryGateway = new LegacyDependencyInventoryGateway() {
      @Override
      public java.util.List<com.billu.foundation.domain.LegacyDependency> listDependencies() {
        return legacyDependencyCatalog.listDependencies();
      }
    };
    return new LegacyDependencyService(profileSwitchConfig.resolveEnvironmentProfile(), inventoryGateway);
  }

  private static TransitionStatusService buildTransitionStatusService() {
    return new TransitionStatusService(
        getProfileSwitchConfig().resolveEnvironmentProfile(),
        getLocalValidationService(),
        getLegacyDependencyService());
  }
}
