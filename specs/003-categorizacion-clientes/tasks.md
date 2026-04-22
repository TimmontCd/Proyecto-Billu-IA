# Tasks: Categorizacion de Clientes

**Input**: Design documents from `/specs/003-categorizacion-clientes/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Esta iteracion SI incluye tareas de prueba porque el slice debe
demostrar paridad funcional, coexistencia temporal, auditoria y validacion local
antes de sustituir el consumo del legado.

## Phase 1: Setup

- [X] T001 Create feature package structure in `backend/foundation-domain/src/main/java/com/billu/categorization/domain/`, `backend/foundation-application/src/main/java/com/billu/categorization/application/`, `backend/foundation-infrastructure-oracle/src/main/java/com/billu/categorization/infrastructure/oracle/`, `backend/foundation-infrastructure-mock/src/main/java/com/billu/categorization/infrastructure/mock/`, `backend/foundation-infrastructure-legacy/src/main/java/com/billu/categorization/infrastructure/legacy/`, and `backend/foundation-web/src/main/java/com/billu/categorization/web/`
- [X] T002 [P] Add mock dataset fixtures for the slice in `backend/foundation-infrastructure-mock/src/main/resources/mock-datasets/customer-categorization-dashboard.json`, `customer-categorization-rewards-detail.json`, `customer-categorization-segment-export.json`, and `customer-categorization-cross-sell-export.json`
- [X] T003 [P] Create feature docs placeholders in `docs/customer-categorization-runbook.md` and align `specs/003-categorizacion-clientes/quickstart.md`

## Phase 2: Foundational

- [X] T004 Implement shared domain projections in `backend/foundation-domain/src/main/java/com/billu/categorization/domain/`
- [X] T005 [P] Implement application gateways and DTOs in `backend/foundation-application/src/main/java/com/billu/categorization/application/`
- [X] T006 [P] Implement read-only legacy adapters in `backend/foundation-infrastructure-legacy/src/main/java/com/billu/categorization/infrastructure/legacy/`
- [X] T007 [P] Implement mock repositories/loaders in `backend/foundation-infrastructure-mock/src/main/java/com/billu/categorization/infrastructure/mock/`
- [X] T008 [P] Implement Oracle repository boundaries in `backend/foundation-infrastructure-oracle/src/main/java/com/billu/categorization/infrastructure/oracle/`
- [X] T009 Implement slice observability baseline in `backend/foundation-application/src/main/java/com/billu/categorization/application/` and `backend/foundation-web/src/main/java/com/billu/categorization/web/`
- [X] T010 Implement slice component wiring and source selection in `backend/foundation-web/src/main/java/com/billu/categorization/web/`

## Phase 3: User Story 1 - Dashboard Ejecutivo (P1)

- [X] T011 [P] [US1] Create contract test for `/internal/customer-categorization/dashboard` in `tests/contract/customer_categorization_dashboard_contract_test.java`
- [X] T012 [P] [US1] Create integration test for local-mock dashboard flow in `tests/integration/customer_categorization_local_mock_test.java`
- [X] T013 [P] [US1] Create integration test for legacy read-only fallback of dashboard in `tests/integration/customer_categorization_legacy_fallback_test.java`
- [X] T014 [P] [US1] Implement dashboard use case in `backend/foundation-application/src/main/java/com/billu/categorization/application/GetCustomerCategorizationDashboardUseCase.java`
- [X] T015 [P] [US1] Implement response DTOs for dashboard in `backend/foundation-web/src/main/java/com/billu/categorization/web/api/`
- [X] T016 [US1] Implement dashboard controller in `backend/foundation-web/src/main/java/com/billu/categorization/web/api/CustomerCategorizationDashboardController.java`
- [X] T017 [US1] Add audit and metrics publication for dashboard requests in categorization application/web packages

## Phase 4: User Story 2 - Consulta por ID Recompensas (P2)

- [X] T018 [P] [US2] Create contract test for `/internal/customer-categorization/rewards/{rewardsId}` in `tests/contract/customer_categorization_rewards_contract_test.java`
- [X] T019 [P] [US2] Create integration test for rewards lookup in `tests/integration/customer_categorization_rewards_lookup_test.java`
- [X] T020 [P] [US2] Create integration test for controlled not-found response in `tests/integration/customer_categorization_rewards_not_found_test.java`
- [X] T021 [P] [US2] Implement rewards lookup use case in `backend/foundation-application/src/main/java/com/billu/categorization/application/FindCustomerCategorizationByRewardsIdUseCase.java`
- [X] T022 [P] [US2] Implement lookup response DTOs in `backend/foundation-web/src/main/java/com/billu/categorization/web/api/`
- [X] T023 [US2] Implement rewards lookup controller in `backend/foundation-web/src/main/java/com/billu/categorization/web/api/CustomerCategorizationLookupController.java`
- [X] T024 [US2] Implement mapping and validation rules for rewards lookup in categorization application/mock/legacy packages

## Phase 5: User Story 3 - Exportables de Segmento y Venta Cruzada (P3)

- [ ] T025 [P] [US3] Create contract tests for export endpoints in `tests/contract/customer_categorization_exports_contract_test.java`
- [ ] T026 [P] [US3] Create integration test for segment export in `tests/integration/customer_categorization_segment_export_test.java`
- [ ] T027 [P] [US3] Create integration test for cross-sell export audit traceability in `tests/integration/customer_categorization_cross_sell_export_test.java`
- [ ] T028 [P] [US3] Implement export use case in `backend/foundation-application/src/main/java/com/billu/categorization/application/ExportCustomerCategorizationUseCase.java`
- [ ] T029 [P] [US3] Implement export response DTOs in `backend/foundation-web/src/main/java/com/billu/categorization/web/api/`
- [ ] T030 [US3] Implement export controller in `backend/foundation-web/src/main/java/com/billu/categorization/web/api/CustomerCategorizationExportController.java`
- [ ] T031 [US3] Implement export adapters and rollback-safe source selection in categorization legacy/web packages

## Phase 6: Polish

- [ ] T032 [P] Create architecture notes for the slice in `docs/customer-categorization-architecture.md`
- [ ] T033 [P] Update runbook, quickstart and rollout notes in `docs/customer-categorization-runbook.md` and `specs/003-categorizacion-clientes/quickstart.md`
- [ ] T034 Harden validation and mapping edge cases in categorization application validators
- [ ] T035 Run end-to-end build and record final command set in `specs/003-categorizacion-clientes/quickstart.md`
- [ ] T036 [P] Update agent traceability context in `AGENTS.md`
