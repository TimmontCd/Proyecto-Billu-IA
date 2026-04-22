import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.CustomerCategorizationExportGateway;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.billu.categorization.web.CustomerCategorizationMetricsPublisher;
import com.billu.categorization.web.api.CustomerCategorizationExportController;
import com.billu.categorization.web.api.CustomerCategorizationExportResponse;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import javax.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerCategorizationExportsContractTest {
  @Test
  void exposesSegmentAndCrossSellExportContracts() {
    CustomerCategorizationExportController controller =
        new CustomerCategorizationExportController(
            new ExportCustomerCategorizationUseCase(
                new StaticExportGateway(),
                new CustomerCategorizationAuditService(new AuditTrailService(
                    new AuditEventRepository(), new AuditPublisher())),
                new StaticAccessContextService()),
            new CustomerCategorizationMetricsPublisher());

    Response segmentResponse =
        controller.exportSegment(
            new com.billu.categorization.web.api.CustomerCategorizationExportRequest(
                "Constructores"),
            null);
    Response crossSellResponse =
        controller.exportCrossSell(
            new com.billu.categorization.web.api.CustomerCategorizationExportRequest(
                "Constructores"),
            null);

    CustomerCategorizationExportResponse segmentEntity =
        (CustomerCategorizationExportResponse) segmentResponse.getEntity();
    CustomerCategorizationExportResponse crossSellEntity =
        (CustomerCategorizationExportResponse) crossSellResponse.getEntity();

    assertEquals(202, segmentResponse.getStatus());
    assertEquals("SEGMENT_EXPORT", segmentEntity.getExportType());
    assertEquals("Constructores", segmentEntity.getSegmentId());
    assertEquals(202, crossSellResponse.getStatus());
    assertEquals("CROSS_SELL_EXPORT", crossSellEntity.getExportType());
    assertEquals("Constructores", crossSellEntity.getSegmentId());
  }

  private static class StaticExportGateway implements CustomerCategorizationExportGateway {
    @Override
    public CustomerCategorizationExportResult exportData(
        com.billu.categorization.domain.CustomerCategorizationExportRequest request) {
      return new CustomerCategorizationExportResult(
          request.getExportType(),
          request.getSegmentId(),
          "Constructores",
          "SUCCEEDED",
          "Constructores".equals(request.getSegmentId())
              ? (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(request.getExportType())
                  ? "categorizacion_cliente_constructores.csv"
                  : "venta_cruzada_constructores.csv")
              : "desconocido.csv",
          64,
          request.getCorrelationId(),
          "Export generated");
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
