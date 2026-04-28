package com.billu.foundation.infrastructure.legacy;

import com.billu.foundation.domain.LegacyDependency;
import java.util.Arrays;
import java.util.List;

public class LegacyDependencyCatalog {
  public List<LegacyDependency> listDependencies() {
    return Arrays.asList(
        new LegacyDependency(
            "legacy-sheets-base-repository",
            "GOOGLE_SHEETS",
            "legacy/src/repositories/BaseRepository.gs",
            "Persistencia operativa base",
            "READ_ONLY",
            "Equipo Migracion Backend",
            "Reemplazar por repositorios Oracle para slices migrados",
            "HIGH",
            "BRIDGED"),
        new LegacyDependency(
            "legacy-drive-documents",
            "GOOGLE_DRIVE",
            "legacy/src/services/DocumentService.gs",
            "Gestion documental transitoria",
            "READ_ONLY",
            "Equipo Migracion Backend",
            "Sustituir por servicio documental institucional antes de writes",
            "MEDIUM",
            "BRIDGED"),
        new LegacyDependency(
            "legacy-script-properties",
            "SCRIPT_PROPERTIES",
            "legacy/src/core/01_Config.gs",
            "Resolucion de configuracion historica",
            "REFERENCE_ONLY",
            "Equipo Plataforma",
            "Mover secretos y configuracion operativa a proveedores institucionales",
            "HIGH",
            "DISCOVERED"),
        new LegacyDependency(
            "legacy-apps-script-triggers",
            "APPS_SCRIPT_TRIGGER",
            "legacy/src/core/09_Run.gs",
            "Automatizaciones heredadas no migradas",
            "REFERENCE_ONLY",
            "Equipo Operacion Backend",
            "Retirar cuando los jobs institucionales cubran la operacion equivalente",
            "HIGH",
            "DISCOVERED"));
  }
}
