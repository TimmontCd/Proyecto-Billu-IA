import com.billu.foundation.application.dependencies.DependencyQueryUseCase;
import com.billu.foundation.application.dependencies.DependencyStatus;
import com.billu.foundation.application.dependencies.LegacyDependencyInventoryGateway;
import com.billu.foundation.application.dependencies.LegacyDependencyService;
import com.billu.foundation.application.transition.TransitionStatus;
import com.billu.foundation.application.transition.TransitionStatusService;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.LegacyDependency;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class TransitionFallbackTest {
  @Test
  void keepsRollbackReadyDuringCoexistenceAndActivatesFallbackWhenPlatformBlocks() {
    EnvironmentProfile profile = new EnvironmentProfile("local-oracle", "local-oracle", false, true,
        true, "local", "local", "ACTIVE");
    LegacyDependencyService legacyService = new LegacyDependencyService(
        profile,
        new FixedLegacyDependencyGateway());
    TransitionStatusService coexistenceService = new TransitionStatusService(
        profile,
        new DegradedPlatformDependencies(),
        legacyService);
    TransitionStatusService fallbackService = new TransitionStatusService(
        profile,
        new BlockedPlatformDependencies(),
        legacyService);

    TransitionStatus coexistence = coexistenceService.getStatus();
    TransitionStatus fallback = fallbackService.getStatus();

    assertEquals("COEXISTING", coexistence.getStatus());
    assertEquals("READY", coexistence.getRollbackState());
    assertEquals("FALLBACK_TO_LEGACY", fallback.getStatus());
    assertEquals("ACTIVE", fallback.getRollbackState());
    assertEquals("LEGACY", fallback.getActiveSystem());
  }

  private static class DegradedPlatformDependencies implements DependencyQueryUseCase {
    @Override
    public List<DependencyStatus> listDependencies() {
      return Arrays.asList(
          new DependencyStatus("oracle", "DATABASE", "DEGRADED", "ORACLE", "Oracle unavailable"),
          new DependencyStatus("legacy-bridge", "LEGACY_ADAPTER", "BRIDGED", "READ_ONLY",
              "Legacy bridge ready"));
    }
  }

  private static class BlockedPlatformDependencies implements DependencyQueryUseCase {
    @Override
    public List<DependencyStatus> listDependencies() {
      return Arrays.asList(
          new DependencyStatus("scheduler-catalog", "SCHEDULER", "NOT_READY", "JSON",
              "Missing catalog"),
          new DependencyStatus("legacy-bridge", "LEGACY_ADAPTER", "BRIDGED", "READ_ONLY",
              "Legacy bridge ready"));
    }
  }

  private static class FixedLegacyDependencyGateway implements LegacyDependencyInventoryGateway {
    @Override
    public List<LegacyDependency> listDependencies() {
      return Collections.singletonList(
          new LegacyDependency(
              "legacy-sheets-base-repository",
              "GOOGLE_SHEETS",
              "legacy/src/repositories/BaseRepository.gs",
              "Persistencia operativa base",
              "READ_ONLY",
              "Equipo Migracion Backend",
              "Reemplazar por Oracle",
              "HIGH",
              "BRIDGED"));
    }
  }
}
