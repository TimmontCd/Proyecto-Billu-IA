# Tasks: Resumen de Clientes

**Input**: Design documents from `/specs/002-resumen-clientes/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Esta iteración SI incluye tareas de prueba porque el slice debe
demostrar paridad funcional, coexistencia temporal, auditoría y validación local
antes de sustituir el consumo del legado.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend institucional**: `backend/`
- **Tests**: `tests/contract/`, `tests/integration/`, `tests/unit/`
- **Feature docs**: `specs/002-resumen-clientes/`

## Constitution-Driven Coverage *(mandatory)*

- Include tasks that preserve traceability from spec -> plan -> implementation
- Include tasks for transition/rollback when the feature coexists with legacy
- Include tasks for environment configuration, secret handling and deployment readiness
- Include tasks for persistence evolution, authentication, jobs and observability
- Include local validation tasks on Mac when they are needed to prove institutional alignment

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar artefactos y paquetes del slice Resumen de Clientes

- [X] T001 Create feature package structure in `backend/foundation-domain/src/main/java/com/billu/accounts/domain/`, `backend/foundation-application/src/main/java/com/billu/accounts/application/`, `backend/foundation-infrastructure-oracle/src/main/java/com/billu/accounts/infrastructure/oracle/`, `backend/foundation-infrastructure-mock/src/main/java/com/billu/accounts/infrastructure/mock/`, `backend/foundation-infrastructure-legacy/src/main/java/com/billu/accounts/infrastructure/legacy/`, and `backend/foundation-web/src/main/java/com/billu/accounts/web/`
- [X] T002 [P] Add mock dataset fixtures and export samples for the slice in `backend/foundation-web/src/test/resources/mock-datasets/customer-summary-overview.json`, `customer-summary-historical.json`, `customer-summary-first30.json`, and `customer-summary-card-coverage.json`
- [X] T003 [P] Create feature-level documentation placeholders in `docs/customer-summary-runbook.md` and align `specs/002-resumen-clientes/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base del slice que bloquea a todas las historias

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement shared domain projections in `backend/foundation-domain/src/main/java/com/billu/accounts/domain/CustomerAccountSummary.java`, `ProductSummaryItem.java`, `HistoricalOpeningSeries.java`, `First30Cohort.java`, `CardCoverageSnapshot.java`, `AccountsExportRequest.java`, and `AccountsDataSource.java`
- [X] T005 [P] Implement application gateways and DTOs in `backend/foundation-application/src/main/java/com/billu/accounts/application/AccountsSummaryGateway.java`, `AccountsHistoricalGateway.java`, `AccountsCardCoverageGateway.java`, and `AccountsExportGateway.java`
- [X] T006 [P] Implement read-only legacy adapters for the slice in `backend/foundation-infrastructure-legacy/src/main/java/com/billu/accounts/infrastructure/legacy/LegacyAccountsSummaryAdapter.java`, `LegacyAccountsHistoricalAdapter.java`, and `LegacyAccountsCardCoverageAdapter.java`
- [X] T007 [P] Implement mock repositories/loaders for the slice in `backend/foundation-infrastructure-mock/src/main/java/com/billu/accounts/infrastructure/mock/MockAccountsSummaryRepository.java` and `MockAccountsDatasetLoader.java`
- [X] T008 [P] Implement Oracle repository boundaries for future persistence in `backend/foundation-infrastructure-oracle/src/main/java/com/billu/accounts/infrastructure/oracle/OracleAccountsSummaryRepository.java`, `OracleAccountsHistoricalRepository.java`, and `OracleAccountsCardCoverageRepository.java`
- [X] T009 Implement slice observability baseline in `backend/foundation-application/src/main/java/com/billu/accounts/application/CustomerSummaryAuditService.java` and `backend/foundation-web/src/main/java/com/billu/accounts/web/CustomerSummaryMetricsPublisher.java`
- [X] T010 Implement slice component wiring and source selection in `backend/foundation-web/src/main/java/com/billu/accounts/web/CustomerSummaryComponentFactory.java`

**Checkpoint**: Slice foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Resumen Ejecutivo de Clientes (Priority: P1) 🎯 MVP

**Goal**: Exponer KPIs, resumen ejecutivo y resumen por producto del dominio

**Independent Test**: El equipo puede consultar `/internal/customer-summary/overview`
y validar KPIs/productos en `local-mock` o con bridge legacy read-only

### Tests for User Story 1 ⚠️

- [X] T011 [P] [US1] Create contract test for `/internal/customer-summary/overview` in `tests/contract/customer_summary_overview_contract_test.java`
- [X] T012 [P] [US1] Create integration test for local-mock executive summary flow in `tests/integration/customer_summary_local_mock_test.java`
- [X] T013 [P] [US1] Create integration test for legacy read-only fallback of overview in `tests/integration/customer_summary_legacy_fallback_test.java`

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement executive summary use case in `backend/foundation-application/src/main/java/com/billu/accounts/application/GetCustomerSummaryOverviewUseCase.java`
- [X] T015 [P] [US1] Implement response DTOs for overview in `backend/foundation-web/src/main/java/com/billu/accounts/web/api/CustomerSummaryOverviewResponse.java` and `ProductSummaryResponse.java`
- [X] T016 [US1] Implement overview controller in `backend/foundation-web/src/main/java/com/billu/accounts/web/api/CustomerSummaryOverviewController.java`
- [X] T017 [US1] Add audit and metrics publication for overview requests in `backend/foundation-application/src/main/java/com/billu/accounts/application/CustomerSummaryAuditService.java` and `backend/foundation-web/src/main/java/com/billu/accounts/web/CustomerSummaryMetricsPublisher.java`

