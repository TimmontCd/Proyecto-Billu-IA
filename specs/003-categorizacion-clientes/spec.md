# Feature Specification: Categorizacion de Clientes

**Feature Branch**: `003-categorizacion-clientes`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Abrir el siguiente slice funcional posterior a Resumen de Clientes: Categorizacion de Clientes."

## Migration Context *(mandatory)*

### Estado actual

El slice vigente de Categorizacion de Clientes vive en el legado bajo
`legacy/src/controllers/CustomerCategorizationController.gs`,
`legacy/src/services/CustomerCategorizationService.gs` y vistas asociadas del
modulo `customer-categorization` en `legacy/src/views/index.html`.

La capacidad actual segmenta clientes activos usando saldo promedio de 3 meses,
transacciones y antiguedad, y entrega:

- dashboard de segmentos
- KPIs ejecutivos
- export por segmento
- export de oportunidad de venta cruzada
- consulta por `ID RECOMPENSAS`

El comportamiento hoy depende de Google Apps Script, hojas fuente, reglas
acopladas al runtime legado y exportacion CSV generada fuera de la plataforma
institucional Java.

### Estado objetivo

La capacidad objetivo debe exponer Categorizacion de Clientes como un slice
institucional del backend Java 8 fundado, compatible con despliegue en
WebSphere 9 y empaquetado `.ear`, manteniendo en una primera etapa contratos de
lectura y exportacion equivalentes al legado.

El slice debe permitir consultar un dashboard ejecutivo de segmentacion,
consultar detalle o busqueda por `ID RECOMPENSAS`, y generar exportables
controlados de segmento y venta cruzada, tanto en `local-mock` como en
coexistencia temporal con bridge legado read-only y evolucion explicita hacia
Oracle.

### Restricciones institucionales

- La solucion DEBE ser compatible con Java 8 y reusar la foundation multi-module.
- La persistencia objetivo DEBE converger a Oracle, aunque el primer corte pueda
  convivir temporalmente con lecturas legadas controladas.
- El despliegue institucional DEBE seguir siendo compatible con WebSphere 9 y
  empaquetado `.ear`.
- La funcionalidad DEBE respetar separacion explicita de ambientes DEV, QA y PROD.
- La autenticacion DEBE apoyarse en el contexto desacoplado definido en la
  foundation y no introducir nuevas sesiones locales permanentes.
- La observabilidad DEBE dejar trazas auditables por consulta, busqueda y exportacion.
- Los secretos y parametros sensibles DEBEN seguir el contrato vigente de
  proveedores locales/CyberArk sin hardcodeo.

### Estrategia de transicion

La migracion se realizara por capacidades de lectura y exportacion primero.
Este slice institucional cubrira inicialmente dashboard, consulta detallada y
exportables de segmentacion sin sustituir aun escrituras o procesos legados
fuera de alcance.

La primera etapa convivira con el legado mediante adaptadores read-only sobre
las fuentes actuales cuando Oracle aun no disponga de proyecciones equivalentes.
Cada dependencia temporal debera documentar origen, riesgo, criterio de salida y
rollback.

El criterio de corte para considerar migrado este slice sera contar con
contratos institucionales verificables para dashboard de segmentacion, busqueda
por `ID RECOMPENSAS` y exportables, con validacion local en `local-mock`,
evidencia de auditoria y compatibilidad operativa para evolucionar luego a
Oracle sin romper el consumo funcional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard Ejecutivo de Segmentacion (Priority: P1)

Como responsable de negocio, necesito consultar un dashboard ejecutivo de
segmentacion para entender la distribucion de clientes, su saldo y las
oportunidades comerciales sin depender de la UI legacy.

**Why this priority**: Es la capacidad mas visible del slice y la base minima
para mover el dominio de segmentacion a la plataforma institucional.

**Independent Test**: Puede validarse consultando un endpoint que devuelva
KPIs, resumen ejecutivo y resumen por segmento con datos mockeados o bridge
legacy read-only.

**Acceptance Scenarios**:

1. **Given** que existe una fuente valida de clientes activos para el ambiente
   activo, **When** el usuario consulta el dashboard, **Then** obtiene KPIs,
   resumen ejecutivo y segmentos con contrato estable y trazabilidad basica.
2. **Given** que la modalidad `local-mock` esta activa, **When** el usuario
   consulta el dashboard, **Then** recibe datos consistentes con el contrato del
   slice sin requerir Oracle.

---

### User Story 2 - Consulta por ID Recompensas (Priority: P2)

Como usuario operativo, necesito consultar un `ID RECOMPENSAS` para ver su
nivel, tarjeta sugerida, productos activos y oportunidades sin depender del
legado.

**Why this priority**: Da valor operativo directo y permite validar reglas del
modelo sobre casos individuales.

**Independent Test**: Puede validarse con un endpoint de busqueda que devuelva
detalle del cliente y su clasificacion para un `ID RECOMPENSAS`.

**Acceptance Scenarios**:

1. **Given** que existe informacion para un `ID RECOMPENSAS` valido, **When**
   el usuario realiza la busqueda, **Then** obtiene el detalle clasificado con
   contrato estable y evidencia de consulta.
2. **Given** que el `ID RECOMPENSAS` no existe, **When** el usuario consulta,
   **Then** recibe una respuesta controlada sin romper el contrato institucional.

---

