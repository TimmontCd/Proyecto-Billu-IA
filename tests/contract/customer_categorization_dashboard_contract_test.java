import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.CustomerCategorizationDashboardGateway;
import com.billu.categorization.application.GetCustomerCategorizationDashboardUseCase;
import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.categorization.domain.CustomerSegmentSummary;
import com.billu.categorization.web.CustomerCategorizationMetricsPublisher;
import com.billu.categorization.web.api.CustomerCategorizationDashboardController;
import com.billu.categorization.web.api.CustomerCategorizationDashboardResponse;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerCategorizationDashboardContractTest {
  @Test
  void exposesDashboardContract() {
    CustomerCategorizationDashboardController controller =
        new CustomerCategorizationDashboardController(
            new GetCustomerCategorizationDashboardUseCase(
                new StaticDashboardGateway(),
                new CustomerCategorizationAuditService(new AuditTrailService(
                    new AuditEventRepository(), new AuditPublisher())),
                new StaticAccessContextService()));

    CustomerCategorizationDashboardResponse response = controller.getDashboard(null);

    assertEquals("local-mock", response.getEnvironment());
    assertEquals("LOCAL_MOCK", response.getSourceMode());
    assertEquals(1, response.getSegmentSummary().size());
  }

  private static class StaticDashboardGateway implements CustomerCategorizationDashboardGateway {
    @Override
    public CustomerCategorizationDashboard getDashboard() {
      Map<String, Double> kpis = new LinkedHashMap<String, Double>();
      kpis.put("total_clients", Double.valueOf(120));
      return new CustomerCategorizationDashboard(
          "customer-categorization-dashboard-mock",
          "local-mock",
          "LOCAL_MOCK",
          "Resumen ejecutivo mock",
          Instant.now(),
          kpis,
          Arrays.asList(new CustomerSegmentSummary(
              "Constructores", "Constructores", "regla", "Tarjeta Billu Crece", "benefits",
              64, 53.3, 1215000.0, 18984.38, 5.6, 161.0, 13, 18,
              Collections.<Map<String, Object>>emptyList(),
              Collections.<Map<String, Object>>emptyList(),
              Collections.<Map<String, Object>>emptyList())));
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
