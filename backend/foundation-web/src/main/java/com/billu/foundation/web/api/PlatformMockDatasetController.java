package com.billu.foundation.web.api;

import com.billu.foundation.application.datasets.MockDatasetLoadCommand;
import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.domain.MockDataset;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/internal/platform/mock-datasets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformMockDatasetController {
  private final LocalValidationService localValidationService;

  public PlatformMockDatasetController() {
    this(PlatformComponentFactory.getLocalValidationService());
  }

  public PlatformMockDatasetController(LocalValidationService localValidationService) {
    this.localValidationService = localValidationService;
  }

  @POST
  @Path("/{datasetKey}/load")
  public Response loadDataset(@PathParam("datasetKey") String datasetKey,
      MockDatasetLoadRequest request,
      @Context HttpServletRequest httpServletRequest) {
    try {
      boolean resetBeforeLoad = request != null && request.isResetBeforeLoad();
      MockDataset dataset = localValidationService
          .load(new MockDatasetLoadCommand(datasetKey, resetBeforeLoad));
      MockDatasetLoadResponse response = new MockDatasetLoadResponse(
          dataset.getDatasetKey(),
          dataset.getStatus(),
          localValidationService.getHealth().getEnvironment(),
          dataset.getVersion(),
          resolveCorrelationId(httpServletRequest));
      return Response.accepted(response).build();
    } catch (IllegalArgumentException exception) {
      throw new WebApplicationException(
          Response.status(Response.Status.NOT_FOUND)
              .entity(ApiEnvelope.error(exception.getMessage()))
              .build());
    } catch (IllegalStateException exception) {
      throw new WebApplicationException(
          Response.status(Response.Status.BAD_REQUEST)
              .entity(ApiEnvelope.error(exception.getMessage()))
              .build());
    }
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
