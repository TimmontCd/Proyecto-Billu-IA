package com.billu.foundation.web.api;

import java.util.List;

public class DependenciesResponse {
  private final List<DependencySummaryResponse> dependencies;

  public DependenciesResponse(List<DependencySummaryResponse> dependencies) {
    this.dependencies = dependencies;
  }

  public List<DependencySummaryResponse> getDependencies() { return dependencies; }
}
