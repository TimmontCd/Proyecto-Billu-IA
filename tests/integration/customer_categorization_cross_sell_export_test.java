import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationExportRepository;
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

class CustomerCategorizationCrossSellExportTest {
  @Test
  void recordsAuditTraceForCrossSellExports() {
    AuditEventRepository auditEventRepository = new AuditEventRepository();
    ExportCustomerCategorizationUseCase useCase =
        new ExportCustomerCategorizationUseCase(
            new MockCustomerCategorizationExportRepository(),
            new CustomerCategorizationAuditService(new AuditTrailService(
                auditEventRepository, new AuditPublisher())),
            new StaticAccessContextService());

    com.billu.categorization.domain.CustomerCategorizationExportResult result =
        useCase.exportCrossSell("Constructores", "corr-categorization-export-2");
    List<AuditEvent> events = auditEventRepository.findRecent();

    assertEquals("CROSS_SELL_EXPORT", result.getExportType());
    assertEquals("SUCCEEDED", result.getOutcome());
    assertEquals(1, events.size());
    assertEquals("CUSTOMER_CATEGORIZATION_EXPORT_REQUESTED", events.get(0).getEventType());
    assertEquals("corr-categorization-export-2", events.get(0).getCorrelationId());
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
