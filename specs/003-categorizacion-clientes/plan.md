# Implementation Plan: Categorizacion de Clientes

**Branch**: `003-categorizacion-clientes` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)

## Summary

Migrar el dominio de Categorizacion de Clientes desde Google Apps Script a la
foundation institucional Java 8, exponiendo dashboard ejecutivo, consulta por
`ID RECOMPENSAS` y exportables controlados con soporte `local-mock`,
coexistencia legacy read-only y frontera explicita hacia Oracle.

## Technical Context

**Language/Version**: Java 8  
**Primary Dependencies**: Maven multi-module, Servlet 3.1, Jersey/JAX-RS, SLF4J  
**Storage**: Oracle objetivo; datasets mockeados y bridge legado read-only en primera etapa  
**Testing**: contract + integration scaffolds bajo `tests/`  
**Target Platform**: Spring Boot 2.7.x local/institucional, empaquetado `.jar`
**Project Type**: backend multi-module + frontend institucional ligero  
**Performance Goals**: respuestas principales < 5s en validacion local  
**Constraints**: Java 8, observabilidad auditable, sin escrituras legacy  
**Scale/Scope**: slice funcional con dashboard, detalle y exportes

## Constitution Check

- Trazabilidad completa desde spec -> plan -> tasks -> implementacion.
- Coexistencia controlada con legado y rollback explicito.
- Configuracion por ambiente y auditoria obligatoria.
- Persistencia objetivo Oracle con boundary explicito desde el primer corte.
- Validacion local en `local-mock` antes de promover.

## Project Structure

### Documentation

```text
specs/003-categorizacion-clientes/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── checklists/
```

### Source Code

```text
backend/src/main/java/com/billu/categorization/domain/
backend/src/main/java/com/billu/categorization/application/
backend/src/main/java/com/billu/categorization/infrastructure/mock/
backend/src/main/java/com/billu/categorization/infrastructure/legacy/
backend/src/main/java/com/billu/categorization/infrastructure/oracle/
backend/src/main/java/com/billu/categorization/web/
tests/contract/
tests/integration/
backend/src/main/resources/static/customer-categorization/
```

## Phase Outline

1. Documentar reglas y contratos vigentes del legado.
2. Definir modelos, gateways y adapters mock/legacy/oracle.
3. Implementar dashboard ejecutivo.
4. Implementar consulta por `ID RECOMPENSAS`.
5. Implementar exportables de segmento y venta cruzada.
6. Cerrar polish, docs operativas y primera pantalla institucional.
