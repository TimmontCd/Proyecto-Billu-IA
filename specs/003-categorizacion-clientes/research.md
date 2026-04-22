# Research: Categorizacion de Clientes

## Source Legacy Evidence

- Controller principal: `legacy/src/controllers/CustomerCategorizationController.gs`
- Servicio principal: `legacy/src/services/CustomerCategorizationService.gs`
- Vista legacy: modulo `customer-categorization` dentro de `legacy/src/views/index.html`

## Functional Findings

- El dashboard agrupa clientes en tres niveles:
  - `Exploradores`
  - `Constructores`
  - `Aliados_Premium`
- La regla combina:
  - saldo promedio 3 meses
  - volumen de transacciones
  - antiguedad
- Existen dos exportables:
  - export por segmento
  - export de venta cruzada
- Existe busqueda por `ID RECOMPENSAS` con detalle individual.

## Migration Decisions

- Migrar primero lectura y exportacion, sin escrituras sobre hojas o Drive.
- Mantener nomenclatura funcional de niveles para preservar continuidad operativa.
- Introducir contratos institucionales estables aunque la fuente cambie.
- Modelar mock datasets suficientemente cercanos al legado para facilitar la UI.
- Repetir estrategia `local-mock -> legacy read-only -> oracle`.

## Open Technical Notes

- La logica de calculo actual usa fuentes de portafolio y transacciones; en el
  primer corte institucional esto puede simplificarse en mock y legacy bridge.
- Los exportables institucionales pueden iniciar como metadata + contenido
  serializado, igual que en `Resumen de Clientes`.
- La primera pantalla institucional puede ser un dashboard ligero como el slice
  anterior, sin depender de toolchains frontend pesadas.
