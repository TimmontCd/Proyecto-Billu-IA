import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.GetCustomerSummaryOverviewUseCase;
import com.billu.accounts.infrastructure.mock.MockAccountsDatasetLoader;
import com.billu.accounts.infrastructure.mock.MockAccountsSummaryRepository;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryLocalMockTest {
  @Test
  void loadsExecutiveSummaryFromMockDataset() {
    GetCustomerSummaryOverviewUseCase useCase = new GetCustomerSummaryOverviewUseCase(
        new MockAccountsDatasetLoader(new MockAccountsSummaryRepository()),
        new CustomerSummaryAuditService(new AuditTrailService(
            new com.billu.foundation.infrastructure.oracle.AuditEventRepository(),
            new com.billu.foundation.application.observability.AuditPublisher())),
        new StaticAccessContextService());

    com.billu.accounts.domain.CustomerAccountSummary response = useCase.execute("corr-overview-1");

    assertEquals("local-mock", response.getEnvironment());
    assertEquals("LOCAL_MOCK", response.getSourceMode());
    assertEquals(120, response.getTotalAccounts());
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
