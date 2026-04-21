import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.web.api.DependenciesResponse;
import com.billu.foundation.web.api.HealthResponse;
import com.billu.foundation.web.api.PlatformHealthController;
import com.billu.foundation.web.api.PlatformReadinessController;
import com.billu.foundation.web.api.ReadinessResponse;
import java.util.Collections;
import javax.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class PlatformHealthContractTest {
  @Test
  void exposesHealthReadinessAndDependenciesContracts() {
    LocalValidationService service = new LocalValidationService(
        new EnvironmentProfile("local-mock", "local-mock", true, false, true, "local", "local",
            "ACTIVE"),
        "billu-backend-foundation",
        "0.1.0-SNAPSHOT",
        "backend/config/schedulers/local-schedulers.json",
        "local",
        new AlwaysReadyOracleGateway(),
        new StaticMockDatasetGateway());

    PlatformHealthController healthController = new PlatformHealthController(service);
    PlatformReadinessController readinessController = new PlatformReadinessController(service);

    HealthResponse health = healthController.getHealth(null);
    Response readinessResponse = readinessController.getReadiness();
    ReadinessResponse readiness = (ReadinessResponse) readinessResponse.getEntity();
    DependenciesResponse dependencies = readinessController.listDependencies();

    assertEquals("UP", health.getStatus());
    assertEquals("READY", readiness.getStatus());
    assertFalse(dependencies.getDependencies().isEmpty());
  }

  private static class AlwaysReadyOracleGateway
      implements com.billu.foundation.application.validation.OracleReadinessGateway {
    @Override
    public boolean isReady() {
      return true;
    }
  }

  private static class StaticMockDatasetGateway
      implements com.billu.foundation.application.validation.MockDatasetGateway {
    @Override
    public com.billu.foundation.domain.MockDataset load(String datasetKey, boolean resetBeforeLoad) {
      return new com.billu.foundation.domain.MockDataset(
          "bootstrap",
          "1.0.0",
          Collections.singletonList("/internal/platform/health"),
          "JSON",
          "backend-foundation",
          "SMOKE",
          "REGISTERED");
    }
  }
}
