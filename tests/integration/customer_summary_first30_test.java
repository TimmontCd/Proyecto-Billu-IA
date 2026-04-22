import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.GetCustomerSummaryFirst30UseCase;
import com.billu.accounts.infrastructure.mock.MockAccountsDatasetLoader;
import com.billu.accounts.infrastructure.mock.MockAccountsHistoricalRepository;
import com.billu.accounts.infrastructure.mock.MockAccountsSummaryRepository;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryFirst30Test {
  @Test
  void loadsFirst30ViewFromMockDataset() {
    GetCustomerSummaryFirst30UseCase useCase = new GetCustomerSummaryFirst30UseCase(
        new MockAccountsDatasetLoader(
            new MockAccountsSummaryRepository(),
            new MockAccountsHistoricalRepository()),
        new CustomerSummaryAuditService(new AuditTrailService(
            new com.billu.foundation.infrastructure.oracle.AuditEventRepository(),
            new com.billu.foundation.application.observability.AuditPublisher())),
        new StaticAccessContextService());

    com.billu.accounts.domain.CustomerSummaryFirst30View view = useCase.execute("corr-first30-1");

    assertEquals("local-mock", view.getEnvironment());
    assertEquals("2026-03-31", view.getReferenceDate());
    assertEquals(3, view.getMonthlySummary().size());
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
