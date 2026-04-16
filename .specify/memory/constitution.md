<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder Principle 1 -> I. Negocio Primero; Legado como Evidencia
- Placeholder Principle 2 -> II. Migracion Incremental por Dominios
- Placeholder Principle 3 -> III. Compatibilidad Institucional desde el Diseno
- Placeholder Principle 4 -> IV. Seguridad, Configuracion y Automatizacion por Ambiente
- Placeholder Principle 5 -> V. Trazabilidad, Observabilidad y Operacion Auditables
Added sections:
- Reglas para Especificaciones y Decisiones de Arquitectura
- Calidad Minima, Riesgos y Evolucion
Removed sections:
- Ninguna
Templates requiring updates:
- ✅ updated .specify/templates/spec-template.md
- ✅ updated .specify/templates/plan-template.md
- ✅ updated .specify/templates/tasks-template.md
- ✅ reviewed README.md (sin cambios requeridos)
- ✅ `.specify/templates/commands/*.md` no existe en este repositorio; no aplica
Follow-up TODOs:
- Ninguno
-->

# Constitucion de Billu Enterprise

## Principios Rectores

### I. Negocio Primero; Legado como Evidencia
- Toda especificacion DEBE describir la capacidad de negocio, reglas, datos,
  actores, eventos y decisiones operativas de forma independiente a la
  implementacion legada.
- El legado DEBE tratarse como evidencia para descubrir comportamiento,
  dependencias, riesgos y datos; NO DEBE asumirse como el diseno objetivo ni
  como restriccion por defecto.
- Ningun modulo nuevo o migrado DEBE copiar sin evaluacion previa estructuras,
  nombres, formatos o limites del legado si estos impiden la arquitectura
  institucional objetivo.
- Toda decision que mantenga una dependencia temporal con Google Apps Script,
  Google Sheets, Google Drive, Google Docs, Script Properties o `.env` DEBE
  documentar motivo, impacto, plazo de retiro y criterio de salida.

Razonamiento: Billu necesita preservar el valor del negocio sin arrastrar al
estado objetivo dependencias accidentales del entorno actual.

### II. Migracion Incremental por Dominios
- La migracion DEBE ejecutarse por dominios o capacidades de negocio
  delimitadas, con entregables pequenos, verificables y reversibles.
- Toda especificacion, plan y conjunto de tareas DEBE distinguir
  explicitamente estado actual, estado objetivo, restricciones y estrategia de
  transicion.
- Ninguna especificacion futura se considerara completa si no define esos
  cuatro elementos y su criterio de validacion.
- Cada incremento DEBE establecer impacto operativo, estrategia de convivencia
  temporal, plan de rollback y evidencia de trazabilidad funcional y tecnica.

Razonamiento: La migracion controlada reduce riesgo operacional, facilita la
auditoria y evita programas de reemplazo monoliticos y opacos.

### III. Compatibilidad Institucional desde el Diseno
- La solucion objetivo DEBE diseniarse desde el inicio para ser compatible con
  Java 8, Oracle, WebSphere Application Server y empaquetado `.ear`, incluso
  cuando una fase intermedia utilice adaptadores temporales.
- Todo componente nuevo DEBE preferir contratos, modelos y decisiones
  tecnicas que puedan desplegarse posteriormente en WebSphere sin redisenos
  estructurales.
- El entorno local en Mac DEBE permitir desarrollar y validar los mismos
  contratos, configuraciones por ambiente, empaquetado, integraciones y
  supuestos operativos del modelo institucional final.
- Se permite infraestructura local sustituta solo si mantiene paridad
  suficiente para detectar desviaciones antes del despliegue institucional.

Razonamiento: Diseniar para el destino institucional desde el primer dia evita
doble trabajo y reduce el costo de convergencia.

### IV. Seguridad, Configuracion y Automatizacion por Ambiente
- La separacion de ambientes DEV, QA y PROD DEBE ser explicita en
  configuracion, datos, credenciales, despliegues y evidencias de validacion.
- Los secretos NO DEBEN depender de valores hardcodeados, hojas, documentos ni
  repositorios; toda transicion DEBE converger a un secret manager
  corporativo.
