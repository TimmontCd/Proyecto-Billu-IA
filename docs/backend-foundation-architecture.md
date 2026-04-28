# Backend Foundation Architecture

## Scope

La fundacion institucional del backend de Billu entrega la base tecnica para
arranque local, coexistencia temporal con el legado, ejecucion de jobs,
observabilidad y preparacion de modulos funcionales posteriores.

## Layout

```text
backend/
|- pom.xml
|- config/
|- scripts/
`- src/
   |- main/java/com/billu/
   |  |- accounts/
   |  |- categorization/
   |  `- foundation/
   `- main/resources/
      |- static/
      `- mock-datasets/
```

La aplicacion es un solo modulo Spring Boot 2.7.x compatible con Java 8. La
separacion de responsabilidades queda en paquetes:

- `domain`: modelos y proyecciones de negocio.
- `application`: gateways, casos de uso, validadores y auditoria.
- `infrastructure`: adaptadores Oracle, mock, secrets y bridges read-only.
- `web`: filtros, controladores internos, DTOs HTTP, metricas y static shell.

## Runtime flow

1. Spring Boot arranca `BilluFoundationApplication`.
2. `CorrelationFilter` genera `correlationId`.
3. `AccessContextFilter` resuelve metadata minima del actor.
4. Jersey publica endpoints internos bajo `/internal/*`.
5. `PlatformComponentFactory` arma servicios, adaptadores y proveedores.
6. Los casos de uso publican auditoria y metricas de operacion.

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

- El artefacto operativo local es `backend/target/billu-backend-0.1.0-SNAPSHOT.jar`.
- El arranque local recomendado es `.\backend\scripts\run-local-oracle.ps1`.
- El proyecto ya no genera EAR/WAR por modulo; Spring Boot empaqueta la app y
  sirve los recursos estaticos desde `backend/src/main/resources/static`.

## Next modules

Los nuevos modulos del menu deben agregarse como paquetes bajo
`backend/src/main/java/com/billu/<module>/` y, si tienen UI ligera, bajo
`backend/src/main/resources/static/<module>/`.
