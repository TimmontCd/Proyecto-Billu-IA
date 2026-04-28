package com.billu.foundation.application.transition;

import com.billu.foundation.application.dependencies.DependencyQueryUseCase;
import com.billu.foundation.application.dependencies.DependencyStatus;
import com.billu.foundation.application.dependencies.LegacyDependencyService;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.LegacyDependency;
import java.util.List;

public class TransitionStatusService implements TransitionStatusUseCase {
  private final EnvironmentProfile environmentProfile;
  private final DependencyQueryUseCase platformDependencyQueryUseCase;
  private final LegacyDependencyService legacyDependencyService;

  public TransitionStatusService(EnvironmentProfile environmentProfile,
      DependencyQueryUseCase platformDependencyQueryUseCase,
      LegacyDependencyService legacyDependencyService) {
    this.environmentProfile = environmentProfile;
    this.platformDependencyQueryUseCase = platformDependencyQueryUseCase;
    this.legacyDependencyService = legacyDependencyService;
  }

  @Override
  public TransitionStatus getStatus() {
    List<DependencyStatus> platformDependencies = platformDependencyQueryUseCase.listDependencies();
    List<LegacyDependency> legacyDependencies = legacyDependencyService.listLegacyDependencies();
    boolean hasNotReady = containsStatus(platformDependencies, "NOT_READY");
    boolean hasDegraded = containsStatus(platformDependencies, "DEGRADED");
    boolean rollbackAvailable = environmentProfile.isLegacyBridgeEnabled() && !legacyDependencies.isEmpty();

    if (hasNotReady && rollbackAvailable) {
      return new TransitionStatus(
          "FALLBACK_TO_LEGACY",
          "ACTIVE",
          "LEGACY",
          environmentProfile.getEnvironmentKey(),
          "Platform validation is blocked; legacy remains the operational path.");
    }
    if (rollbackAvailable && (hasDegraded || legacyDependencyService.hasReadOnlyCoverage())) {
      return new TransitionStatus(
          "COEXISTING",
          "READY",
          "FOUNDATION_WITH_LEGACY_FALLBACK",
          environmentProfile.getEnvironmentKey(),
          buildEvidence(legacyDependencies));
    }
    return new TransitionStatus(
        "FOUNDATION_ONLY",
        rollbackAvailable ? "READY" : "UNAVAILABLE",
        "FOUNDATION",
        environmentProfile.getEnvironmentKey(),
        rollbackAvailable
            ? "Legacy rollback remains available but inactive."
            : "No legacy bridge is configured for rollback.");
  }

  private boolean containsStatus(List<DependencyStatus> dependencies, String expectedStatus) {
    for (DependencyStatus dependency : dependencies) {
      if (expectedStatus.equals(dependency.getStatus())) {
        return true;
      }
    }
    return false;
  }

  private String buildEvidence(List<LegacyDependency> dependencies) {
    if (dependencies.isEmpty()) {
      return "No temporary legacy dependencies are cataloged.";
    }
    LegacyDependency firstDependency = dependencies.get(0);
    return "Read-only bridge cataloged for "
        + firstDependency.getBusinessCapability()
        + " with rollback criteria documented.";
  }
}
