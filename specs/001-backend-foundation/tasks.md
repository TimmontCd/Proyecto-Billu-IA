# Tasks: Fundacion Backend Institucional

**Input**: Design documents from `/specs/001-backend-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Esta iteracion SI incluye tareas de prueba porque la fundacion debe
demostrar compatibilidad institucional, validacion local, coexistencia con
legado, observabilidad y reduccion de riesgo antes de migrar slices
funcionales.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend institucional**: `backend/`
- **Tests**: `tests/contract/`, `tests/integration/`, `tests/unit/`
- **Feature docs**: `specs/001-backend-foundation/`

## Constitution-Driven Coverage *(mandatory)*

- Include tasks that preserve traceability from spec -> plan -> implementation
- Include tasks for transition/rollback when the feature coexists with legacy
- Include tasks for environment configuration, secret handling and deployment readiness
- Include tasks for persistence evolution, authentication, jobs and observability
- Include local validation tasks on Mac when they are needed to prove institutional alignment

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline structure for the institutional backend

- [X] T001 Create Maven multi-module parent and child module descriptors in `backend/pom.xml`, `backend/foundation-domain/pom.xml`, `backend/foundation-application/pom.xml`, `backend/foundation-infrastructure-oracle/pom.xml`, `backend/foundation-infrastructure-mock/pom.xml`, `backend/foundation-infrastructure-legacy/pom.xml`, `backend/foundation-infrastructure-secrets/pom.xml`, `backend/foundation-web/pom.xml`, and `backend/foundation-ear/pom.xml`
- [X] T002 Create Java 8 source/resource skeleton for all backend modules under `backend/foundation-domain/src/main/java/com/billu/foundation/`, `backend/foundation-application/src/main/java/com/billu/foundation/`, `backend/foundation-infrastructure-oracle/src/main/java/com/billu/foundation/`, `backend/foundation-infrastructure-mock/src/main/java/com/billu/foundation/`, `backend/foundation-infrastructure-legacy/src/main/java/com/billu/foundation/`, `backend/foundation-infrastructure-secrets/src/main/java/com/billu/foundation/`, and `backend/foundation-web/src/main/java/com/billu/foundation/`
- [X] T003 [P] Create baseline local scheduler and environment config files in `backend/config/schedulers/local-schedulers.json`, `backend/foundation-web/src/main/resources/application-local-mock.properties`, `backend/foundation-web/src/main/resources/application-local-oracle.properties`, `backend/foundation-web/src/main/resources/application-dev.properties`, and `backend/foundation-web/src/main/resources/application-qa.properties`
- [X] T004 [P] Create automated test scaffolding in `tests/contract/`, `tests/integration/`, `tests/unit/`, and `backend/foundation-web/src/test/resources/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement core platform domain models in `backend/foundation-domain/src/main/java/com/billu/foundation/domain/EnvironmentProfile.java`, `LegacyDependency.java`, `AccessContext.java`, `JobDefinition.java`, `JobExecution.java`, `AuditEvent.java`, `MockDataset.java`, and `SchedulerCatalog.java`
- [X] T006 [P] Implement platform use-case interfaces and DTOs in `backend/foundation-application/src/main/java/com/billu/foundation/application/health/`, `readiness/`, `dependencies/`, `auth/`, `jobs/`, `datasets/`, and `transition/`
- [X] T007 [P] Implement environment/profile bootstrap and configuration resolution in `backend/foundation-web/src/main/java/com/billu/foundation/web/config/BootstrapConfig.java`, `EnvironmentProfileResolver.java`, and `backend/foundation-web/src/main/resources/application.properties`
- [X] T008 [P] Implement secret provider abstraction, local secret provider, and CyberArk adapter boundary in `backend/foundation-infrastructure-secrets/src/main/java/com/billu/foundation/infrastructure/secrets/SecretProvider.java`, `LocalSecretProvider.java`, and `CyberArkSecretProvider.java`
- [X] T009 [P] Implement scheduler catalog parser and job registry in `backend/foundation-application/src/main/java/com/billu/foundation/application/jobs/SchedulerCatalogLoader.java`, `JobRegistry.java`, and `backend/config/schedulers/local-schedulers.json`
- [X] T010 [P] Implement correlation, structured logging, and audit publishing baseline in `backend/foundation-web/src/main/java/com/billu/foundation/web/filters/CorrelationFilter.java`, `backend/foundation-application/src/main/java/com/billu/foundation/application/observability/AuditPublisher.java`, and `backend/foundation-web/src/main/resources/logback.xml`
- [X] T011 [P] Implement Oracle connectivity baseline and readiness probe in `backend/foundation-infrastructure-oracle/src/main/java/com/billu/foundation/infrastructure/oracle/OracleConnectionFactory.java` and `OracleReadinessProbe.java`
- [X] T012 [P] Implement mock dataset bootstrap repository in `backend/foundation-infrastructure-mock/src/main/java/com/billu/foundation/infrastructure/mock/MockDatasetRepository.java`, `MockDatasetLoader.java`, and `backend/foundation-web/src/test/resources/mock-datasets/bootstrap.json`
- [X] T013 [P] Implement legacy dependency inventory and read-only adapter shell in `backend/foundation-infrastructure-legacy/src/main/java/com/billu/foundation/infrastructure/legacy/LegacyDependencyCatalog.java`, `LegacyReadOnlyAdapter.java`, and `LegacyWriteBlockGuard.java`
- [X] T014 Configure WebSphere 9 compatible WAR/EAR packaging in `backend/foundation-web/pom.xml`, `backend/foundation-ear/pom.xml`, and `backend/foundation-ear/src/main/application/META-INF/application.xml`
- [X] T015 Implement shared exception mapping and API response envelope in `backend/foundation-web/src/main/java/com/billu/foundation/web/errors/GlobalExceptionMapper.java` and `backend/foundation-web/src/main/java/com/billu/foundation/web/api/ApiEnvelope.java`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Plataforma Base Validable (Priority: P1) 🎯 MVP

