package com.billu.accounts.web.api;

import com.billu.accounts.application.ExportCustomerSummaryUseCase;
import com.billu.accounts.domain.AccountsExportResult;
import com.billu.accounts.web.CustomerSummaryComponentFactory;
import com.billu.accounts.web.CustomerSummaryMetricsPublisher;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/customer-summary/exports")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomerSummaryExportController {
  private final ExportCustomerSummaryUseCase exportUseCase;
  private final CustomerSummaryMetricsPublisher metricsPublisher;

  public CustomerSummaryExportController() {
    this(CustomerSummaryComponentFactory.getExportUseCase(),
        CustomerSummaryComponentFactory.getMetricsPublisher());
  }

  public CustomerSummaryExportController(ExportCustomerSummaryUseCase exportUseCase,
      CustomerSummaryMetricsPublisher metricsPublisher) {
    this.exportUseCase = exportUseCase;
    this.metricsPublisher = metricsPublisher;
  }

  @POST
  @Path("/historical-month")
  public Response exportHistoricalMonth(CustomerSummaryExportRequest request,
      @Context HttpServletRequest httpServletRequest) {
    try {
      return accepted(exportUseCase.exportHistoricalMonth(
          request == null ? null : request.getSelectedYear(),
          request == null ? null : request.getSelectedMonth(),
          resolveCorrelationId(httpServletRequest)));
    } catch (IllegalArgumentException exception) {
      throw badRequest(exception.getMessage());
    }
  }

  @POST
  @Path("/first30-month")
  public Response exportFirst30Month(CustomerSummaryExportRequest request,
      @Context HttpServletRequest httpServletRequest) {
    try {
      return accepted(exportUseCase.exportFirst30Month(
          request == null ? null : request.getSelectedYear(),
          request == null ? null : request.getSelectedMonth(),
          resolveCorrelationId(httpServletRequest)));
    } catch (IllegalArgumentException exception) {
      throw badRequest(exception.getMessage());
    }
  }

  @POST
  @Path("/card-coverage")
  public Response exportCardCoverage(@Context HttpServletRequest httpServletRequest) {
    return accepted(exportUseCase.exportCardCoverage(resolveCorrelationId(httpServletRequest)));
  }

  private Response accepted(AccountsExportResult result) {
    metricsPublisher.recordExport(result);
    return Response.accepted(new CustomerSummaryExportResponse(
        result.getExportType(),
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
