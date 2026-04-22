# Feature Specification: Resumen de Clientes

**Feature Branch**: `002-resumen-clientes`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Iniciar el primer slice funcional posterior a la foundation: Resumen de Clientes."

## Migration Context *(mandatory)*

### Estado actual

El slice vigente de Resumen de Clientes vive en el legado bajo
`legacy/src/controllers/AccountsController.gs`,
`legacy/src/services/AccountsService.gs` y vistas asociadas en
`legacy/src/views/index.html`.

La capacidad actual consolida KPIs de cuentas, saldos, productos, plásticos,
consumos, histórico de aperturas, cohortes First 30 y exportables CSV a partir
de hojas y fuentes conectadas desde Google Apps Script. La lógica cruza datos de
clientes, transacciones, tarjetas, metas de ahorro y tarjeta de crédito usando
lecturas directas de hojas, utilidades del runtime legado y exportación vía
Drive.

El comportamiento está probado operativamente, pero hoy depende de fuentes
tabulares no institucionales, nombres de columnas variables, cálculos
acoplados al runtime de Apps Script y mecanismos de exportación/documentación no
alineados aún con Oracle ni con la plataforma Java institucional.

### Estado objetivo

La capacidad objetivo debe exponer el Resumen de Clientes como un slice
institucional del backend Java 8 ya fundado, compatible con despliegue en
WebSphere 9 y empaquetado `.ear`, manteniendo en una primera etapa contratos de
lectura y exportación equivalentes al legado.

El slice debe permitir consultar un resumen ejecutivo de cuentas y productos,
consultar histórico y cohortes First 30, y obtener resumen de plásticos y
exportables controlados, tanto en modalidad `local-mock` como en convivencia
temporal con datos del legado y con evolución explícita hacia Oracle como
persistencia formal.

### Restricciones institucionales

- La solución DEBE ser compatible con Java 8 y reusar la foundation multi-module.
- La persistencia objetivo DEBE converger a Oracle, aunque el primer corte pueda
  convivir temporalmente con lecturas legadas controladas.
- El despliegue institucional DEBE seguir siendo compatible con WebSphere 9 y
  empaquetado `.ear`.
- La funcionalidad DEBE respetar separación explícita de ambientes DEV, QA y PROD.
- La autenticación DEBE apoyarse en el contexto desacoplado definido en la
  foundation y no introducir nuevas sesiones locales permanentes.
- La observabilidad DEBE dejar trazas auditables por consulta y exportación.
- Los secretos y parámetros sensibles DEBEN seguir el contrato vigente de
  proveedores locales/CyberArk sin hardcodeo.

### Estrategia de transicion

La migración se realizará por capacidades de lectura primero. Este slice
institucional cubrirá inicialmente consultas y exportables del dominio de
Resumen de Clientes sin sustituir aún escrituras críticas ni automatizaciones
legadas fuera de alcance.

La primera etapa convivirá con el legado mediante adaptadores read-only sobre
las fuentes actuales cuando Oracle aún no disponga de proyecciones equivalentes.
Cada dependencia temporal deberá documentar origen, riesgo, criterio de salida y
rollback.

El criterio de corte para considerar migrado este slice será contar con
contratos institucionales verificables para resumen ejecutivo, histórico/First
30 y plásticos/exportables, con validación local en `local-mock`, evidencia de
auditoría y compatibilidad operativa para evolucionar luego a Oracle sin romper
el consumo funcional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resumen Ejecutivo de Clientes (Priority: P1)

Como responsable de negocio y operación, necesito consultar un resumen
ejecutivo de cuentas y productos para entender rápidamente el estado del
portafolio sin depender de la vista legacy.

**Why this priority**: Es la capacidad de lectura más directa y la base mínima
para empezar a mover el dominio `Accounts` a la plataforma institucional.

**Independent Test**: Puede validarse de forma independiente consultando un
endpoint que devuelva KPIs, resumen ejecutivo, productos y distribución básica
con datos mockeados o puente legacy read-only.

**Acceptance Scenarios**:

1. **Given** que existe una fuente válida de cuentas para el ambiente activo,
   **When** el usuario consulta el resumen ejecutivo, **Then** obtiene KPIs de
   cuentas, saldos y productos con contrato estable y trazabilidad básica.
2. **Given** que la modalidad `local-mock` está activa, **When** el usuario
   consulta el resumen ejecutivo, **Then** recibe datos consistentes con el
   contrato del slice sin requerir Oracle.

---

### User Story 2 - Histórico y Cohortes First 30 (Priority: P2)

Como analista del portafolio, necesito revisar el histórico de aperturas y las
cohortes First 30 para evaluar comportamiento de activación y tendencia mensual.

**Why this priority**: Esta vista aporta lectura analítica del mismo dominio y
permite migrar reglas temporales relevantes del legado sin depender aún de
procesos más complejos.

**Independent Test**: Puede validarse consultando un endpoint histórico con
filtros por periodo y un endpoint de cohortes First 30 que devuelvan series y
resúmenes mensuales equivalentes.

**Acceptance Scenarios**:

1. **Given** que existen fechas de apertura válidas en la fuente operativa,
   **When** el usuario solicita histórico por rango de fechas, **Then** obtiene
   series, resumen mensual y metadatos del periodo solicitado.
2. **Given** que existen cuentas abiertas dentro del universo First 30,
   **When** el usuario solicita la cohorte, **Then** recibe resumen total y
   mensual con reglas homogéneas para validación local e institucional.

---

### User Story 3 - Plásticos, Consumos y Exportables (Priority: P3)

Como usuario operativo, necesito consultar la cobertura de plásticos y generar
exportables controlados del slice para análisis downstream sin usar directamente
las descargas del legado.

