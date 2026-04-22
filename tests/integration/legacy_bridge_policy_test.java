import com.billu.foundation.application.dependencies.DependencyStatus;
import com.billu.foundation.application.dependencies.LegacyDependencyInventoryGateway;
import com.billu.foundation.application.dependencies.LegacyDependencyService;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.LegacyDependency;
import com.billu.foundation.infrastructure.legacy.DriveReadOnlyBridge;
import com.billu.foundation.infrastructure.legacy.LegacyWriteBlockGuard;
import com.billu.foundation.infrastructure.legacy.SheetReadOnlyBridge;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegacyBridgePolicyTest {
  @Test
  void exposesLegacyInventoryAndBlocksWriteAttempts() {
    LegacyDependencyService service = new LegacyDependencyService(
        new EnvironmentProfile("local-mock", "local-mock", true, false, true, "local", "local",
            "ACTIVE"),
        new FixedLegacyDependencyGateway());
    SheetReadOnlyBridge sheetBridge = new SheetReadOnlyBridge(new LegacyWriteBlockGuard());
    DriveReadOnlyBridge driveBridge = new DriveReadOnlyBridge(new LegacyWriteBlockGuard());

    List<DependencyStatus> dependencies = service.listDependencies();

    assertEquals(2, dependencies.size());
    assertEquals("BRIDGED", dependencies.get(0).getStatus());
    assertTrue(service.hasReadOnlyCoverage());
    assertThrows(UnsupportedOperationException.class,
        () -> sheetBridge.writeSheetRecord("projects", new Object()));
    assertThrows(UnsupportedOperationException.class,
        () -> driveBridge.moveFile("file-1", "folder-2"));
  }

  private static class FixedLegacyDependencyGateway implements LegacyDependencyInventoryGateway {
    @Override
    public List<LegacyDependency> listDependencies() {
      return Arrays.asList(
          new LegacyDependency(
              "legacy-sheets-base-repository",
              "GOOGLE_SHEETS",
              "legacy/src/repositories/BaseRepository.gs",
              "Persistencia operativa base",
              "READ_ONLY",
              "Equipo Migracion Backend",
              "Reemplazar por Oracle",
              "HIGH",
              "BRIDGED"),
          new LegacyDependency(
              "legacy-drive-documents",
              "GOOGLE_DRIVE",
              "legacy/src/services/DocumentService.gs",
              "Gestion documental",
              "READ_ONLY",
              "Equipo Migracion Backend",
              "Sustituir por servicio institucional",
              "MEDIUM",
              "BRIDGED"));
    }
  }
}
