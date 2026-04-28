package com.billu.foundation.application.validation;

import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.datasets.MockDatasetLoadCommand;
import com.billu.foundation.application.datasets.MockDatasetValidator;
import com.billu.foundation.application.datasets.MockDatasetLoadUseCase;
import com.billu.foundation.application.dependencies.DependencyQueryUseCase;
import com.billu.foundation.application.dependencies.DependencyStatus;
import com.billu.foundation.application.health.HealthCheckUseCase;
import com.billu.foundation.application.health.HealthStatus;
import com.billu.foundation.application.readiness.ReadinessStatus;
import com.billu.foundation.application.readiness.ReadinessUseCase;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.MockDataset;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class LocalValidationService implements HealthCheckUseCase, ReadinessUseCase,
    DependencyQueryUseCase, AccessContextQueryUseCase, MockDatasetLoadUseCase {
  private final EnvironmentProfile environmentProfile;
  private final String serviceName;
  private final String serviceVersion;
  private final String schedulerCatalogPath;
  private final String secretProvider;
  private final OracleReadinessGateway oracleReadinessGateway;
  private final MockDatasetGateway mockDatasetGateway;
  private final MockDatasetValidator mockDatasetValidator;

  public LocalValidationService(EnvironmentProfile environmentProfile, String serviceName,
      String serviceVersion, String schedulerCatalogPath, String secretProvider,
      OracleReadinessGateway oracleReadinessGateway, MockDatasetGateway mockDatasetGateway) {
    this(environmentProfile, serviceName, serviceVersion, schedulerCatalogPath, secretProvider,
        oracleReadinessGateway, mockDatasetGateway, new MockDatasetValidator());
  }

  public LocalValidationService(EnvironmentProfile environmentProfile, String serviceName,
      String serviceVersion, String schedulerCatalogPath, String secretProvider,
      OracleReadinessGateway oracleReadinessGateway, MockDatasetGateway mockDatasetGateway,
      MockDatasetValidator mockDatasetValidator) {
    this.environmentProfile = environmentProfile;
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
    this.schedulerCatalogPath = schedulerCatalogPath;
    this.secretProvider = secretProvider;
    this.oracleReadinessGateway = oracleReadinessGateway;
    this.mockDatasetGateway = mockDatasetGateway;
    this.mockDatasetValidator = mockDatasetValidator;
  }

  @Override
  public HealthStatus getHealth() {
    return new HealthStatus("UP", serviceName, environmentProfile.getEnvironmentKey());
  }

  @Override
  public ReadinessStatus getReadiness() {
    String status = "READY";
    for (DependencyStatus dependencyStatus : listDependencies()) {
      if ("NOT_READY".equals(dependencyStatus.getStatus())) {
        status = "NOT_READY";
        break;
      }
      if ("DEGRADED".equals(dependencyStatus.getStatus())) {
        status = "DEGRADED";
      }
    }
    return new ReadinessStatus(status, environmentProfile.getEnvironmentKey());
  }

  @Override
  public List<DependencyStatus> listDependencies() {
    List<DependencyStatus> dependencies = new ArrayList<DependencyStatus>();
    dependencies.add(new DependencyStatus(
        "scheduler-catalog",
        "SCHEDULER",
        isBlank(schedulerCatalogPath) ? "NOT_READY" : "READY",
        "JSON",
        isBlank(schedulerCatalogPath) ? "Missing scheduler catalog path"
            : "Loaded from " + schedulerCatalogPath));
    dependencies.add(new DependencyStatus(
        "mock-datasets",
        "DATASET",
        environmentProfile.isMockModeEnabled() ? "READY" : "BRIDGED",
        environmentProfile.isMockModeEnabled() ? "LOCAL_MOCK" : "DISABLED",
        environmentProfile.isMockModeEnabled()
            ? "Local mock datasets available for smoke validation"
            : "Mock dataset loading disabled for this profile"));
    dependencies.add(new DependencyStatus(
        "oracle",
        "DATABASE",
        resolveOracleStatus(),
        environmentProfile.isOracleModeEnabled() ? "ORACLE" : "DISABLED",
        environmentProfile.isOracleModeEnabled()
            ? "Oracle readiness driven by external credentials"
            : "Oracle disabled for this environment"));
    dependencies.add(new DependencyStatus(
        "legacy-bridge",
        "LEGACY_ADAPTER",
        environmentProfile.isLegacyBridgeEnabled() ? "BRIDGED" : "NOT_READY",
        environmentProfile.isLegacyBridgeEnabled() ? "READ_ONLY" : "DISABLED",
        environmentProfile.isLegacyBridgeEnabled()
            ? "Legacy adapters remain read-only during transition"
            : "Legacy bridge disabled"));
    dependencies.add(new DependencyStatus(
        "secret-provider",
        "SECRETS",
        isBlank(secretProvider) ? "NOT_READY" : "READY",
        isBlank(secretProvider) ? "UNRESOLVED" : secretProvider.toUpperCase(),
        isBlank(secretProvider) ? "Secret provider is not configured"
            : "Secrets resolved through " + secretProvider));
    return dependencies;
  }

  @Override
  public AccessContext getAccessContext() {
    return new AccessContext(
        "local-platform-admin",
        "local.developer@billu",
        "LOCAL_MOCK",
        Arrays.asList("PLATFORM_ADMIN", "FOUNDATION_OPERATOR"),
        Arrays.asList("foundation:read", "foundation:write", "foundation:operate"),
        environmentProfile.getEnvironmentKey(),
        environmentProfile.isOracleModeEnabled() ? "LOCAL_ORACLE" : "LOCAL_MOCK",
        Instant.now());
  }

  @Override
  public MockDataset load(MockDatasetLoadCommand command) {
    if (!environmentProfile.isMockModeEnabled()) {
      throw new IllegalStateException("Mock dataset loading is only available in local-mock mode");
    }
    try {
      MockDataset dataset = mockDatasetGateway.load(command.getDatasetKey(), command.isResetBeforeLoad());
      if (dataset == null) {
        throw new IllegalArgumentException("Dataset not found: " + command.getDatasetKey());
      }
      mockDatasetValidator.validate(dataset);
      return new MockDataset(
          dataset.getDatasetKey(),
          dataset.getVersion(),
          dataset.getSupportedContracts(),
          dataset.getSourceFormat(),
          dataset.getOwner(),
          dataset.getConsistencyLevel(),
          "LOADED");
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load dataset " + command.getDatasetKey(), exception);
    }
  }

  public String getServiceVersion() {
    return serviceVersion;
  }

  private String resolveOracleStatus() {
    if (!environmentProfile.isOracleModeEnabled()) {
      return "BRIDGED";
    }
    return oracleReadinessGateway.isReady() ? "READY" : "DEGRADED";
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }
}
