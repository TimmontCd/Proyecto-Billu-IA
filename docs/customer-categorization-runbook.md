# Customer Categorization Runbook

## Purpose

Operar el slice `Categorizacion de Clientes` durante su etapa inicial de
coexistencia con el legado.

## Scope

- dashboard ejecutivo de segmentos
- consulta por `ID RECOMPENSAS`
- exportes de segmento y venta cruzada
- pantalla institucional `/customer-categorization/`

## Operating modes

- `local-mock`: usa fixtures versionados del slice y permite validar contratos
  sin Oracle.
- `legacy read-only`: se activa en ambientes `local-*` cuando
  `billu.legacy.bridge.enabled=true` y preserva continuidad operativa temporal.
- `local-oracle`: usa boundary Oracle con
  `billu.mock.enabled=false`, `billu.oracle.enabled=true` y
  `billu.legacy.bridge.enabled=false`.

## Export endpoints

```bash
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/segment \
  -H 'Content-Type: application/json' \
  -d '{"segmentId":"Constructores"}'

curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/cross-sell \
  -H 'Content-Type: application/json' \
  -d '{"segmentId":"Constructores"}'
```

Respuesta esperada:

- `202 Accepted`
- `exportType`
- `segmentId`
- `segmentLabel`
- `outcome`
- `fileName`
- `rowCount`
- `correlationId`
- `csvContent`

En `local-oracle`, los endpoints del slice ya intentan abrir conexion JDBC
contra Oracle. Si faltan `BILLU_ORACLE_URL`, `BILLU_ORACLE_USER` o
`BILLU_ORACLE_PASSWORD`, la respuesta esperada cambia a falla rapida con `500`
y mensaje explicito de configuracion incompleta. Eso confirma que el endpoint
ya no esta degradando silenciosamente a `legacy`.

Con credenciales validas en Oracle local, el smoke verificado es:

- `GET /internal/customer-categorization/dashboard` -> `200` con
  `sourceMode=ORACLE`.
- `GET /internal/customer-categorization/rewards/ABC123` -> `200` con una
  coincidencia para `ID RECOMPENSAS`, `fileName` y `csvContent` descargable.
- `GET /internal/customer-categorization/rewards/NOEXISTE` -> `200` con
  `totalMatches=0`.
- `POST /internal/customer-categorization/exports/segment` -> `202`.
- `POST /internal/customer-categorization/exports/cross-sell` -> `202`.

## Frontend operation

La pantalla ligera tiene una sola fuente activa:

- `backend/src/main/resources/static/assets/` para shell compartido.
- `backend/src/main/resources/static/customer-categorization/` para la
  funcionalidad del modulo.

URL principal con Spring Boot local:

```text
http://localhost:8080/customer-categorization/
```

Arranque recomendado:

```powershell
.\backend\scripts\run-local-oracle.ps1
```

La pantalla conserva los conceptos del legacy:

- niveles `Exploradores`, `Constructores` y `Aliados Premium`
- reglas de clasificacion heredadas
- consulta por `ID RECOMPENSAS`
- tarjeta sugerida, productos activos/faltantes y campana sugerida
- exporte de segmento y exporte de venta cruzada

## Rollback guidance

- Si `local-oracle` no tiene credenciales Oracle o no logra conectividad,
  debe fallar rapido y documentarse; no debe validarse contra un fallback
  silencioso.
- Si se necesita continuidad operativa local mientras Oracle madura, usar
  explicitamente `local-mock` o un ambiente con `billu.legacy.bridge.enabled=true`.