- La autenticacion y autorizacion DEBEN modelarse con compatibilidad futura
  hacia Azure Entra ID, incluso si existen roles basicos y sesiones locales en
  fases tempranas.
- Los jobs y automatizaciones DEBEN migrarse a mecanismos calendarizables y
  operables en Java; cualquier uso temporal de triggers de Apps Script DEBE
  documentar monitoreo, riesgo y plan de retiro.

Razonamiento: La seguridad institucional depende de controles repetibles,
aislados por ambiente y sostenibles fuera del legado.

### V. Trazabilidad, Observabilidad y Operacion Auditables
- Toda capacidad migrada DEBE producir logs y eventos auditables con contexto
  funcional, tecnico y de ambiente suficientes para su operacion y
  seguimiento.
- La arquitectura objetivo DEBE centralizar logs y auditoria en Elastic o en
  componentes compatibles con esa estrategia.
- Persistencia, integraciones, jobs y autenticacion DEBEN tener puntos de
  observacion definidos, alertas operativas y evidencia de correlacion entre
  solicitud, cambio de estado y resultado.
- Ningun incremento se considera listo si no permite diagnosticar fallas,
  rastrear decisiones y reconstruir eventos relevantes sin depender de
  conocimiento tribal.

Razonamiento: La migracion institucional solo es segura si cada cambio puede
ser operado, auditado y explicado con evidencia verificable.

## Reglas para Especificaciones y Decisiones de Arquitectura

### Reglas para redactar especificaciones
- Toda especificacion DEBE incluir las secciones `Estado actual`, `Estado
  objetivo`, `Restricciones institucionales` y `Estrategia de transicion`.
- `Estado actual` DEBE describir el comportamiento operativo real, origen de
  datos, dependencias, controles, limitaciones y riesgos observados.
- `Estado objetivo` DEBE describir el resultado esperado en terminos de
  capacidad de negocio, arquitectura institucional, operabilidad y seguridad.
- `Restricciones institucionales` DEBE capturar compatibilidad con Java 8,
  Oracle, WebSphere, `.ear`, ambientes, autenticacion objetivo, gestion de
  secretos, observabilidad y requisitos de auditoria.
- `Estrategia de transicion` DEBE definir incrementos, convivencias temporales,
  migraciones de datos, criterios de corte, rollback y evidencias de
  validacion.

### Reglas para decisiones tecnicas y de arquitectura
- Toda decision tecnica DEBE favorecer el estado objetivo institucional por
  encima de la comodidad del legado.
- Las dependencias temporales con el legado SOLO se permiten mediante puentes o
  adaptadores explicitamente delimitados y con criterio de retiro.
- Las decisiones de persistencia DEBEN asumir Oracle como destino formal; el
  uso actual de Google Sheets solo puede mantenerse como fuente transitoria,
  respaldo operacional o evidencia historica.
- La configuracion DEBE externalizarse por ambiente y desacoplarse del codigo
  y de mecanismos propietarios del legado.
- La autenticacion DEBE preservar compatibilidad con el modelo futuro de Azure
  Entra ID y evitar introducir nuevas dependencias a sesiones locales no
  federables.
- Los jobs DEBEN poder ejecutarse, calendarizarse y monitorearse fuera de Apps
  Script.
- La observabilidad DEBE definirse como parte de la solucion y no como una
  mejora posterior.

### Reglas para separar capacidad de negocio de implementacion legada
- Los nombres de modulos, APIs, entidades y procesos DEBEN representar el
  dominio del negocio y no la herramienta donde hoy residen.
- Las reglas de negocio descubiertas en hojas, scripts o documentos DEBEN
  convertirse en contratos, modelos o politicas explicitas antes de migrarse.
- Los flujos manuales o semiautomaticos del legado DEBEN clasificarse como
  comportamiento temporal, deuda o requerimiento operativo con fecha de
  resolucion.

### Reglas de compatibilidad entre entorno local y despliegue institucional
- Toda guia de desarrollo local DEBE explicar como validar en Mac sin desviarse
  del modelo de empaquetado, configuracion y despliegue institucional.
