package com.billu.accounts.web.api;

import com.billu.accounts.application.GetCustomerSummaryFirst30UseCase;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.web.CustomerSummaryComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/customer-summary/first30")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerSummaryFirst30Controller {
  private final GetCustomerSummaryFirst30UseCase first30UseCase;

  public CustomerSummaryFirst30Controller() {
    this(CustomerSummaryComponentFactory.getFirst30UseCase());
  }

  public CustomerSummaryFirst30Controller(GetCustomerSummaryFirst30UseCase first30UseCase) {
    this.first30UseCase = first30UseCase;
  }

  @GET
  public CustomerSummaryFirst30Response getFirst30(@Context HttpServletRequest request) {
    String correlationId = resolveCorrelationId(request);
    CustomerSummaryFirst30View view = first30UseCase.execute(correlationId);
    return new CustomerSummaryFirst30Response(
        view.getEnvironment(),
        correlationId,
        view.getReferenceDate(),
        view.getTotalSummary(),
        view.getMonthlySummary());
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
