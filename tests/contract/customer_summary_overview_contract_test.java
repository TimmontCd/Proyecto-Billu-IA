import com.billu.accounts.application.AccountsSummaryGateway;
import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.GetCustomerSummaryOverviewUseCase;
import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.accounts.domain.ProductSummaryItem;
import com.billu.accounts.web.api.CustomerSummaryOverviewController;
import com.billu.accounts.web.api.CustomerSummaryOverviewResponse;
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
import static org.junit.jupiter.api.Assertions.assertFalse;

class CustomerSummaryOverviewContractTest {
  @Test
  void exposesOverviewContract() {
    CustomerSummaryOverviewController controller = new CustomerSummaryOverviewController(
        new GetCustomerSummaryOverviewUseCase(
            new StaticAccountsSummaryGateway(),
            new CustomerSummaryAuditService(new AuditTrailService(
                new com.billu.foundation.infrastructure.oracle.AuditEventRepository(),
                new com.billu.foundation.application.observability.AuditPublisher())),
            new StaticAccessContextService()));

    CustomerSummaryOverviewResponse response = controller.getOverview(null);

    assertEquals("local-mock", response.getEnvironment());
    assertEquals("LOCAL_MOCK", response.getSourceMode());
    assertFalse(response.getProductSummary().isEmpty());
  }

  private static class StaticAccountsSummaryGateway implements AccountsSummaryGateway {
    @Override
    public CustomerAccountSummary getOverview() {
      Map<String, Double> kpis = new LinkedHashMap<String, Double>();
      kpis.put("total_accounts", Double.valueOf(120));
      return new CustomerAccountSummary(
          "overview-1",
          "local-mock",
          120,
          3456789.25,
          96,
          24,
          "Resumen ejecutivo mock",
          "LOCAL_MOCK",
          Instant.now(),
          kpis,
          Arrays.asList(
              new ProductSummaryItem("CUENTA_N2", "Cuenta Billu N2", 56, 46.7, 1245000.0, "ACTIVE")));
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
