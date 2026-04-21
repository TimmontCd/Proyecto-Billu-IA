# Implementation Plan: Fundacion Backend Institucional

**Branch**: `001-backend-foundation` | **Date**: 2026-04-17 | **Spec**: [spec.md](/Users/martinmercado/Documents/Martin/Innovacion Digital/Banco Digital/IA/PROYECTO BILLU ENTERPRISE/specs/001-backend-foundation/spec.md)
**Input**: Feature specification from `/specs/001-backend-foundation/spec.md`

**Note**: This plan covers Phase 0 research and Phase 1 design for the backend
foundation only. It does not migrate business modules yet and keeps WhatsApp
explicitly out of scope.

## Summary

Construir la plataforma base institucional del backend principal de Billu como
una solucion Java 8 empaquetable en `.ear`, con ejecucion local en Mac en modo
`local-mock` y `local-oracle`, adaptadores separados para Oracle, mocks y
coexistencia temporal con el legado, logging estructurado, auditoria
correlacionable, base de autenticacion desacoplada, CyberArk como secreto
objetivo desacoplado del arranque inicial y un modelo de jobs calendarizables
fuera de Apps Script soportado localmente por un archivo JSON versionado.

La primera iteracion entrega solo la fundacion tecnica: estructura del backend,
contratos internos de plataforma, modelo de datos de fundacion, estrategia de
configuracion por ambiente, validacion local con datos mockeados y criterios de
compatibilidad con WebSphere Application Server 9. Ningun dominio funcional del
backend principal se reimplementa en esta fase, pero se deja fijado que el
primer slice posterior sera Resumen de Clientes y el segundo Categorizacion de
Clientes.

## Technical Context

**Language/Version**: Java 8  
**Primary Dependencies**: Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade respaldada por `backend/config/schedulers/local-schedulers.json`, cliente desacoplado para CyberArk con SDK vigente mas actual disponible al inicio de implementacion, SLF4J con logging JSON estructurado  
**Storage**: Oracle como persistencia objetivo; datasets mockeados versionados para `local-mock`; puentes legados de solo lectura para coexistencia temporal  
**Testing**: JUnit 5, contract tests HTTP, integration tests por perfil (`local-mock` y `local-oracle`), smoke tests de empaquetado `.ear`  
**Target Platform**: Mac para desarrollo local; WebSphere Application Server 9 en DEV, QA y PROD  
**Project Type**: Backend web-service institucional empaquetado como `.ear` con modulo web y librerias compartidas  
**Performance Goals**: arranque local en menos de 2 minutos; endpoints de health/readiness bajo 2 segundos; disparo manual de job con evidencia inicial bajo 5 segundos  
**Constraints**: compatibilidad estricta con Java 8, Oracle, WebSphere 9 y `.ear`; separacion por ambiente; cero dependencia nueva del runtime Apps Script; modo mock con contratos equivalentes; arranque inicial sin requerir CyberArk activo; scheduler local basado en JSON; WhatsApp fuera de alcance  
**Scale/Scope**: una fundacion tecnica para el backend principal, con endpoints internos de plataforma, configuracion base, acceso desacoplado, observabilidad, jobs base, catalogo de dependencias transitorias y preparacion de slices posteriores para Resumen de Clientes y Categorizacion de Clientes

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

Post-design re-check: PASS. No constitutional violations were introduced during
research or design.

## Project Structure

### Documentation (this feature)

