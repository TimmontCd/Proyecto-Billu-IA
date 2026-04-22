# Customer Categorization Runbook

## Purpose

Operar el slice `Categorizacion de Clientes` durante su etapa inicial de
coexistencia con el legado.

## Scope

- dashboard ejecutivo de segmentos
- consulta por `ID RECOMPENSAS`
- exportes de segmento y venta cruzada

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

En `local-oracle`, los endpoints del slice ya intentan abrir conexion JDBC
contra Oracle. Si faltan `BILLU_ORACLE_URL`, `BILLU_ORACLE_USER` o
`BILLU_ORACLE_PASSWORD`, la respuesta esperada cambia a falla rapida con `500`
y mensaje explicito de configuracion incompleta. Eso confirma que el endpoint
ya no esta degradando silenciosamente a `legacy`.

## Rollback guidance

- Si `local-oracle` no tiene credenciales Oracle o no logra conectividad,
  debe fallar rapido y documentarse; no debe validarse contra un fallback
  silencioso.
- Si se necesita continuidad operativa local mientras Oracle madura, usar
  explicitamente `local-mock` o un ambiente con `billu.legacy.bridge.enabled=true`.
