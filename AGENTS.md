# PROYECTO BILLU ENTERPRISE Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-21

## Active Technologies
- Java 8 + Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade respaldada por `backend/config/schedulers/local-schedulers.json`, cliente desacoplado para CyberArk con SDK vigente mas actual disponible al inicio de implementacion, SLF4J con logging JSON estructurado (001-backend-foundation)
- Oracle como persistencia objetivo; datasets mockeados versionados para `local-mock`; puentes legados de solo lectura para coexistencia temporal (001-backend-foundation)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

- `mvn -f backend/pom.xml -DskipTests package`
- `mvn -f backend/pom.xml -pl foundation-ear -am -DskipTests package`
- `backend/scripts/verify-ear.sh backend/foundation-ear/target/foundation-ear-0.1.0-SNAPSHOT.ear`

## Code Style

Java 8: Follow standard conventions

## Recent Changes
- 001-backend-foundation: Added Java 8 + Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade respaldada por `backend/config/schedulers/local-schedulers.json`, cliente desacoplado para CyberArk con SDK vigente mas actual disponible al inicio de implementacion, SLF4J con logging JSON estructurado

<!-- MANUAL ADDITIONS START -->
- Foundation complete through US3 and Phase 6 polish.
- Internal platform endpoints now cover health, readiness, auth context, legacy inventory, transition, mock dataset load and manual job execution.
- Local toolchain verified with JDK 8 (`C:\Program Files\Java\jdk1.8.0_202`) and Maven 3.9.14.
- 002-resumen-clientes: backend slice complete through overview, historical, first30, card coverage and controlled exports with local-mock, legacy read-only fallback, audit and metrics.
- 002-resumen-clientes: frontend-ready internal endpoints available for initial institutional UI integration.
- 003-categorizacion-clientes: backend slice complete through dashboard, lookup por `ID RECOMPENSAS`, export por segmento y export de venta cruzada con local-mock, legacy read-only fallback, audit and metrics.
- `local-oracle` now honors explicit profile flags from environment properties and no longer degrades automatically to legacy when `billu.legacy.bridge.enabled=false`.
<!-- MANUAL ADDITIONS END -->
