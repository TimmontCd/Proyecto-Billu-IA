package com.billu.accounts.web.api;

import com.billu.accounts.application.GetCustomerSummaryCardCoverageUseCase;
import com.billu.accounts.domain.CardCoverageSnapshot;
import com.billu.accounts.web.CustomerSummaryComponentFactory;
import com.billu.accounts.web.CustomerSummaryMetricsPublisher;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/customer-summary/cards/coverage")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerSummaryCardCoverageController {
  private final GetCustomerSummaryCardCoverageUseCase cardCoverageUseCase;
  private final CustomerSummaryMetricsPublisher metricsPublisher;

  public CustomerSummaryCardCoverageController() {
    this(CustomerSummaryComponentFactory.getCardCoverageUseCase(),
        CustomerSummaryComponentFactory.getMetricsPublisher());
  }

  public CustomerSummaryCardCoverageController(GetCustomerSummaryCardCoverageUseCase cardCoverageUseCase,
      CustomerSummaryMetricsPublisher metricsPublisher) {
    this.cardCoverageUseCase = cardCoverageUseCase;
    this.metricsPublisher = metricsPublisher;
  }

  @GET
  public CardCoverageResponse getCoverage(@Context HttpServletRequest request) {
    String correlationId = resolveCorrelationId(request);
    CardCoverageSnapshot snapshot = cardCoverageUseCase.execute(correlationId);
    metricsPublisher.recordCardCoverage(snapshot, correlationId);
    return new CardCoverageResponse(snapshot.getEnvironment(), correlationId, buildSummary(snapshot));
  }

  private Map<String, Object> buildSummary(CardCoverageSnapshot snapshot) {
    Map<String, Object> summary = new LinkedHashMap<String, Object>();
    summary.put("coveredAccounts", Integer.valueOf(snapshot.getCoveredAccounts()));
    summary.put("uncoveredAccounts", Integer.valueOf(snapshot.getUncoveredAccounts()));
    summary.put("transactionalAccounts", Integer.valueOf(snapshot.getTransactionalAccounts()));
    summary.put("coveredTransactionalAccounts",
        Integer.valueOf(snapshot.getCoveredTransactionalAccounts()));
    summary.put("segments", snapshot.getSegments());
    return summary;
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
