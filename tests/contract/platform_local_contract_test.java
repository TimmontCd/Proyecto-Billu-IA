import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.web.api.AccessContextResponse;
import com.billu.foundation.web.api.MockDatasetLoadRequest;
import com.billu.foundation.web.api.MockDatasetLoadResponse;
import com.billu.foundation.web.api.PlatformAuthController;
import com.billu.foundation.web.api.PlatformMockDatasetController;
import java.util.Collections;
import javax.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class PlatformLocalContractTest {
  @Test
  void exposesAuthContextAndLoadsMockDatasetInLocalMock() {
    LocalValidationService service = new LocalValidationService(
        new EnvironmentProfile("local-mock", "local-mock", true, false, true, "local", "local",
            "ACTIVE"),
        "billu-backend-foundation",
        "0.1.0-SNAPSHOT",
        "backend/config/schedulers/local-schedulers.json",
        "local",
        new ReadyOracleGateway(),
        new BootstrapMockDatasetGateway());

    PlatformAuthController authController = new PlatformAuthController(service);
    PlatformMockDatasetController datasetController = new PlatformMockDatasetController(service);

    AccessContextResponse accessContext = authController.getAccessContext(null);
    Response response = datasetController.loadDataset("bootstrap", new MockDatasetLoadRequest(), null);
    MockDatasetLoadResponse datasetLoadResponse = (MockDatasetLoadResponse) response.getEntity();

    assertEquals("LOCAL_MOCK", accessContext.getAuthSource());
    assertEquals("bootstrap", datasetLoadResponse.getDatasetKey());
    assertEquals("LOADED", datasetLoadResponse.getStatus());
  }

  private static class ReadyOracleGateway
      implements com.billu.foundation.application.validation.OracleReadinessGateway {
    @Override
    public boolean isReady() {
      return true;
    }
  }

  private static class BootstrapMockDatasetGateway
      implements com.billu.foundation.application.validation.MockDatasetGateway {
    @Override
    public com.billu.foundation.domain.MockDataset load(String datasetKey, boolean resetBeforeLoad) {
      return new com.billu.foundation.domain.MockDataset(
          "bootstrap",
          "1.0.0",
          Collections.singletonList("/internal/platform/auth/context"),
          "JSON",
          "backend-foundation",
          "SMOKE",
          "REGISTERED");
    }
  }
}
