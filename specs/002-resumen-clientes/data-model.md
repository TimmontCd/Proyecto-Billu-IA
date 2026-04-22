# Data Model: Resumen de Clientes

## Overview

El slice modela vistas de lectura y exportación del dominio `Accounts`. No
introduce aún escrituras de negocio; por tanto, las entidades se diseñan como
proyecciones institucionales del estado actual y de la futura persistencia en
Oracle.

## Entities

### CustomerAccountSummary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| summaryId | string | yes | Identificador lógico de la consulta |
| environment | string | yes | Ambiente activo |
| totalAccounts | number | yes | Total de cuentas del universo consultado |
| totalBalance | number | yes | Saldo total consolidado |
| activeAccounts | number | yes | Cuentas activas |
| inactiveAccounts | number | no | Cuentas inactivas |
| executiveSummary | string | no | Texto resumen para consumo ejecutivo |
| sourceMode | string | yes | `LOCAL_MOCK`, `LEGACY_READ_ONLY` u `ORACLE` |
| generatedAt | datetime | yes | Momento de generación |

### ProductSummaryItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productKey | string | yes | Código lógico del producto |
| productLabel | string | yes | Etiqueta legible |
| accounts | number | yes | Número de cuentas |
| sharePct | number | no | Participación relativa |
| totalBalance | number | no | Balance asociado |
| status | string | yes | Estado de la agregación |

### HistoricalOpeningSeries

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rangeStart | date | yes | Inicio del rango consultado |
| rangeEnd | date | yes | Fin del rango consultado |
| totalAccounts | number | yes | Total de aperturas en el rango |
| averagePerDay | number | no | Promedio diario |
| peakLabel | string | no | Punto máximo del periodo |
| seriesPoints | array | yes | Serie temporal de aperturas |
| monthlySummary | array | yes | Resumen agregado por mes |

### First30Cohort

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cohortYear | number | yes | Año de la cohorte |
| cohortMonth | number | yes | Mes de la cohorte |
| openingAccounts | number | yes | Cuentas abiertas |
| qualifiedAccounts | number | no | Cuentas que cumplen regla First 30 |
| transactionalAccounts | number | no | Cuentas con uso dentro de la ventana |
| qualifiedPct | number | no | Proporción de cumplimiento |
| status | string | yes | Estado del cálculo |

### CardCoverageSnapshot

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| coveredAccounts | number | yes | Clientes con cobertura de tarjeta |
| uncoveredAccounts | number | no | Clientes sin cobertura |
| transactionalAccounts | number | no | Clientes con uso reciente |
| coveredTransactionalAccounts | number | no | Clientes cubiertos con uso |
| segments | array | yes | Distribución por tipo de cobertura |
| generatedAt | datetime | yes | Momento de generación |

### AccountsExportRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| exportType | string | yes | `HISTORICAL_MONTH`, `FIRST30_MONTH` o `CARD_COVERAGE` |
| environment | string | yes | Ambiente activo |
| requestedBy | string | yes | Actor que dispara la exportación |
| filters | object | no | Filtros aplicados |
| correlationId | string | yes | Identificador de trazabilidad |
| outcome | string | yes | Resultado de la ejecución |

### AccountsDataSource

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sourceKey | string | yes | Identificador del origen |
| sourceType | string | yes | `MOCK`, `LEGACY`, `ORACLE` |
| accessMode | string | yes | `READ_ONLY` o `READ_WRITE` |
| owner | string | yes | Responsable del origen |
| retirementCriteria | string | no | Criterio de salida para origen temporal |
| status | string | yes | Estado operativo |

## Relationships

- `CustomerAccountSummary` contiene múltiples `ProductSummaryItem`.
- `HistoricalOpeningSeries` agrega múltiples resúmenes mensuales y puede
  relacionarse con varias `First30Cohort`.
- `CardCoverageSnapshot` resume segmentos que derivan del mismo universo de
  cuentas del `CustomerAccountSummary`.
- `AccountsExportRequest` se ejecuta contra una o más `AccountsDataSource`.

## Validation Rules

- Ninguna respuesta principal del slice debe emitirse sin `environment`,
  `sourceMode` y timestamp de generación.
- Las exportaciones deben registrar `requestedBy`, `correlationId` y `outcome`.
- Toda fuente de tipo `LEGACY` debe estar marcada como `READ_ONLY`.
- Los periodos históricos deben validar coherencia entre fecha inicial y final.
- Las cohortes First 30 no deben incluir registros fuera de la ventana aprobada.
