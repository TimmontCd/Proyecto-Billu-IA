package com.billu.categorization.web.api;

import com.billu.categorization.application.FindCustomerCategorizationByRewardsIdUseCase;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import com.billu.categorization.web.CustomerCategorizationComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/customer-categorization/rewards")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerCategorizationLookupController {
  private final FindCustomerCategorizationByRewardsIdUseCase lookupUseCase;

  public CustomerCategorizationLookupController() {
    this(CustomerCategorizationComponentFactory.getLookupUseCase());
  }

  public CustomerCategorizationLookupController(
      FindCustomerCategorizationByRewardsIdUseCase lookupUseCase) {
    this.lookupUseCase = lookupUseCase;
  }

  @GET
  @Path("/{rewardsId}")
  public CustomerCategorizationLookupResponse findByRewardsId(
      @PathParam("rewardsId") String rewardsId, @Context HttpServletRequest request) {
    String correlationId = resolveCorrelationId(request);
    try {
      CustomerCategorizationLookupResult result =
          lookupUseCase.execute(rewardsId, correlationId);
      CustomerCategorizationComponentFactory.getMetricsPublisher().recordLookup(
          result.getEnvironment(), result.getRewardsId(), correlationId);
      return new CustomerCategorizationLookupResponse(
          result.getEnvironment(),
          correlationId,
          result.getRewardsId(),
          result.getTotalMatches(),
          result.getExecutiveSummary(),
          result.getRows());
    } catch (IllegalArgumentException exception) {
      throw new WebApplicationException(
          Response.status(Response.Status.NOT_FOUND).entity(exception.getMessage()).build());
    }
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
