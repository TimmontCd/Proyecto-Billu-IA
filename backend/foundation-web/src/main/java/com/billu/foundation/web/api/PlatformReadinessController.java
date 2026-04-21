package com.billu.foundation.web.api;

import com.billu.foundation.application.dependencies.DependencyStatus;
import com.billu.foundation.application.readiness.ReadinessStatus;
import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/internal/platform")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformReadinessController {
  private final LocalValidationService localValidationService;

  public PlatformReadinessController() {
    this(PlatformComponentFactory.getLocalValidationService());
  }

  public PlatformReadinessController(LocalValidationService localValidationService) {
    this.localValidationService = localValidationService;
  }

  @GET
  @Path("/readiness")
  public Response getReadiness() {
    ReadinessStatus readinessStatus = localValidationService.getReadiness();
    ReadinessResponse response = new ReadinessResponse(
        readinessStatus.getStatus(),
        readinessStatus.getEnvironment(),
        mapDependencies(localValidationService.listDependencies()));
    Response.Status httpStatus = "READY".equals(readinessStatus.getStatus())
        ? Response.Status.OK
        : Response.Status.SERVICE_UNAVAILABLE;
    return Response.status(httpStatus).entity(response).build();
  }

  @GET
  @Path("/dependencies")
  public DependenciesResponse listDependencies() {
    return new DependenciesResponse(mapDependencies(localValidationService.listDependencies()));
  }

  private List<DependencySummaryResponse> mapDependencies(List<DependencyStatus> statuses) {
    List<DependencySummaryResponse> responses = new ArrayList<DependencySummaryResponse>();
    for (DependencyStatus status : statuses) {
      responses.add(new DependencySummaryResponse(
          status.getDependencyKey(),
          status.getDependencyType(),
          status.getStatus(),
          status.getMode(),
          status.getDetails()));
    }
    return responses;
  }
}