**Checkpoint**: User Story 1 is independently functional and demonstrable

---

## Phase 4: User Story 2 - Histórico y Cohortes First 30 (Priority: P2)

**Goal**: Exponer histórico por periodo y cohortes First 30 del dominio

**Independent Test**: El equipo puede consultar `/historical` y `/first30` y verificar
series y resúmenes sin depender de la UI legacy

### Tests for User Story 2 ⚠️

- [X] T018 [P] [US2] Create contract tests for `/internal/customer-summary/historical` and `/internal/customer-summary/first30` in `tests/contract/customer_summary_historical_contract_test.java`
- [X] T019 [P] [US2] Create integration test for historical filters and summaries in `tests/integration/customer_summary_historical_test.java`
- [X] T020 [P] [US2] Create integration test for First 30 cohort equivalence in `tests/integration/customer_summary_first30_test.java`

### Implementation for User Story 2

- [X] T021 [P] [US2] Implement historical and First 30 use cases in `backend/foundation-application/src/main/java/com/billu/accounts/application/GetCustomerSummaryHistoricalUseCase.java` and `GetCustomerSummaryFirst30UseCase.java`
- [X] T022 [P] [US2] Implement filter/request DTOs in `backend/foundation-web/src/main/java/com/billu/accounts/web/api/CustomerSummaryHistoricalRequest.java` and `CustomerSummaryFirst30Response.java`
- [X] T023 [US2] Implement historical and First 30 controllers in `backend/foundation-web/src/main/java/com/billu/accounts/web/api/CustomerSummaryHistoricalController.java` and `CustomerSummaryFirst30Controller.java`
- [X] T024 [US2] Implement legacy/mocked mapping rules for periods and cohorts in `backend/foundation-infrastructure-legacy/src/main/java/com/billu/accounts/infrastructure/legacy/LegacyAccountsHistoricalAdapter.java` and `backend/foundation-infrastructure-mock/src/main/java/com/billu/accounts/infrastructure/mock/MockAccountsDatasetLoader.java`

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - Plásticos, Consumos y Exportables (Priority: P3)

**Goal**: Exponer cobertura de plásticos y exportables controlados del slice

**Independent Test**: El equipo puede consultar `/cards/coverage` y disparar exportaciones
mensuales/auditables con respuesta consistente

### Tests for User Story 3 ⚠️

- [X] T025 [P] [US3] Create contract tests for `/internal/customer-summary/cards/coverage` and export endpoints in `tests/contract/customer_summary_exports_contract_test.java`
- [X] T026 [P] [US3] Create integration test for card coverage summary in `tests/integration/customer_summary_card_coverage_test.java`
- [X] T027 [P] [US3] Create integration test for export audit traceability in `tests/integration/customer_summary_exports_audit_test.java`

### Implementation for User Story 3

- [X] T028 [P] [US3] Implement card coverage and export use cases in `backend/foundation-application/src/main/java/com/billu/accounts/application/GetCustomerSummaryCardCoverageUseCase.java` and `ExportCustomerSummaryUseCase.java`
- [X] T029 [P] [US3] Implement export response DTOs in `backend/foundation-web/src/main/java/com/billu/accounts/web/api/CardCoverageResponse.java`, `CustomerSummaryExportRequest.java`, and `CustomerSummaryExportResponse.java`
- [X] T030 [US3] Implement card coverage and export controllers in `backend/foundation-web/src/main/java/com/billu/accounts/web/api/CustomerSummaryCardCoverageController.java` and `CustomerSummaryExportController.java`
- [X] T031 [US3] Implement export generation adapters and rollback-safe source selection in `backend/foundation-infrastructure-legacy/src/main/java/com/billu/accounts/infrastructure/legacy/LegacyAccountsExportAdapter.java` and `backend/foundation-web/src/main/java/com/billu/accounts/web/CustomerSummaryComponentFactory.java`

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar trazabilidad, despliegue y documentación operativa del slice

- [X] T032 [P] Create architecture notes for the slice in `docs/customer-summary-architecture.md`
- [X] T033 [P] Update runbook, quickstart and rollout notes in `docs/customer-summary-runbook.md` and `specs/002-resumen-clientes/quickstart.md`
- [X] T034 Harden validation and mapping edge cases in `backend/foundation-application/src/main/java/com/billu/accounts/application/CustomerSummaryRequestValidator.java` and `CustomerSummaryMappingValidator.java`
- [X] T035 Run end-to-end build and record final command set in `specs/002-resumen-clientes/quickstart.md`
- [X] T036 [P] Update agent traceability context in `AGENTS.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Phase 2 completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational - Recommended after overview contracts are stable
- **User Story 3 (P3)**: Can start after Foundational - Recommended after overview and historical sources are stable

### Within Each User Story

- Tests MUST be written and fail before implementation
- Gateways/models before use cases
- Use cases before controllers
- Audit/metrics before story closure
- Story complete before being marked deliverable

### Parallel Opportunities

- T002 and T003 can run in parallel
- T005-T009 can run in parallel after T004
- T011-T013 can run in parallel inside US1
- T018-T020 can run in parallel inside US2
- T025-T027 can run in parallel inside US3
- T032, T033 and T036 can run in parallel during polish

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup
2. Complete Foundational
3. Complete User Story 1
4. Stop and validate overview contract and legacy/mock equivalence

### Incremental Delivery

1. Add US1 -> executive dashboard
2. Add US2 -> historical and First 30
3. Add US3 -> plastics and exportables
4. Close polish and operational readiness

### After This Slice

Once `Resumen de Clientes` is stable, start `Categorizacion de Clientes`.
