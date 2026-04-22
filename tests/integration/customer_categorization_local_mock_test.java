import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.GetCustomerCategorizationDashboardUseCase;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationDashboardRepository;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationDatasetLoader;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerCategorizationLocalMockTest {
  @Test
  void loadsDashboardFromMockDataset() {
    GetCustomerCategorizationDashboardUseCase useCase =
        new GetCustomerCategorizationDashboardUseCase(
            new MockCustomerCategorizationDatasetLoader(
                new MockCustomerCategorizationDashboardRepository()),
            new CustomerCategorizationAuditService(new AuditTrailService(
                new AuditEventRepository(), new AuditPublisher())),
            new StaticAccessContextService());

    com.billu.categorization.domain.CustomerCategorizationDashboard dashboard =
        useCase.execute("corr-categorization-1");

    assertEquals("local-mock", dashboard.getEnvironment());
    assertEquals(3, dashboard.getSegmentSummary().size());
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
