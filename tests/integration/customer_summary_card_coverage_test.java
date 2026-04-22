import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.GetCustomerSummaryCardCoverageUseCase;
import com.billu.accounts.infrastructure.mock.MockAccountsCardCoverageRepository;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryCardCoverageTest {
  @Test
  void loadsCardCoverageFromMockDataset() {
    GetCustomerSummaryCardCoverageUseCase useCase = new GetCustomerSummaryCardCoverageUseCase(
        new MockCardCoverageGateway(),
        new CustomerSummaryAuditService(new AuditTrailService(
            new AuditEventRepository(), new AuditPublisher())),
        new StaticAccessContextService());

    com.billu.accounts.domain.CardCoverageSnapshot snapshot = useCase.execute("corr-card-1");

    assertEquals("local-mock", snapshot.getEnvironment());
    assertEquals(64, snapshot.getCoveredAccounts());
    assertEquals(28, snapshot.getCoveredTransactionalAccounts());
  }

  private static class MockCardCoverageGateway
      implements com.billu.accounts.application.AccountsCardCoverageGateway {
    @Override
    public com.billu.accounts.domain.CardCoverageSnapshot getCoverage() {
      try {
        return new MockAccountsCardCoverageRepository().loadCoverage();
      } catch (IOException exception) {
        throw new IllegalStateException(exception);
      }
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
