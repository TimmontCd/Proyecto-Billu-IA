# Customer Categorization Architecture

## Purpose

Documentar la arquitectura inicial del slice `Categorizacion de Clientes`
desplegado sobre la foundation institucional Java 8.

## Flow

1. La UI estatica `/customer-categorization/` o un consumidor interno invoca
   `/internal/customer-categorization/...`.
2. Spring Boot 2.7.x arranca el modulo web y delega `/internal/*` a Jersey.
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
- `backend/src/main/resources/static/assets`: shell compartido para
  navegacion, layout base, helpers HTTP y descargas.
- `backend/src/main/resources/static/customer-categorization`: modulo
  funcional servido por Spring Boot.

## Data Sources

- `mock-datasets/*.json` soporta validacion local sin Oracle.
- Adaptadores `legacy` preservan coexistencia temporal read-only.
- Repositorios `oracle` marcan el boundary institucional final y deben
  reemplazar las fuentes temporales cuando exista proyeccion disponible.
- Hoy ya existe lectura JDBC preparada para `dashboard`, `lookup` por
  `ID RECOMPENSAS` y metadata de exportes por segmento.

## Legacy migration notes

La pantalla institucional no reusa el Apps Script, pero mantiene el mapa
funcional del modulo legacy:

- dashboard de niveles
- reglas para `Exploradores`, `Constructores` y `Aliados_Premium`
- busqueda por `ID RECOMPENSAS`
- recomendacion de tarjeta, productos activos/faltantes y campana sugerida
- solicitud de exportes de segmento y venta cruzada

## Export Strategy

- Los exportes institucionales responden `202 Accepted` con metadata estable y
  contenido CSV listo para descarga.
- El payload incluye `exportType`, `segmentId`, `segmentLabel`, `outcome`,
  `fileName`, `rowCount`, `correlationId`, `summary` y `csvContent`.
- En `local-mock` el contenido se sintetiza desde fixtures versionados.
- En `legacy` el contrato preserva nombres de archivo y conteos coherentes con
  el dominio operativo.

## local-oracle

- El arranque local recomendado es `backend/scripts/run-local-oracle.ps1`,
  que carga `.env` y ejecuta `spring-boot:run`.
- `local-oracle` ya no debe degradar automaticamente a `legacy`.
- El ambiente usa `billu.mock.enabled=false`, `billu.oracle.enabled=true` y
  `billu.legacy.bridge.enabled=false`.
- Si faltan credenciales Oracle o no existe conectividad, el modo
  `local-oracle` falla explicita y tempranamente para evitar validar un camino
  equivocado.
- Con credenciales validas, la respuesta de dashboard reporta
  `sourceMode=ORACLE` y la UI queda disponible en
  `/customer-categorization/`.
