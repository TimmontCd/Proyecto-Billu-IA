# Research: Resumen de Clientes

## Decision 1: Migrar primero contratos de lectura y exportación

**Decision**: La primera iteración del slice institucional cubrirá únicamente
consultas y exportables controlados del dominio `Accounts`.

**Rationale**: El legado existente muestra una capacidad madura de lectura para
resumen, histórico, First 30 y cobertura de plásticos. Llevar primero esta
superficie a la foundation reduce riesgo, evita writes tempranos y permite
paridad funcional verificable antes de modelar operaciones más sensibles.

**Alternatives considered**:

- Migrar también escrituras u operaciones de mantenimiento en el mismo corte.
  Rechazado por aumentar riesgo operacional y dependencia del legado.

## Decision 2: Mantener coexistencia read-only con el legado mientras Oracle madura

**Decision**: El slice usará gateways de dominio con dos fuentes posibles:
dataset mockeado para `local-mock` y bridge legacy read-only para paridad
temporal mientras Oracle no tenga proyecciones equivalentes.

**Rationale**: La foundation ya dejó base para coexistencia controlada y este
slice depende de lógica descubierta en hojas/tablas del legado. Encapsular esa
lectura detrás de gateways permite avanzar sin congelar el dominio ni
contaminar contratos institucionales.

**Alternatives considered**:

- Esperar a que Oracle esté completo antes de abrir el slice. Rechazado por
  bloquear la migración incremental acordada.
- Consumir directamente el legado desde el controlador web. Rechazado por romper
  separación de capas y observabilidad.

## Decision 3: Organizar el slice por tres subcapacidades funcionales

**Decision**: El trabajo se dividirá en resumen ejecutivo, histórico/First 30 y
plásticos/exportables como historias independientes.

**Rationale**: El legado muestra estas capacidades como bloques diferenciables,
con valor de negocio propio y posibilidad de demostración independiente.

**Alternatives considered**:

- Un único bloque “Accounts completo”. Rechazado por ser menos incremental y
  menos demostrable.

## Decision 4: Reusar la foundation para auth, auditoría, secretos y métricas

**Decision**: El slice no introducirá soluciones propias de auth, auditoría,
secretos ni scheduler; reutilizará la infraestructura ya creada en la
foundation.

**Rationale**: La foundation ya cubre esos concerns con compatibilidad
institucional. Duplicarlos en el slice aumentaría complejidad y riesgo.

**Alternatives considered**:

- Crear servicios específicos dentro del slice para cada concern transversal.
  Rechazado por redundancia.

## Decision 5: Exponer contratos internos HTTP del slice desde el mismo WAR

**Decision**: El slice publicará endpoints internos del dominio bajo la capa web
existente, dentro del mismo artefacto `WAR/EAR`.

**Rationale**: El target institucional ya está validado y el objetivo de este
slice es sumar capacidad funcional sobre esa base, no abrir un nuevo servicio.

**Alternatives considered**:

- Crear un servicio o módulo web independiente. Rechazado por complejidad
  innecesaria en esta etapa.