```text
specs/001-backend-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── platform-internal-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
docs/
legacy/
specs/
backend/
├── pom.xml
├── config/
│   └── schedulers/
│       └── local-schedulers.json
├── foundation-domain/
├── foundation-application/
├── foundation-infrastructure-oracle/
├── foundation-infrastructure-mock/
├── foundation-infrastructure-legacy/
├── foundation-infrastructure-secrets/
├── foundation-web/
└── foundation-ear/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Introducir un arbol nuevo `backend/` para toda la
implementacion institucional, manteniendo `legacy/` como referencia de solo
lectura. La separacion en modulos permite aislar dominio, orquestacion y
adaptadores para Oracle, mocks, secretos y legado sin mezclar dependencias ni
bloquear la coexistencia temporal.

## Migration Design Controls

### Transition Strategy

La transicion se divide en cuatro pasos de implementacion:

1. Crear la estructura base `backend/` con empaquetado `EAR`, modulo web,
   librerias compartidas y perfiles por ambiente.
2. Implementar capacidades de plataforma primero: health, readiness,
   configuracion, contexto de acceso, logging, auditoria y ejecucion base de
   jobs.
3. Incorporar adaptadores de infraestructura por separado:
   `foundation-infrastructure-oracle` para persistencia objetivo,
   `foundation-infrastructure-mock` para desarrollo y validacion local,
   `foundation-infrastructure-legacy` para inventario y coexistencia read-only,
   `foundation-infrastructure-secrets` para resolucion local y futura
   integracion CyberArk.
4. Mantener el legado como sistema operativo vigente hasta que la plataforma
   base supere validaciones locales y de despliegue institucional.
5. Una vez completada la fundacion, migrar primero Resumen de Clientes y
   despues Categorizacion de Clientes.

Controles de coexistencia:

- Ningun write path nuevo usara Google Sheets como destino primario desde la
  fundacion institucional.
- Los puentes al legado seran de solo lectura y con responsable de retiro.
- La modalidad `local-mock` compartira los mismos contratos HTTP, formatos de
  log y reglas de validacion que `local-oracle`.
- El scheduler local se definira en `backend/config/schedulers/local-schedulers.json`
  y sera la fuente de verdad de desarrollo para jobs hasta conectar un scheduler
  institucional.
- La capa de secretos soportara fallback local controlado mientras la
  integracion con CyberArk aun no este activa.
- El rollback de esta iteracion consiste en dejar al legado como unico sistema
  operativo para procesamiento critico hasta que la fundacion quede validada.

### Operational Readiness

La operacion base debe incluir:

- logs JSON estructurados con `correlationId`, `environment`, `actor`,
  `jobKey`, `dependencyKey` y `outcome`;
- eventos de auditoria funcional y tecnica diferenciados;
- healthcheck y readinesscheck consumibles en local y por despliegue
  institucional;
- definicion de jobs idempotentes con ejecucion manual local y futura
  calendarizacion institucional;
- catalogo de jobs en JSON local con validacion de estructura y trazabilidad por
  version;
- configuracion separada por ambiente con secretos referenciados, nunca
  hardcodeados;
- resolucion de secretos mediante proveedor desacoplado: local para arranque
  inicial y CyberArk como destino institucional;
- evidencia de validacion local para `local-mock`, `local-oracle` y empaquetado
  `EAR`;
- runbook basico para arranque, smoke validation, cambio de perfil y fallback a
  legado.

### Institutional Compatibility

La compatibilidad institucional se preserva con estas decisiones:

- Java 8 como baseline obligatorio para compilacion y runtime.
- Maven multi-module con un `WAR` empacado dentro de un `EAR`.
- Separacion entre dominio/aplicacion y adaptadores para reducir acoplamiento al
  contenedor.
- Oracle como persistencia objetivo mediante adaptador dedicado; sin usar
  Google Sheets como almacen formal del nuevo backend.
- Web layer basada en APIs servlet/JAX-RS desplegables en WebSphere 9, evitando
  asumir capacidades exclusivas del runtime legado.
- Configuracion por ambiente externalizada y preparada para CyberArk mediante el
  SDK vigente mas actual disponible al inicio de implementacion.
- Scheduler facade que permite prueba local desde JSON y futura ejecucion con
  scheduler institucional sin reescribir casos de uso.
- Logging y auditoria pensados desde el inicio para exportarse a Elastic.

## Complexity Tracking

No constitutional violations identified at planning time. No justified
exceptions are required for this feature.
