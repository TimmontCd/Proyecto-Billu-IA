# Implementation Plan: Resumen de Clientes

**Branch**: `002-resumen-clientes` | **Date**: 2026-04-21 | **Spec**: [spec.md](/Users/PouPou/Documents/Proyectos%20Alex/Proyecto-Billu-IA/specs/002-resumen-clientes/spec.md)
**Input**: Feature specification from `/specs/002-resumen-clientes/spec.md`

**Note**: Plan generado manualmente siguiendo el flujo equivalente de `/speckit.plan`
porque en este entorno no hay `bash` disponible para los scripts del kit.

## Summary

Migrar el slice funcional Resumen de Clientes desde el dominio `Accounts` del
legado hacia la plataforma institucional ya fundada, comenzando por contratos de
lectura y exportación para resumen ejecutivo, histórico/First 30 y
plásticos/cobertura. La implementación reusará la base Java 8 multi-módulo,
mantendrá coexistencia temporal read-only con fuentes legadas cuando Oracle aún
no disponga de proyecciones equivalentes y dejará observabilidad, auditoría y
rollback explícitos por capacidad.

## Technical Context

**Language/Version**: Java 8  
**Primary Dependencies**: Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, Jackson JSON mapping, SLF4J structured logging, scheduler/audit/access context foundation already available  
**Storage**: Oracle como persistencia objetivo; datasets mockeados para `local-mock`; puentes legados read-only a fuentes actuales de `Accounts` mientras se completa la transición  
**Testing**: JUnit 5, contract tests HTTP, integration tests por perfil y smoke de exportables/bridges  
**Target Platform**: Mac para validación local; WebSphere Application Server 9 en DEV, QA y PROD  
**Project Type**: Backend web-service institucional empaquetado como `.ear`  
**Performance Goals**: consultas principales del slice bajo 5 segundos en validación local; exportables controlados generados bajo 10 segundos en volúmenes de smoke  
**Constraints**: compatibilidad estricta con Java 8, Oracle, WebSphere 9 y `.ear`; cero writes al legado; separación por ambiente; trazabilidad auditable; local-mock equivalente a contratos institucionales  
**Scale/Scope**: primer slice funcional del dominio `Accounts`, cubriendo resumen ejecutivo, histórico/First 30, plásticos/cobertura y exportables del dominio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] The spec defines `Estado actual`, `Estado objetivo`,
      `Restricciones institucionales` and `Estrategia de transicion`
- [x] The design is compatible with Java 8, Oracle, WebSphere Application
      Server and final `.ear` packaging, or documents the approved temporary
      bridge and exit criteria
- [x] Local development on Mac validates contracts and behavior without
      diverging from the institutional target model
- [x] Environment separation, configuration, secret handling, authentication,
      jobs and observability are defined for the feature
- [x] The migration is incremental by domain/capability and includes rollback,
      traceability and audit evidence

Post-design re-check: PASS. No constitutional violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/002-resumen-clientes/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  `- customer-summary-internal-api.yaml
|- checklists/
|  `- requirements.md
`- tasks.md
```

### Source Code (repository root)

```text
backend/
|- foundation-domain/
|  `- src/main/java/com/billu/accounts/domain/
|- foundation-application/
|  `- src/main/java/com/billu/accounts/application/
|- foundation-infrastructure-oracle/
|  `- src/main/java/com/billu/accounts/infrastructure/oracle/
|- foundation-infrastructure-mock/
|  `- src/main/java/com/billu/accounts/infrastructure/mock/
|- foundation-infrastructure-legacy/
|  `- src/main/java/com/billu/accounts/infrastructure/legacy/
|- foundation-web/
|  `- src/main/java/com/billu/accounts/web/
`- foundation-ear/

tests/
|- contract/
|- integration/
`- unit/
```

**Structure Decision**: Mantener el multi-módulo ya fundado y agregar paquetes
por dominio `accounts` dentro de los módulos existentes, evitando un árbol nuevo
fuera de la foundation mientras el slice aún depende de contratos y componentes
comunes de plataforma.

## Migration Design Controls

### Transition Strategy

La transición del slice se dividirá en tres etapas:

1. Exponer contratos institucionales de lectura para resumen ejecutivo,
   histórico/First 30 y cobertura de plásticos usando datasets mockeados y
   adaptadores legados read-only.
2. Introducir repositorios/proyecciones Oracle equivalentes detrás de gateways
   del dominio sin cambiar los contratos públicos del slice.
3. Retirar gradualmente las dependencias legadas una vez exista evidencia de
   paridad funcional y operativa en Oracle.

Controles de transición:

- ningún endpoint del slice podrá escribir sobre Google Sheets, Drive o Apps
  Script;
- cada bridge temporal al legado deberá publicar responsable, origen y criterio
  de retiro;
- el rollback del slice será mantener el consumo funcional sobre el legado
  mientras la plataforma institucional no pase validaciones locales y de smoke;
- los exportables usarán solo fuentes validadas por ambiente y deberán dejar
  evidencia de actor y filtros usados.

### Operational Readiness

La operación del slice deberá incluir:

- logs JSON estructurados con `correlationId`, `environment`, `actor`,
  `slice=customer-summary`, `queryType` y `outcome`;
- auditoría por consulta principal y por exportación;
- degradación controlada cuando una fuente temporal no esté disponible;
- validación local en `local-mock` y `local-oracle` sin cambiar contratos;
- quickstart de consultas y exportables del slice;
- runbook de dependencia temporal/rollback alineado con la foundation.

### Institutional Compatibility

La compatibilidad institucional se mantiene con estas decisiones:

- implementación sobre Java 8 y módulos Maven ya aprobados por la foundation;
- despliegue dentro del mismo `WAR`/`EAR` de la foundation;
- repositorios Oracle dedicados como destino objetivo del slice;
- datasets mockeados como mecanismo local equivalente;
- bridges legados estrictamente read-only y encapsulados;
- autenticación, métricas, auditoría y secretos reutilizando la base existente.

## Complexity Tracking

No constitutional violations identified at planning time. No justified
exceptions are required for this feature.