**Why this priority**: Completa el valor operativo del dominio y deja el slice
listo para convivencia real con usuarios de negocio.

**Independent Test**: Puede validarse consultando el resumen de cobertura y
ejecutando exportaciones controladas con respuesta auditable y contenido
coherente con el filtro solicitado.

**Acceptance Scenarios**:

1. **Given** que existe información de tarjetas y consumos recientes,
   **When** el usuario consulta la vista de cobertura, **Then** recibe
   segmentación de clientes con y sin tarjeta junto con señal mínima de uso.
2. **Given** que el usuario solicita un exportable permitido del slice,
   **When** la plataforma procesa la solicitud, **Then** responde con evidencia
   de resultado y contenido descargable sin habilitar escrituras sobre el
   legado.

### Edge Cases

- ¿Qué ocurre si una columna esperada del legado cambia de nombre o no existe en
  una fuente temporal?
- ¿Cómo responde el slice si un periodo histórico no contiene cuentas o no hay
  cohortes First 30 para el rango solicitado?
- ¿Cómo se preserva el contrato si Oracle aún no dispone de la proyección
  equivalente y solo existe bridge read-only al legado?
- ¿Cómo se evita exponer exportaciones demasiado grandes o sin filtros mínimos
  cuando el origen todavía es transitorio?
- ¿Qué sucede si la fuente de tarjetas existe pero no tiene actividad reciente
  correlacionable para algunos clientes?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST documentar el comportamiento vigente del dominio
  Resumen de Clientes a partir de evidencia en `legacy/`, incluyendo resumen
  ejecutivo, histórico, First 30, plásticos y exportables.
- **FR-002**: El sistema MUST exponer un contrato institucional para el resumen
  ejecutivo del slice con KPIs, resumen por producto y metadatos de fuente.
- **FR-003**: El sistema MUST exponer un contrato institucional para el
  histórico de cuentas con filtros por periodo y resumen mensual.
- **FR-004**: El sistema MUST exponer un contrato institucional para cohortes
  First 30 con resumen total y resumen mensual.
- **FR-005**: El sistema MUST exponer un contrato institucional para cobertura
  de plásticos y consumos recientes del slice.
- **FR-006**: El sistema MUST permitir exportables controlados del slice para
  histórico mensual, First 30 mensual y cobertura de plásticos.
- **FR-007**: El sistema MUST soportar validación local en `local-mock` con
  datasets equivalentes para el dominio.
- **FR-008**: El sistema MUST definir coexistencia temporal con el legado
  mediante adaptadores read-only cuando Oracle aún no provea la vista objetivo.
- **FR-009**: El sistema MUST definir la transición de persistencia desde las
  fuentes actuales hacia Oracle para cada vista del slice.
- **FR-010**: El sistema MUST usar el contexto de acceso institucional definido
  por la foundation para autorizar consultas y exportables.
- **FR-011**: El sistema MUST generar logs y eventos de auditoría para
  consultas, filtros aplicados y exportaciones ejecutadas.
- **FR-012**: El sistema MUST preservar separación de ambientes DEV, QA y PROD
  en configuración, orígenes y evidencias del slice.
- **FR-013**: El sistema MUST definir rollback explícito al legado para
  cualquier validación fallida antes de promover el slice.
- **FR-014**: El sistema MUST excluir del alcance cualquier escritura directa
  sobre hojas, Drive o procesos de Apps Script para este slice.

### Key Entities *(include if feature involves data)*

- **Customer Account Summary**: Vista consolidada de cuentas, saldos, estados y
  productos activos del cliente.
- **Product Summary**: Agregado por producto con cuentas, saldo y participación
  dentro del portafolio observado.
- **Historical Opening Series**: Serie temporal y resumen mensual de aperturas
  del dominio de cuentas.
- **First30 Cohort**: Cohorte de cuentas abiertas en un periodo con indicadores
  de activación y uso transaccional temprano.
- **Card Coverage Snapshot**: Resumen de clientes con tarjeta física, digital,
  cobertura y señal de uso reciente.
- **Accounts Export Request**: Solicitud controlada de exportación del slice con
  tipo de exportable, filtros, actor y evidencia de ejecución.
- **Accounts Data Source**: Origen operativo temporal o institucional usado para
  construir la respuesta del slice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El equipo puede consultar el resumen ejecutivo del slice en menos
  de 2 minutos tras levantar el entorno local documentado.
- **SC-002**: El 100% de los contratos del slice pueden validarse en `local-mock`
  sin depender de Oracle ni del runtime Apps Script.
- **SC-003**: Las consultas principales del slice devuelven resultados o una
  degradación controlada en menos de 5 segundos durante validaciones locales.
- **SC-004**: El 100% de las exportaciones del slice dejan evidencia auditable
  de actor, ambiente, filtro y resultado.
- **SC-005**: Antes de promover el slice, existe un inventario completo de
  dependencias temporales del dominio y su criterio de retiro hacia Oracle.

## Assumptions

- El dominio funcional `Accounts` del legado representa la base correcta para el
  slice Resumen de Clientes en esta iteración.
- La primera entrega del slice se concentrará en lectura y exportación, no en
  escrituras operativas.
- Oracle puede no tener aún todas las proyecciones listas, por lo que se
  permitirán puentes read-only temporales mientras estén documentados.
- Los datasets mockeados del slice deberán aproximar KPIs, históricos, First 30
  y cobertura de plásticos con suficiente fidelidad para pruebas locales.
- Las exportaciones pueden entregarse inicialmente como contenido descargable o
  payload serializado, sin requerir una integración documental institucional en
  esta iteración.
