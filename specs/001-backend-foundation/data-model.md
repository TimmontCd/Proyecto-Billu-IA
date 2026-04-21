# Data Model: Fundacion Backend Institucional

## Overview

Este modelo cubre solo entidades de plataforma necesarias para arrancar la
migracion del backend principal. No representa todavia el modelo completo de los
dominios funcionales del legado.

## Entity: EnvironmentProfile

**Purpose**: Define el perfil operativo de un ambiente (`local-mock`,
`local-oracle`, `dev`, `qa`, `prod`) y los adaptadores permitidos en cada uno.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| environmentKey | string | yes | Identificador unico del ambiente |
| displayName | string | yes | Nombre visible del perfil |
| mockModeEnabled | boolean | yes | Indica si admite datasets mockeados |
| oracleModeEnabled | boolean | yes | Indica si admite conexion Oracle |
| legacyBridgeEnabled | boolean | yes | Indica si admite adaptadores legados read-only |
| secretSource | string | yes | Referencia al origen de secretos |
| deploymentTarget | string | yes | `local`, `dev`, `qa`, `prod`, `was9` |
| status | enum | yes | `ACTIVE`, `INACTIVE` |

**Validation Rules**:

- `environmentKey` debe ser unico.
- `prod` no permite `mockModeEnabled = true`.
- `deploymentTarget` debe mapear a una estrategia de configuracion conocida.

## Entity: LegacyDependency

**Purpose**: Catalogar dependencias temporales heredadas de `legacy/` que
impactan la transicion.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| dependencyKey | string | yes | Identificador unico |
| dependencyType | enum | yes | `SHEET`, `DRIVE`, `DOC`, `SCRIPT_PROPERTY`, `TRIGGER`, `API`, `LOG_SOURCE` |
| sourceReference | string | yes | Ruta, ID o descripcion de la dependencia |
| businessCapability | string | yes | Capacidad de negocio afectada |
| accessMode | enum | yes | `READ_ONLY`, `WRITE_BLOCKED`, `TEMPORARY_BRIDGE` |
| owner | string | yes | Responsable funcional/tecnico |
| exitCriteria | string | yes | Condicion para retiro |
| riskLevel | enum | yes | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| status | enum | yes | `IDENTIFIED`, `BRIDGED`, `RETIRED` |

**Validation Rules**:

- Ninguna dependencia de plataforma nueva puede quedar sin `owner`.
- Las dependencias transitorias deben tener `exitCriteria`.
- `WRITE_BLOCKED` y `READ_ONLY` son estados preferentes para la primera
  iteracion.

## Entity: AccessContext

**Purpose**: Representar la identidad y autorizacion efectiva usada por la
plataforma inicial.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subjectId | string | yes | Identificador del actor |
| principalName | string | yes | Correo o alias corporativo |
| authSource | enum | yes | `LOCAL_MOCK`, `LEGACY_BRIDGE`, `CORPORATE_IDP` |
| roles | list<string> | yes | Roles efectivos |
| scopes | list<string> | no | Alcances operativos |
| environmentKey | string | yes | Ambiente en el que opera |
| sessionMode | enum | yes | `MOCK`, `SERVER_MANAGED`, `FEDERATED_READY` |
| issuedAt | datetime | yes | Momento de emision |

**Validation Rules**:

- `LOCAL_MOCK` solo es valido en ambientes locales.
- Los roles deben existir en un catalogo controlado por plataforma.
- El contexto debe incluir `environmentKey` para trazabilidad.

## Entity: JobDefinition

**Purpose**: Define un job calendarizable de plataforma.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| jobKey | string | yes | Identificador unico del job |
| jobName | string | yes | Nombre operativo |
| triggerMode | enum | yes | `MANUAL`, `SCHEDULED`, `MANUAL_AND_SCHEDULED` |
| idempotencyKeyStrategy | string | yes | Regla para evitar reprocesos |
| executionMode | enum | yes | `LOCAL`, `INSTITUTIONAL`, `BOTH` |
| owner | string | yes | Responsable del job |
| auditRequired | boolean | yes | Indica si genera evento de auditoria |
| status | enum | yes | `ACTIVE`, `PAUSED`, `RETIRED` |

