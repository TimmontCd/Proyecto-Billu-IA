import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.domain.EnvironmentProfile;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class LocalOracleSmokeTest {
  @Test
  void exposesDegradedReadinessWhenOracleCredentialsAreUnavailable() {
    LocalValidationService service = new LocalValidationService(
        new EnvironmentProfile("local-oracle", "local-oracle", false, true, true, "local", "local",
            "ACTIVE"),
        "billu-backend-foundation",
        "0.1.0-SNAPSHOT",
        "backend/config/schedulers/local-schedulers.json",
        "local",
        new UnavailableOracleGateway(),
        new NoopMockDatasetGateway());

    assertEquals("DEGRADED", service.getReadiness().getStatus());
    assertEquals("DEGRADED", service.listDependencies().get(2).getStatus());
  }

  private static class UnavailableOracleGateway
      implements com.billu.foundation.application.validation.OracleReadinessGateway {
    @Override
    public boolean isReady() {
      return false;
    }
  }

  private static class NoopMockDatasetGateway
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
