import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.GetCustomerSummaryHistoricalUseCase;
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

class CustomerSummaryHistoricalTest {
  @Test
  void loadsHistoricalViewFromMockDataset() {
    GetCustomerSummaryHistoricalUseCase useCase = new GetCustomerSummaryHistoricalUseCase(
        new MockAccountsDatasetLoader(
            new MockAccountsSummaryRepository(),
            new MockAccountsHistoricalRepository()),
        new CustomerSummaryAuditService(new AuditTrailService(
            new com.billu.foundation.infrastructure.oracle.AuditEventRepository(),
            new com.billu.foundation.application.observability.AuditPublisher())),
        new StaticAccessContextService());

    com.billu.accounts.domain.CustomerSummaryHistoricalView view =
        useCase.execute("2026-01-01", "2026-03-31", "corr-historical-1");

    assertEquals("local-mock", view.getEnvironment());
    assertEquals(95, ((Number) view.getTrend().get("totalAccounts")).intValue());
    assertEquals(3, ((Number) view.getMonthlySummary().get("month")).intValue());
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
