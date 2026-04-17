# PROYECTO BILLU ENTERPRISE Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-17

## Active Technologies
- Java 8 + Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade respaldada por `backend/config/schedulers/local-schedulers.json`, cliente desacoplado para CyberArk con SDK vigente mas actual disponible al inicio de implementacion, SLF4J con logging JSON estructurado (001-backend-foundation)
- Oracle como persistencia objetivo; datasets mockeados versionados para `local-mock`; puentes legados de solo lectura para coexistencia temporal (001-backend-foundation)

- Java 8 + Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade estilo Quartz, SLF4J con logging JSON estructurado (001-backend-foundation)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for Java 8

## Code Style

Java 8: Follow standard conventions

## Recent Changes
- 001-backend-foundation: Added Java 8 + Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade respaldada por `backend/config/schedulers/local-schedulers.json`, cliente desacoplado para CyberArk con SDK vigente mas actual disponible al inicio de implementacion, SLF4J con logging JSON estructurado

- 001-backend-foundation: Added Java 8 + Maven multi-module build, Servlet 3.1 + JAX-RS style web layer, Oracle JDBC adapter, scheduler facade estilo Quartz, SLF4J con logging JSON estructurado

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