**Validation Rules**:

- Todos los jobs deben definir estrategia de idempotencia.
- `executionMode = BOTH` requiere soporte local y despliegue institucional.

## Entity: JobExecution

**Purpose**: Registrar una corrida de un `JobDefinition`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| executionId | string | yes | Identificador unico |
| jobKey | string | yes | Referencia a `JobDefinition` |
| requestedBy | string | yes | Actor o scheduler solicitante |
| environmentKey | string | yes | Ambiente de la corrida |
| runMode | enum | yes | `MOCK`, `ORACLE`, `DEV`, `QA`, `PROD` |
| startedAt | datetime | yes | Inicio de ejecucion |
| finishedAt | datetime | no | Fin de ejecucion |
| outcome | enum | yes | `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| correlationId | string | yes | Correlacion transversal |
| summary | string | no | Resumen operativo |

**State Transitions**:

- `PENDING -> RUNNING`
- `RUNNING -> SUCCEEDED`
- `RUNNING -> FAILED`
- `RUNNING -> CANCELLED`

## Entity: AuditEvent

**Purpose**: Registrar evidencia auditada de operaciones y cambios de estado.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| auditEventId | string | yes | Identificador unico |
| eventType | string | yes | Tipo de evento |
| entityType | string | yes | Entidad afectada |
| entityId | string | yes | Identificador de la entidad afectada |
| actor | string | yes | Usuario o proceso |
| environmentKey | string | yes | Ambiente |
| correlationId | string | yes | Correlacion transversal |
| payloadSummary | string | no | Resumen del cambio |
| createdAt | datetime | yes | Fecha del evento |

**Validation Rules**:

- Todo `JobExecution` finalizado debe producir al menos un `AuditEvent`.
- Los eventos deben incluir `correlationId`.

## Entity: MockDataset

**Purpose**: Representar datasets mockeados controlados para validacion local.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| datasetKey | string | yes | Identificador unico |
| version | string | yes | Version del fixture |
| supportedContracts | list<string> | yes | Endpoints o casos soportados |
| sourceFormat | enum | yes | `JSON`, `CSV`, `SQL_SEED` |
| owner | string | yes | Responsable del dataset |
| consistencyLevel | enum | yes | `SMOKE`, `FUNCTIONAL`, `PARITY_TARGET` |
| status | enum | yes | `REGISTERED`, `LOADED`, `STALE`, `RETIRED` |

**Validation Rules**:

- Los datasets deben declarar que contratos cubren.
- `PARITY_TARGET` exige alineacion con el contrato HTTP actual.

## Entity: SchedulerCatalog

**Purpose**: Representar el archivo JSON local versionado que define los jobs
de plataforma mientras no exista un scheduler institucional conectado.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| catalogVersion | string | yes | Version del archivo |
| environmentKey | string | yes | Ambiente al que aplica |
| sourcePath | string | yes | Ruta versionada, por ejemplo `backend/config/schedulers/local-schedulers.json` |
| jobs | list<JobDefinition> | yes | Jobs definidos en el catalogo |
| updatedAt | datetime | yes | Ultima actualizacion conocida |
| status | enum | yes | `VALID`, `INVALID`, `STALE` |

**Validation Rules**:

- El catalogo debe existir en control de versiones.
- Cada `jobKey` del archivo debe ser unico.
- Los jobs definidos deben poder materializarse como `JobDefinition`.

## Relationships

- `EnvironmentProfile` 1..n `JobExecution`
- `JobDefinition` 1..n `JobExecution`
- `JobExecution` 1..n `AuditEvent`
- `EnvironmentProfile` 1..n `MockDataset`
- `EnvironmentProfile` 1..1 `SchedulerCatalog` en modos locales
- `LegacyDependency` n..1 `EnvironmentProfile` cuando una dependencia solo se
  permite en ciertos perfiles

## Notes for Implementation

- Estas entidades pueden comenzar como modelos de dominio y DTOs de contrato
  antes de persistirse completamente en Oracle.
- `LegacyDependency` y `MockDataset` pueden arrancar con almacenamiento de
  configuracion controlado, pero su contrato debe ser estable desde la
  fundacion.
