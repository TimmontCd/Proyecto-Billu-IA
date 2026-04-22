import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.ExportCustomerSummaryUseCase;
import com.billu.accounts.infrastructure.mock.MockAccountsExportRepository;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.domain.AuditEvent;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryExportsAuditTest {
  @Test
  void recordsAuditTraceForMonthlyExports() {
    AuditEventRepository auditEventRepository = new AuditEventRepository();
    ExportCustomerSummaryUseCase useCase = new ExportCustomerSummaryUseCase(
        new MockAccountsExportRepository(),
        new CustomerSummaryAuditService(new AuditTrailService(
            auditEventRepository, new AuditPublisher())),
        new StaticAccessContextService());

    com.billu.accounts.domain.AccountsExportResult result =
        useCase.exportHistoricalMonth(2026, 3, "corr-export-1");
    List<AuditEvent> events = auditEventRepository.findRecent();

    assertEquals("SUCCEEDED", result.getOutcome());
    assertEquals(1, events.size());
    assertEquals("CUSTOMER_SUMMARY_EXPORT_REQUESTED", events.get(0).getEventType());
    assertEquals("corr-export-1", events.get(0).getCorrelationId());
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
