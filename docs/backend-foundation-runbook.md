# Backend Foundation Runbook

## Purpose

Documentar la coexistencia temporal entre la fundacion institucional y el
legado mientras se termina la validacion de plataforma y antes de abrir slices
funcionales.

## Coexistence boundaries

- `legacy/` sigue siendo la fuente operativa para capacidades no migradas.
- `backend/` no puede introducir writes nuevos hacia Google Sheets o Google
  Drive como destino primario.
- Los bridges temporales al legado se permiten solo en modo `READ_ONLY`.
- Cada dependencia transitoria debe tener responsable, riesgo y criterio de
  retiro visibles en el inventario expuesto por la plataforma.

## Legacy inventory checks

Usar estos endpoints para levantar evidencia:

```bash
curl -s http://localhost:8080/internal/platform/dependencies
curl -s http://localhost:8080/internal/platform/dependencies/legacy
curl -s http://localhost:8080/internal/platform/transition
```

Interpretacion esperada:

- `/dependencies` muestra el estado operativo de dependencias de plataforma.
- `/dependencies/legacy` muestra el inventario temporal proveniente del legado.
- `/transition` confirma si la fundacion esta coexistiendo con rollback listo o
  si el fallback al legado ya debe considerarse activo.

## Rollback criteria

Activar fallback cuando ocurra cualquiera de estas condiciones:

- una dependencia de plataforma quede en `NOT_READY`;
- Oracle no permita completar la validacion minima del ambiente;
- no exista evidencia suficiente de arranque, readiness o trazabilidad para el
  flujo evaluado.

## Rollback procedure

1. Detener la validacion del flujo institucional afectado.
2. Confirmar en `/internal/platform/transition` que el rollback quede `ACTIVE`
   o, si aun no cambia, registrar manualmente la causa.
3. Mantener la operacion critica en el legado.
4. Registrar la dependencia bloqueante, el ambiente afectado y el criterio de
   salida antes de reintentar.

## Retirement criteria

- Reemplazo Oracle validado para el slice funcional correspondiente.
- Configuracion y secretos resueltos por mecanismos institucionales.
- Job o proceso equivalente ya soportado fuera de Apps Script.
- Evidencia de smoke local e institucional sin dependencia critica del puente.

## Packaging validation

- Construir `EAR` con `mvn -f backend/pom.xml -pl foundation-ear -am -DskipTests package`.
- Verificar estructura con `backend/scripts/verify-ear.sh`.
- Registrar el resultado del smoke de empaquetado antes de promover a DEV o QA.