- Las diferencias inevitables entre desarrollo local y WebSphere DEBEN quedar
  documentadas junto con su mecanismo de compensacion y su riesgo.
- Ninguna solucion local se aprobara si impide probar contratos, datos,
  configuracion por ambiente, autenticacion, jobs u observabilidad conforme al
  modelo objetivo.

## Calidad Minima, Riesgos y Evolucion

### Reglas de persistencia, configuracion, autenticacion, jobs y observabilidad
- Persistencia: todo cambio DEBE definir modelo transitorio, modelo objetivo,
  integridad de datos, estrategia de migracion y controles para converger a
  Oracle.
- Configuracion y secretos: toda capacidad DEBE declarar variables por
  ambiente, origen de secretos, rotacion esperada y plan de migracion a
  secret manager corporativo.
- Autenticacion y autorizacion: toda capacidad DEBE definir actores, permisos,
  sesiones, integracion futura con Azure Entra ID y riesgos de coexistencia.
- Jobs y automatizaciones: toda automatizacion DEBE definir disparador,
  calendario, dependencias, idempotencia, monitoreo y plan de reemplazo si hoy
  vive en Apps Script.
- Observabilidad y auditoria: toda capacidad DEBE definir eventos, logs,
  metricas, identificadores de correlacion, alertas y retencion operativa.

### Criterios minimos de calidad
- Una especificacion NO esta completa si carece de estado actual, estado
  objetivo, restricciones institucionales o estrategia de transicion.
- Un plan NO pasa Constitucion Check si no demuestra compatibilidad con
  Java 8, Oracle, WebSphere, `.ear`, separacion de ambientes y operabilidad
  auditable.
- Un incremento NO esta listo para implementarse si no incluye evidencia de
  trazabilidad desde requerimiento hasta tareas y validacion.
- Un entregable NO esta listo para liberar si no cuenta con validacion funcional,
  manejo de errores, configuracion por ambiente, seguridad basica, estrategia
  de observabilidad y documentacion operativa minima.

### Manejo de riesgos e incertidumbre
- Toda incertidumbre material DEBE registrarse como supuesto, riesgo, decision
  pendiente o spike acotado con fecha de resolucion.
- Ninguna restriccion del legado DEBE aceptarse como permanente sin evidencia
  tecnica y aprobacion explicita.
- Los riesgos de datos, seguridad, despliegue, compatibilidad institucional y
  continuidad operativa DEBEN revisarse en cada plan y en cada corte de
  migracion.

### Regla de evolucion de la constitucion
- Esta constitucion prevalece sobre practicas locales, plantillas y decisiones
  ad hoc cuando exista conflicto.
- Toda enmienda DEBE registrar justificacion, impacto esperado, artefactos
  afectados y plan de adopcion.
- Los cambios de gobernanza se versionaran con semantica:
  `MAJOR` para redefiniciones incompatibles, `MINOR` para principios o reglas
  nuevas y `PATCH` para aclaraciones sin cambio normativo.
- Toda nueva especificacion, plan y conjunto de tareas DEBE revisarse contra
  esta constitucion como criterio de cumplimiento obligatorio.

## Gobernanza

- Esta constitucion entra en vigor para todo trabajo futuro del proyecto Billu
  Enterprise a partir de su ratificacion.
- Toda propuesta de especificacion, plan o tareas DEBE incluir una verificacion
  explicita de cumplimiento constitucional.
- Los revisores DEBEN rechazar artefactos incompletos o incompatibles con los
  principios aqui definidos.
- Las excepciones temporales SOLO pueden aprobarse si documentan motivo,
  alcance, plazo, responsable, riesgo aceptado y criterio de retiro.
- La revision de cumplimiento DEBE ocurrir como minimo al crear o actualizar
  especificaciones, al cerrar planes y antes de aprobar incrementos relevantes.
- Las enmiendas requieren acuerdo explicito de los responsables del proyecto,
  actualizacion sincronizada de plantillas afectadas y evidencia de comunicacion
  del cambio.

**Version**: 1.0.0 | **Ratified**: 2026-04-16 | **Last Amended**: 2026-04-16
