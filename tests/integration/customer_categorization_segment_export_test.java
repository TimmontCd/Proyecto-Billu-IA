import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationExportRepository;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerCategorizationSegmentExportTest {
  @Test
  void exportsSegmentFromMockDataset() {
    ExportCustomerCategorizationUseCase useCase =
        new ExportCustomerCategorizationUseCase(
            new MockCustomerCategorizationExportRepository(),
            new CustomerCategorizationAuditService(new AuditTrailService(
                new AuditEventRepository(), new AuditPublisher())),
            new StaticAccessContextService());

    com.billu.categorization.domain.CustomerCategorizationExportResult result =
        useCase.exportSegment("Constructores", "corr-categorization-export-1");

    assertEquals("SEGMENT_EXPORT", result.getExportType());
    assertEquals("Constructores", result.getSegmentId());
    assertEquals("SUCCEEDED", result.getOutcome());
    assertEquals("categorizacion_cliente_constructores.csv", result.getFileName());
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
