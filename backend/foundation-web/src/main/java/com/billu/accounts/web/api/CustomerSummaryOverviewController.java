package com.billu.accounts.web.api;

import com.billu.accounts.application.GetCustomerSummaryOverviewUseCase;
import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.accounts.domain.ProductSummaryItem;
import com.billu.accounts.web.CustomerSummaryComponentFactory;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/customer-summary/overview")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerSummaryOverviewController {
  private final GetCustomerSummaryOverviewUseCase overviewUseCase;

  public CustomerSummaryOverviewController() {
    this(CustomerSummaryComponentFactory.getOverviewUseCase());
  }

  public CustomerSummaryOverviewController(GetCustomerSummaryOverviewUseCase overviewUseCase) {
    this.overviewUseCase = overviewUseCase;
  }

  @GET
  public CustomerSummaryOverviewResponse getOverview(@Context HttpServletRequest request) {
    String correlationId = resolveCorrelationId(request);
    CustomerAccountSummary summary = overviewUseCase.execute(correlationId);
    CustomerSummaryComponentFactory.getMetricsPublisher().recordOverview(summary, correlationId);
    return new CustomerSummaryOverviewResponse(
        summary.getSummaryId(),
        summary.getEnvironment(),
        summary.getSourceMode(),
        summary.getExecutiveSummary(),
        correlationId,
        summary.getGeneratedAt(),
        summary.getKpis(),
        mapProductSummary(summary.getProductSummary()));
  }

  private List<ProductSummaryResponse> mapProductSummary(List<ProductSummaryItem> productSummaryItems) {
    List<ProductSummaryResponse> responses = new ArrayList<ProductSummaryResponse>();
    if (productSummaryItems == null) {
      return responses;
    }
    for (ProductSummaryItem item : productSummaryItems) {
      responses.add(new ProductSummaryResponse(
          item.getProductKey(),
          item.getProductLabel(),
          item.getAccounts(),
          item.getSharePct(),
          item.getTotalBalance(),
          item.getStatus()));
    }
    return responses;
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
