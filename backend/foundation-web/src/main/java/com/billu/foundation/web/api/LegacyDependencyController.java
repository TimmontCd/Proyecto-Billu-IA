package com.billu.foundation.web.api;

import com.billu.foundation.application.dependencies.LegacyDependencyService;
import com.billu.foundation.domain.LegacyDependency;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("/platform/dependencies/legacy")
@Produces(MediaType.APPLICATION_JSON)
public class LegacyDependencyController {
  private final LegacyDependencyService legacyDependencyService;

  public LegacyDependencyController() {
    this(PlatformComponentFactory.getLegacyDependencyService());
  }

  public LegacyDependencyController(LegacyDependencyService legacyDependencyService) {
    this.legacyDependencyService = legacyDependencyService;
  }

  @GET
  public LegacyDependenciesResponse listLegacyDependencies() {
    List<LegacyDependencyResponse> responses = new ArrayList<LegacyDependencyResponse>();
    for (LegacyDependency dependency : legacyDependencyService.listLegacyDependencies()) {
      responses.add(new LegacyDependencyResponse(
          dependency.getDependencyKey(),
          dependency.getDependencyType(),
          dependency.getSourceReference(),
          dependency.getBusinessCapability(),
          dependency.getAccessMode(),
          dependency.getOwner(),
          dependency.getExitCriteria(),
          dependency.getRiskLevel(),
          dependency.getStatus()));
    }
    String bridgeMode = legacyDependencyService.hasReadOnlyCoverage() ? "READ_ONLY" : "DISABLED";
    return new LegacyDependenciesResponse(
        legacyDependencyService.getEnvironmentKey(),
        bridgeMode,
        responses);
  }
}
