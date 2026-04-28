package com.billu.foundation.web.api;

import java.util.List;

public class LegacyDependenciesResponse {
  private final String environment;
  private final String bridgeMode;
  private final List<LegacyDependencyResponse> dependencies;

  public LegacyDependenciesResponse(String environment, String bridgeMode,
      List<LegacyDependencyResponse> dependencies) {
    this.environment = environment;
    this.bridgeMode = bridgeMode;
    this.dependencies = dependencies;
  }

  public String getEnvironment() { return environment; }
  public String getBridgeMode() { return bridgeMode; }
  public List<LegacyDependencyResponse> getDependencies() { return dependencies; }
}
