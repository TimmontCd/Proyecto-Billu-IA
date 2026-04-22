package com.billu.categorization.web.api;

import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.billu.categorization.web.CustomerCategorizationComponentFactory;
import com.billu.categorization.web.CustomerCategorizationMetricsPublisher;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/customer-categorization/exports")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomerCategorizationExportController {
  private final ExportCustomerCategorizationUseCase exportUseCase;
  private final CustomerCategorizationMetricsPublisher metricsPublisher;

  public CustomerCategorizationExportController() {
    this(CustomerCategorizationComponentFactory.getExportUseCase(),
        CustomerCategorizationComponentFactory.getMetricsPublisher());
  }

  public CustomerCategorizationExportController(
      ExportCustomerCategorizationUseCase exportUseCase,
      CustomerCategorizationMetricsPublisher metricsPublisher) {
    this.exportUseCase = exportUseCase;
    this.metricsPublisher = metricsPublisher;
  }

  @POST
  @Path("/segment")
  public Response exportSegment(CustomerCategorizationExportRequest request,
      @Context HttpServletRequest httpServletRequest) {
    try {
      return accepted(exportUseCase.exportSegment(
          request == null ? null : request.getSegmentId(),
          resolveCorrelationId(httpServletRequest)));
    } catch (IllegalArgumentException exception) {
      throw badRequest(exception.getMessage());
    }
  }

  @POST
  @Path("/cross-sell")
  public Response exportCrossSell(CustomerCategorizationExportRequest request,
      @Context HttpServletRequest httpServletRequest) {
    try {
      return accepted(exportUseCase.exportCrossSell(
          request == null ? null : request.getSegmentId(),
          resolveCorrelationId(httpServletRequest)));
    } catch (IllegalArgumentException exception) {
      throw badRequest(exception.getMessage());
    }
  }

  private Response accepted(CustomerCategorizationExportResult result) {
    metricsPublisher.recordExport(result);
    return Response.accepted(new CustomerCategorizationExportResponse(
        result.getExportType(),
        result.getSegmentId(),
        result.getSegmentLabel(),
        result.getOutcome(),
        result.getFileName(),
        result.getRowCount(),
        result.getCorrelationId(),
        result.getSummary())).build();
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }

  private WebApplicationException badRequest(String message) {
    return new WebApplicationException(
        Response.status(Response.Status.BAD_REQUEST).entity(message).build());
  }
}
