# Backend Foundation Architecture

## Scope

La fundacion institucional del backend de Billu entrega la base tecnica para
arranque local, despliegue institucional, coexistencia temporal con el legado,
ejecucion de jobs, observabilidad y preparacion de slices funcionales
posteriores.

## Module layout

```text
backend/
|- foundation-domain
|- foundation-application
|- foundation-infrastructure-oracle
|- foundation-infrastructure-mock
|- foundation-infrastructure-legacy
|- foundation-infrastructure-secrets
|- foundation-web
`- foundation-ear
```

- `foundation-domain`: modelos base de plataforma.
- `foundation-application`: casos de uso, validadores y servicios de orquestacion.
- `foundation-infrastructure-oracle`: conectividad Oracle y repositorio de auditoria.
- `foundation-infrastructure-mock`: datasets controlados para `local-mock`.
- `foundation-infrastructure-legacy`: inventario y bridges transitorios `READ_ONLY`.
- `foundation-infrastructure-secrets`: resolucion local y frontera CyberArk.
- `foundation-web`: filtros, controladores internos y empaquetado `WAR`.
- `foundation-ear`: ensamblado final `EAR` para WebSphere 9.

## Runtime flow

1. `CorrelationFilter` genera `correlationId`.
2. `AccessContextFilter` resuelve metadata minima del actor.
3. `PlatformApplication` registra los endpoints internos de plataforma.
4. `PlatformComponentFactory` arma servicios, adaptadores y proveedores.
5. Los casos de uso publican auditoria y metricas de operacion.

## Environment strategy

- `local-mock`: valida contratos y flujos base sin Oracle.
- `local-oracle`: mantiene los mismos contratos, pero intenta conectividad real.
- `dev`, `qa`: quedan preparados para despliegue institucional sin puente legado.

## Coexistence design

- El legado sigue siendo fuente operativa para capacidades no migradas.
- Toda integracion temporal expuesta por la foundation es `READ_ONLY`.
- `/internal/platform/dependencies/legacy` publica inventario y criterios de retiro.
- `/internal/platform/transition` expone estado de coexistencia y rollback.

## Operational controls

- Scheduler local versionado en `backend/config/schedulers/local-schedulers.json`.
- Validacion estructural de scheduler y mock datasets en la capa de aplicacion.
- Auditoria funcional via `AuditTrailService`.
- Logging JSON estructurado preparado para trazabilidad y futura centralizacion.
- Secrets con fallback local y frontera CyberArk desacoplada.

## Deployment notes

- El artefacto operativo final es `backend/foundation-ear/target/foundation-ear-0.1.0-SNAPSHOT.ear`.
- El `EAR` incluye el `WAR` de `foundation-web`.
- `backend/scripts/verify-ear.sh` valida estructura minima del empaquetado.
- `tests/integration/websphere9_packaging_smoke_test.sh` deja un smoke reproducible.

## Next slices

Una vez cerrada la foundation, el siguiente slice funcional es `Resumen de Clientes`
y despues `Categorizacion de Clientes`.