**Goal**: Permitir que el backend institucional arranque localmente en Mac en modo `local-mock` y `local-oracle`, con contratos verificables y smoke flow repetible

**Independent Test**: El equipo puede levantar el backend en Mac, consultar health/readiness/auth context, cargar un dataset mockeado y validar comportamiento equivalente con o sin Oracle disponible

### Tests for User Story 1 ⚠️

- [X] T016 [P] [US1] Create contract tests for `/internal/platform/health`, `/internal/platform/readiness`, and `/internal/platform/dependencies` in `tests/contract/platform_health_contract_test.java`
- [X] T017 [P] [US1] Create contract tests for `/internal/platform/auth/context` and `/internal/platform/mock-datasets/{datasetKey}/load` in `tests/contract/platform_local_contract_test.java`
- [X] T018 [P] [US1] Create local-mock integration smoke flow in `tests/integration/local_mock_smoke_test.java`
- [X] T019 [P] [US1] Create local-oracle integration smoke flow and degraded-readiness coverage in `tests/integration/local_oracle_smoke_test.java`

### Implementation for User Story 1

- [X] T020 [US1] Implement health, readiness, and dependency controllers in `backend/foundation-web/src/main/java/com/billu/foundation/web/api/PlatformHealthController.java` and `PlatformReadinessController.java`
- [X] T021 [US1] Implement auth context and mock dataset controllers in `backend/foundation-web/src/main/java/com/billu/foundation/web/api/PlatformAuthController.java` and `PlatformMockDatasetController.java`
- [X] T022 [US1] Implement local validation orchestration for `local-mock` and `local-oracle` in `backend/foundation-application/src/main/java/com/billu/foundation/application/validation/LocalValidationService.java`
- [X] T023 [US1] Wire environment-specific profile switching and dataset bootstrap in `backend/foundation-web/src/main/java/com/billu/foundation/web/config/ProfileSwitchConfig.java`, `backend/foundation-web/src/main/resources/application-local-mock.properties`, and `backend/foundation-web/src/main/resources/application-local-oracle.properties`
- [X] T024 [US1] Update developer run commands and smoke criteria in `specs/001-backend-foundation/quickstart.md` to match implemented local startup behavior

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Coexistencia Controlada Con El Legado (Priority: P2)

