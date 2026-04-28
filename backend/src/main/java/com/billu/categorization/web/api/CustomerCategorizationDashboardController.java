package com.billu.categorization.web.api;

import com.billu.categorization.application.GetCustomerCategorizationDashboardUseCase;
import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.categorization.domain.CustomerSegmentSummary;
import com.billu.categorization.web.CustomerCategorizationComponentFactory;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/customer-categorization/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerCategorizationDashboardController {
  private final GetCustomerCategorizationDashboardUseCase dashboardUseCase;

  public CustomerCategorizationDashboardController() {
    this(CustomerCategorizationComponentFactory.getDashboardUseCase());
  }

  public CustomerCategorizationDashboardController(
      GetCustomerCategorizationDashboardUseCase dashboardUseCase) {
    this.dashboardUseCase = dashboardUseCase;
  }

  @GET
  public CustomerCategorizationDashboardResponse getDashboard(@Context HttpServletRequest request) {
    String correlationId = resolveCorrelationId(request);
    CustomerCategorizationDashboard dashboard = dashboardUseCase.execute(correlationId);
    CustomerCategorizationComponentFactory.getMetricsPublisher().recordDashboard(dashboard,
        correlationId);
    return new CustomerCategorizationDashboardResponse(
        dashboard.getDashboardId(),
        dashboard.getEnvironment(),
        dashboard.getSourceMode(),
        dashboard.getExecutiveSummary(),
        correlationId,
        dashboard.getGeneratedAt(),
        dashboard.getKpis(),
        mapSegments(dashboard.getSegmentSummary()));
  }

  private List<CustomerSegmentSummaryResponse> mapSegments(List<CustomerSegmentSummary> segments) {
    List<CustomerSegmentSummaryResponse> responses =
        new ArrayList<CustomerSegmentSummaryResponse>();
    if (segments == null) {
      return responses;
    }
    for (CustomerSegmentSummary segment : segments) {
      responses.add(new CustomerSegmentSummaryResponse(
          segment.getSegmentId(),
          segment.getSegmentLabel(),
          segment.getRule(),
          segment.getRecommendedCard(),
          segment.getRecommendedCardBenefits(),
          segment.getClients(),
          segment.getSharePct(),
          segment.getTotalBalance(),
          segment.getAverageBalance(),
          segment.getAverageTransactions(),
          segment.getAverageTenureDays(),
          segment.getMissingCreditCardClients(),
          segment.getPortfolioCompleteClients(),
          segment.getTopStates(),
          segment.getProductAdoption(),
          segment.getMissingProducts()));
    }
    return responses;
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
