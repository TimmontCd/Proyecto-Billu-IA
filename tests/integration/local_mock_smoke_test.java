import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.MockDataset;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class LocalMockSmokeTest {
  @Test
  void validatesLocalMockSmokeFlow() {
    LocalValidationService service = new LocalValidationService(
        new EnvironmentProfile("local-mock", "local-mock", true, false, true, "local", "local",
            "ACTIVE"),
        "billu-backend-foundation",
        "0.1.0-SNAPSHOT",
        "backend/config/schedulers/local-schedulers.json",
        "local",
        new ReadyOracleGateway(),
        new BootstrapMockDatasetGateway());

    MockDataset dataset = service.load(new com.billu.foundation.application.datasets.MockDatasetLoadCommand(
        "bootstrap", false));

    assertEquals("READY", service.getReadiness().getStatus());
    assertEquals("LOADED", dataset.getStatus());
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
          Collections.singletonList("/internal/platform/readiness"),
          "JSON",
          "backend-foundation",
          "SMOKE",
          "REGISTERED");
    }
  }
}