**Goal**: Definir y exponer la coexistencia temporal con el legado mediante inventario, adaptadores read-only y evidencia de rollback

**Independent Test**: El equipo puede consultar el inventario de dependencias legadas, comprobar que el bridge es de solo lectura y validar el fallback cuando una dependencia transitoria o Oracle no estan disponibles

### Tests for User Story 2 ⚠️

- [X] T025 [P] [US2] Create coexistence policy integration test for legacy inventory and read-only enforcement in `tests/integration/legacy_bridge_policy_test.java`
- [X] T026 [P] [US2] Create transition fallback and rollback integration test in `tests/integration/transition_fallback_test.java`

### Implementation for User Story 2

- [X] T027 [US2] Implement legacy dependency inventory service and endpoint in `backend/foundation-application/src/main/java/com/billu/foundation/application/dependencies/LegacyDependencyService.java` and `backend/foundation-web/src/main/java/com/billu/foundation/web/api/LegacyDependencyController.java`
- [X] T028 [US2] Implement read-only legacy bridge adapters and write blocking guards in `backend/foundation-infrastructure-legacy/src/main/java/com/billu/foundation/infrastructure/legacy/SheetReadOnlyBridge.java`, `DriveReadOnlyBridge.java`, and `LegacyWriteBlockGuard.java`
- [X] T029 [US2] Implement transition status and rollback evidence service in `backend/foundation-application/src/main/java/com/billu/foundation/application/transition/TransitionStatusService.java` and `backend/foundation-web/src/main/java/com/billu/foundation/web/api/TransitionController.java`
- [X] T030 [US2] Document coexistence boundaries, retirement criteria, and rollback runbook in `specs/001-backend-foundation/quickstart.md` and `docs/backend-foundation-runbook.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Operacion Basica Auditada (Priority: P3)

**Goal**: Habilitar autenticacion desacoplada, ejecucion de jobs desde JSON local, logging estructurado y auditoria correlacionable

**Independent Test**: Una solicitud autenticada y un job manual generan trazas, auditoria y estado operativo verificable en local y con comportamiento compatible con el despliegue institucional

### Tests for User Story 3 ⚠️

- [X] T031 [P] [US3] Create contract tests for `/internal/platform/jobs/{jobKey}/executions` and `/internal/platform/jobs/{jobKey}/executions/{executionId}` in `tests/contract/platform_jobs_contract_test.java`
- [X] T032 [P] [US3] Create integration test for audit/log correlation on job execution in `tests/integration/job_audit_trace_test.java`
- [X] T033 [P] [US3] Create integration test for local secret provider fallback with CyberArk disabled in `tests/integration/secrets_provider_fallback_test.java`

### Implementation for User Story 3

- [X] T034 [US3] Implement job execution and query controllers in `backend/foundation-web/src/main/java/com/billu/foundation/web/api/PlatformJobController.java` and `backend/foundation-application/src/main/java/com/billu/foundation/application/jobs/JobExecutionService.java`
- [X] T035 [US3] Implement audit event persistence and structured operational logging in `backend/foundation-application/src/main/java/com/billu/foundation/application/observability/AuditTrailService.java`, `backend/foundation-infrastructure-oracle/src/main/java/com/billu/foundation/infrastructure/oracle/AuditEventRepository.java`, and `backend/foundation-web/src/main/resources/logback.xml`
- [X] T036 [US3] Implement effective access context resolution with local and future federated modes in `backend/foundation-application/src/main/java/com/billu/foundation/application/auth/AccessContextService.java` and `backend/foundation-web/src/main/java/com/billu/foundation/web/security/AccessContextFilter.java`
- [X] T037 [US3] Implement scheduler execution pipeline from `backend/config/schedulers/local-schedulers.json` to job runner in `backend/foundation-application/src/main/java/com/billu/foundation/application/jobs/JsonSchedulerExecutor.java`
- [X] T038 [US3] Implement secret resolution flow with local provider fallback and CyberArk integration boundary in `backend/foundation-infrastructure-secrets/src/main/java/com/billu/foundation/infrastructure/secrets/SecretResolutionService.java`
- [X] T039 [US3] Expose operational metrics and correlation fields across controllers and jobs in `backend/foundation-web/src/main/java/com/billu/foundation/web/metrics/PlatformMetricsPublisher.java`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T040 [P] Create architecture and deployment notes for the foundation in `docs/backend-foundation-architecture.md`
- [X] T041 [P] Add WebSphere 9 EAR verification support in `backend/scripts/verify-ear.sh` and `tests/integration/websphere9_packaging_smoke_test.sh`
- [X] T042 Harden scheduler JSON and mock dataset validation rules in `backend/foundation-application/src/main/java/com/billu/foundation/application/jobs/SchedulerCatalogValidator.java` and `backend/foundation-application/src/main/java/com/billu/foundation/application/datasets/MockDatasetValidator.java`
- [X] T043 Run end-to-end quickstart validation and record final command set in `specs/001-backend-foundation/quickstart.md`
- [X] T044 [P] Update agent and traceability context in `AGENTS.md` and `docs/backend-foundation-runbook.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Recommended after US1 baseline controllers are stable, but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Recommended after US1 baseline startup flow is stable, but independently testable

