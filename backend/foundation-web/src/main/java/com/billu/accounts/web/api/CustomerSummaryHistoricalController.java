package com.billu.accounts.web.api;

import com.billu.accounts.application.GetCustomerSummaryHistoricalUseCase;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import com.billu.accounts.web.CustomerSummaryComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/customer-summary/historical")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerSummaryHistoricalController {
  private final GetCustomerSummaryHistoricalUseCase historicalUseCase;

  public CustomerSummaryHistoricalController() {
    this(CustomerSummaryComponentFactory.getHistoricalUseCase());
  }

  public CustomerSummaryHistoricalController(GetCustomerSummaryHistoricalUseCase historicalUseCase) {
    this.historicalUseCase = historicalUseCase;
  }

  @GET
  public CustomerSummaryHistoricalResponse getHistorical(@QueryParam("startDate") String startDate,
      @QueryParam("endDate") String endDate, @Context HttpServletRequest request) {
    String correlationId = resolveCorrelationId(request);
    CustomerSummaryHistoricalView view = historicalUseCase.execute(startDate, endDate, correlationId);
    return new CustomerSummaryHistoricalResponse(
        view.getEnvironment(),
        correlationId,
        view.getFilters(),
        view.getTrend(),
        view.getMonthlySummary());
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
