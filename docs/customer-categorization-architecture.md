# Customer Categorization Architecture

## Purpose

Documentar la arquitectura inicial del slice `Categorizacion de Clientes`
desplegado sobre la foundation institucional Java 8.

## Flow

1. La UI o consumidor invoca `/internal/customer-categorization/...`.
2. Jersey enruta la solicitud hacia los controllers del slice.
3. El controller resuelve `correlationId`, delega al use case y publica metricas.
4. El use case valida request, obtiene `AccessContext`, ejecuta el gateway y
   registra auditoria.
5. El gateway activo se selecciona por ambiente:
   - `local-mock` -> repositorios mock con datasets versionados.
   - `local-*` con `billu.legacy.bridge.enabled=true` -> bridge read-only legado.
   - `local-oracle`, `dev`, `qa` con `billu.legacy.bridge.enabled=false` ->
     boundary Oracle.

## Components

- `CustomerCategorizationDashboardController`: contrato institucional para KPIs
  y segmentos.
- `CustomerCategorizationLookupController`: consulta por `ID RECOMPENSAS`.
- `CustomerCategorizationExportController`: exportes de segmento y venta cruzada.
- `CustomerCategorizationComponentFactory`: cableado del slice y seleccion de
  fuente.
- `CustomerCategorizationAuditService`: evidencia auditable de dashboard,
  lookup y export.
- `CustomerCategorizationMetricsPublisher`: telemetria operativa del slice.

## Data Sources

- `mock-datasets/*.json` soporta validacion local sin Oracle.
- Adaptadores `legacy` preservan coexistencia temporal read-only.
- Repositorios `oracle` marcan el boundary institucional final y deben
  reemplazar las fuentes temporales cuando exista proyeccion disponible.
- Hoy ya existe lectura JDBC preparada para `dashboard`, `lookup` por
  `ID RECOMPENSAS` y metadata de exportes por segmento.

## Export Strategy

- Los exportes institucionales responden `202 Accepted` con metadata estable.
- El payload incluye `exportType`, `segmentId`, `segmentLabel`, `outcome`,
  `fileName`, `rowCount`, `correlationId` y `summary`.
- En `local-mock` el contenido se sintetiza desde fixtures versionados.
- En `legacy` el contrato preserva nombres de archivo y conteos coherentes con
  el dominio operativo.

## local-oracle

- `local-oracle` ya no debe degradar automaticamente a `legacy`.
- El ambiente usa `billu.mock.enabled=false`, `billu.oracle.enabled=true` y
  `billu.legacy.bridge.enabled=false`.
- Si faltan credenciales Oracle o no existe conectividad, el modo
  `local-oracle` falla explicita y tempranamente para evitar validar un camino
  equivocado.
