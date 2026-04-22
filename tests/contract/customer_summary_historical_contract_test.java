import com.billu.accounts.application.AccountsHistoricalGateway;
import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.GetCustomerSummaryFirst30UseCase;
import com.billu.accounts.application.GetCustomerSummaryHistoricalUseCase;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import com.billu.accounts.web.api.CustomerSummaryFirst30Controller;
import com.billu.accounts.web.api.CustomerSummaryFirst30Response;
import com.billu.accounts.web.api.CustomerSummaryHistoricalController;
import com.billu.accounts.web.api.CustomerSummaryHistoricalResponse;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryHistoricalContractTest {
  @Test
  void exposesHistoricalAndFirst30Contracts() {
    StaticHistoricalGateway gateway = new StaticHistoricalGateway();
    CustomerSummaryAuditService auditService = new CustomerSummaryAuditService(new AuditTrailService(
        new com.billu.foundation.infrastructure.oracle.AuditEventRepository(),
        new com.billu.foundation.application.observability.AuditPublisher()));

    CustomerSummaryHistoricalController historicalController = new CustomerSummaryHistoricalController(
        new GetCustomerSummaryHistoricalUseCase(gateway, auditService, new StaticAccessContextService()));
    CustomerSummaryFirst30Controller first30Controller = new CustomerSummaryFirst30Controller(
        new GetCustomerSummaryFirst30UseCase(gateway, auditService, new StaticAccessContextService()));

    CustomerSummaryHistoricalResponse historical =
        historicalController.getHistorical("2026-01-01", "2026-03-31", null);
    CustomerSummaryFirst30Response first30 = first30Controller.getFirst30(null);

    assertEquals("local-mock", historical.getEnvironment());
    assertEquals("2026-03-31", first30.getReferenceDate());
    assertEquals(3, first30.getMonthlySummary().size());
  }

  private static class StaticHistoricalGateway implements AccountsHistoricalGateway {
    @Override
    public CustomerSummaryHistoricalView getHistorical(String startDate, String endDate) {
      Map<String, Object> filters = new LinkedHashMap<String, Object>();
      filters.put("startDate", startDate);
      filters.put("endDate", endDate);
      Map<String, Object> trend = new LinkedHashMap<String, Object>();
      trend.put("totalAccounts", Integer.valueOf(95));
      Map<String, Object> monthlySummary = new LinkedHashMap<String, Object>();
      monthlySummary.put("month", Integer.valueOf(3));
      return new CustomerSummaryHistoricalView("local-mock", filters, trend, monthlySummary);
    }

    @Override
    public CustomerSummaryFirst30View getFirst30() {
      Map<String, Object> totalSummary = new LinkedHashMap<String, Object>();
      totalSummary.put("openingAccounts", Integer.valueOf(95));
      return new CustomerSummaryFirst30View(
          "local-mock",
          "2026-03-31",
          totalSummary,
          Arrays.<Map<String, Object>>asList(
              row(2026, 1, 32),
              row(2026, 2, 29),
              row(2026, 3, 34)));
    }

    private Map<String, Object> row(int year, int month, int openingAccounts) {
      Map<String, Object> row = new LinkedHashMap<String, Object>();
      row.put("year", Integer.valueOf(year));
      row.put("month", Integer.valueOf(month));
      row.put("openingAccounts", Integer.valueOf(openingAccounts));
      return row;
    }
  }

  private static class StaticAccessContextService implements AccessContextQueryUseCase {
    @Override
    public AccessContext getAccessContext() {
      return new AccessContext(
          "subject-1",
          "tester@billu",
          "LOCAL_MOCK",
          Collections.singletonList("PLATFORM_ADMIN"),
          Collections.singletonList("foundation:read"),
          "local-mock",
          "LOCAL_MOCK",
          Instant.now());
    }
  }
}