### User Story 3 - Exportables de Segmento y Venta Cruzada (Priority: P3)

Como usuario comercial, necesito generar exportables de segmentos y venta
cruzada para activar campanas sin usar las descargas del legado.

**Why this priority**: Completa el valor operativo del slice y permite usar la
segmentacion institucional en procesos downstream.

**Independent Test**: Puede validarse ejecutando exportaciones controladas con
respuesta auditable y metadata consistente con el segmento solicitado.

**Acceptance Scenarios**:

1. **Given** que existe informacion para un segmento soportado, **When** el
   usuario solicita el exportable del segmento, **Then** recibe metadata de
   resultado y contenido coherente con el filtro aplicado.
2. **Given** que existe oportunidad comercial por productos faltantes, **When**
   el usuario solicita export de venta cruzada, **Then** obtiene un resultado
   auditable alineado al nivel del segmento y a la recomendacion comercial.

### Edge Cases

- Que ocurre si cambian los nombres de columnas o faltan datos de transacciones
  en una fuente temporal del legado.
- Como responde el slice si un segmento no tiene clientes o un segmento pedido
  no esta soportado.
- Como se preserva el contrato si Oracle aun no dispone de la proyeccion
  equivalente y solo existe bridge read-only al legado.
- Como se controla la busqueda cuando el `ID RECOMPENSAS` existe multiples veces
  en la fuente temporal.
- Que sucede si un cliente no tiene saldo promedio util o no tiene productos
  suficientes para una recomendacion clara de venta cruzada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST documentar el comportamiento vigente del dominio
  Categorizacion de Clientes a partir de evidencia en `legacy/`, incluyendo
  dashboard, niveles, exportables y consulta por `ID RECOMPENSAS`.
- **FR-002**: El sistema MUST exponer un contrato institucional para el
  dashboard ejecutivo del slice con KPIs, resumen ejecutivo y segmentos.
- **FR-003**: El sistema MUST exponer un contrato institucional para la
  consulta por `ID RECOMPENSAS`.
- **FR-004**: El sistema MUST exponer exportables controlados para segmento y
  venta cruzada.
- **FR-005**: El sistema MUST soportar validacion local en `local-mock` con
  datasets equivalentes para el dominio.
- **FR-006**: El sistema MUST definir coexistencia temporal con el legado
  mediante adaptadores read-only cuando Oracle aun no provea la vista objetivo.
- **FR-007**: El sistema MUST definir la transicion de persistencia desde las
  fuentes actuales hacia Oracle para dashboard, detalle y exportables.
- **FR-008**: El sistema MUST usar el contexto de acceso institucional definido
  por la foundation para autorizar consultas y exportables.
- **FR-009**: El sistema MUST generar logs y eventos de auditoria para
  consultas, filtros, busquedas y exportaciones ejecutadas.
- **FR-010**: El sistema MUST preservar separacion de ambientes DEV, QA y PROD
  en configuracion, origenes y evidencias del slice.
- **FR-011**: El sistema MUST definir rollback explicito al legado para
  cualquier validacion fallida antes de promover el slice.
- **FR-012**: El sistema MUST excluir del alcance cualquier escritura directa
  sobre hojas, Drive o procesos Apps Script para este slice.

### Key Entities *(include if feature involves data)*

- **Customer Categorization Dashboard**: Vista consolidada de KPIs, resumen y
  distribucion por nivel del cliente.
- **Customer Segment Summary**: Agregado por segmento con clientes, saldo,
  share y metricas comerciales.
- **Customer Segment Rule**: Regla de clasificacion institucional derivada del
  legado para `Exploradores`, `Constructores` y `Aliados Premium`.
- **Rewards Lookup Result**: Resultado detallado de una consulta por
  `ID RECOMPENSAS`.
- **Customer Segment Export Request**: Solicitud controlada de exportacion por
  segmento con filtros, actor y evidencia de ejecucion.
- **Customer CrossSell Export**: Exportable comercial con productos faltantes,
  tarjeta recomendada y campana sugerida.
- **Customer Categorization Data Source**: Origen operativo temporal o
  institucional usado para construir la respuesta del slice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El equipo puede consultar el dashboard del slice en menos de
  2 minutos tras levantar el entorno local documentado.
- **SC-002**: El 100% de los contratos del slice pueden validarse en
  `local-mock` sin depender de Oracle ni del runtime Apps Script.
- **SC-003**: Las consultas principales del slice devuelven resultados o una
  degradacion controlada en menos de 5 segundos durante validaciones locales.
- **SC-004**: El 100% de las exportaciones del slice dejan evidencia auditable
  de actor, ambiente, filtro y resultado.
- **SC-005**: Antes de promover el slice, existe un inventario completo de
  dependencias temporales del dominio y su criterio de retiro hacia Oracle.

## Assumptions

- El dominio funcional `CustomerCategorization` del legado representa la base
  correcta para el siguiente slice institucional.
- La primera entrega del slice se concentrara en lectura y exportacion, no en
  escrituras operativas.
- Oracle puede no tener aun todas las proyecciones listas, por lo que se
  permitiran puentes read-only temporales mientras esten documentados.
- Los datasets mockeados del slice deberan aproximar dashboard, detalle y
  exportables con suficiente fidelidad para pruebas locales.
- Las exportaciones pueden entregarse inicialmente como contenido descargable o
  payload serializado, sin requerir aun una integracion documental externa.