### Within Each User Story

- Tests MUST be written and fail before implementation
- Controllers depend on foundational application services
- Environment/config wiring must complete before story closure
- Observability, audit and rollback evidence must exist before story closure
- Story complete before being marked deliverable

### Suggested Story Completion Order

- **MVP**: Setup -> Foundational -> User Story 1
- **Next**: User Story 2
- **Then**: User Story 3
- **After foundation**: Start the next feature slices in this order: Resumen de Clientes, then Categorizacion de Clientes

### Parallel Opportunities

- T003 and T004 can run in parallel after T001-T002
- T006-T014 can run in parallel once T005 exists as the shared domain baseline
- T016-T019 can run in parallel inside US1
- T025-T026 can run in parallel inside US2
- T031-T033 can run in parallel inside US3
- T040, T041, and T044 can run in parallel during Polish

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 contract and integration tests together:
Task: "Create contract tests for /internal/platform/health, /internal/platform/readiness, and /internal/platform/dependencies in tests/contract/platform_health_contract_test.java"
Task: "Create contract tests for /internal/platform/auth/context and /internal/platform/mock-datasets/{datasetKey}/load in tests/contract/platform_local_contract_test.java"
Task: "Create local-mock integration smoke flow in tests/integration/local_mock_smoke_test.java"
Task: "Create local-oracle integration smoke flow and degraded-readiness coverage in tests/integration/local_oracle_smoke_test.java"
```

```bash
# Launch User Story 1 implementation split by files:
Task: "Implement health, readiness, and dependency controllers in backend/foundation-web/src/main/java/com/billu/foundation/web/api/PlatformHealthController.java and PlatformReadinessController.java"
Task: "Implement auth context and mock dataset controllers in backend/foundation-web/src/main/java/com/billu/foundation/web/api/PlatformAuthController.java and PlatformMockDatasetController.java"
Task: "Implement local validation orchestration for local-mock and local-oracle in backend/foundation-application/src/main/java/com/billu/foundation/application/validation/LocalValidationService.java"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `local-mock` and `local-oracle` smoke validation from `quickstart.md`
5. Review WebSphere 9 packaging baseline before expanding scope

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Demo local startup and platform contracts
3. Add User Story 2 -> Test independently -> Demo coexistence and rollback evidence
4. Add User Story 3 -> Test independently -> Demo jobs, auth context, and audit trail
5. Start the next feature spec/tasks for Resumen de Clientes, then Categorizacion de Clientes

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Polish closes packaging, docs, and quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies on unfinished tasks
- All story tasks include exact file paths to keep them directly executable
- WhatsApp remains explicitly out of scope for this `tasks.md`
