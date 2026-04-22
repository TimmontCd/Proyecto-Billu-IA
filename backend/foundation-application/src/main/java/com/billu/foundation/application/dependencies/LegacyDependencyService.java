package com.billu.foundation.application.dependencies;

import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.LegacyDependency;
import java.util.ArrayList;
import java.util.List;

public class LegacyDependencyService implements DependencyQueryUseCase {
  private final EnvironmentProfile environmentProfile;
  private final LegacyDependencyInventoryGateway inventoryGateway;

  public LegacyDependencyService(EnvironmentProfile environmentProfile,
      LegacyDependencyInventoryGateway inventoryGateway) {
    this.environmentProfile = environmentProfile;
    this.inventoryGateway = inventoryGateway;
  }

  public List<LegacyDependency> listLegacyDependencies() {
    return inventoryGateway.listDependencies();
  }

  @Override
  public List<DependencyStatus> listDependencies() {
    List<DependencyStatus> statuses = new ArrayList<DependencyStatus>();
    for (LegacyDependency dependency : listLegacyDependencies()) {
      statuses.add(new DependencyStatus(
          dependency.getDependencyKey(),
          dependency.getDependencyType(),
          resolveStatus(dependency),
          dependency.getAccessMode(),
          buildDetails(dependency)));
    }
    return statuses;
  }

  public boolean hasReadOnlyCoverage() {
    for (LegacyDependency dependency : listLegacyDependencies()) {
      if ("READ_ONLY".equals(dependency.getAccessMode())) {
        return true;
      }
    }
    return false;
  }

  public String getEnvironmentKey() {
    return environmentProfile.getEnvironmentKey();
  }

  private String resolveStatus(LegacyDependency dependency) {
    if (!environmentProfile.isLegacyBridgeEnabled()) {
      return "NOT_READY";
    }
    if ("BRIDGED".equals(dependency.getStatus())) {
      return "BRIDGED";
    }
    return "READY";
  }

  private String buildDetails(LegacyDependency dependency) {
    return dependency.getBusinessCapability()
        + " via "
        + dependency.getSourceReference()
        + ". Exit: "
        + dependency.getExitCriteria();
  }
}
