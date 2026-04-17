# Feature Specification: Fundacion Backend Institucional

**Feature Branch**: `001-backend-foundation`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "Primera especificacion para la fundacion tecnica inicial de la migracion del backend principal de Billu desde `legacy/` hacia una arquitectura institucional, excluyendo WhatsApp en este ciclo."

## Migration Context *(mandatory)*

### Estado actual

El backend principal vigente opera sobre Google Apps Script y JavaScript, con una
superficie funcional concentrada en controladores, servicios, componentes core
y un repositorio generico sobre hojas de calculo. La evidencia principal se
encuentra en `legacy/src/` y `legacy/dist/`.

La implementacion actual expone un web app con `doGet` y `doPost`, ademas de
funciones de mantenimiento y ejecucion manual. Esa superficie mezcla
capacidades de operacion, administracion y automatizacion dentro del mismo
entorno de ejecucion.

La persistencia actual depende principalmente de Google Sheets. El repositorio
base abre hojas por identificador, garantiza encabezados y opera entidades como
usuarios, roles, proyectos, tareas, documentos, datasets, historicos, alertas y
auditoria. El esquema funcional del negocio ya existe, pero hoy esta modelado
como estructura tabular operativa, no como persistencia institucional formal.

La gestion documental y de archivos depende de Google Drive y Google Docs. El
bootstrap crea carpetas, plantillas y documentos de trabajo; varios procesos
generan o mueven archivos en Drive y usan IDs configurados manualmente.

La configuracion y los secretos dependen de Script Properties con numerosos
identificadores, tokens, correos, banderas de funcionalidad y referencias a
hojas, carpetas o integraciones. Tambien existen valores por defecto y
referencias fijas que sugieren una operacion dominante en un solo ambiente.

La autenticacion actual es local al legado: usuarios y roles residen en hojas,
las contrasenas se controlan con hash y salt propios, las sesiones se almacenan
en cache del script y el acceso se apoya en dominios o correos permitidos. Este
modelo sirve para operar hoy, pero no constituye una base institucional ni una
federacion desacoplada.

Los jobs y automatizaciones dependen de triggers y funciones ejecutables de Apps
Script. Existen procesos programables para monitoreo, sincronizaciones, alertas,
recordatorios y cargas operativas, pero su ejecucion, observabilidad y control
estan atados al runtime legado.

Los logs y la auditoria estan fragmentados. Parte de la evidencia se escribe en
hojas de auditoria y parte en logs del runtime; esto dificulta correlacion,
soporte, monitoreo y reconstruccion operativa centralizada.

El legado tambien contiene capacidades relacionadas con WhatsApp, tanto en
servicios como en controladores y webhooks. Esas piezas son evidencia del
estado actual, pero quedan expresamente fuera del alcance de esta primera
iteracion y no deben condicionar la plataforma objetivo del ciclo.

### Estado objetivo

La primera iteracion debe definir una plataforma base institucional para el
backend principal de Billu, apta para iniciar la migracion por capacidades de
negocio sin arrastrar dependencias estructurales del entorno legado.

Esa plataforma objetivo debe permitir que el backend se ejecute localmente en
Mac para desarrollo y validacion, incluyendo una modalidad con datos mockeados
que permita probar flujos base sin depender de integraciones institucionales
disponibles. El mismo artefacto de despliegue debe poder evolucionar hacia
ejecucion institucional posterior en WebSphere Application Server 9.

La fundacion del ciclo debe establecer una base compatible con Java 8,
persistencia formal en Oracle, empaquetado final en formato `.ear`, control por
ambientes, logging estructurado, autenticacion desacoplada y ejecucion de jobs
calendarizables fuera de Apps Script.

El objetivo de esta iteracion no es replicar modulo por modulo el legado ni
migrar todo el dominio funcional existente. El objetivo es dejar lista la
plataforma inicial y los contratos operativos minimos para que las siguientes
iteraciones migren capacidades del backend principal de forma incremental,
trazable y auditable.

### Restricciones institucionales

- La plataforma inicial DEBE ser compatible con Java 8.
- La persistencia objetivo DEBE considerar Oracle como destino formal de datos.
- El despliegue institucional DEBE ser compatible con WebSphere Application Server 9.
- El empaquetado objetivo DEBE contemplar formato `.ear`.
- La solucion DEBE separar configuracion y comportamiento por ambiente para DEV,
  QA y PROD.
- La configuracion sensible NO DEBE quedar acoplada a hojas, documentos o
  propiedades legadas como mecanismo objetivo permanente.
- La autenticacion DEBE quedar preparada para integracion futura con Azure Entra
  ID sin introducir nuevas dependencias estructurales a sesiones locales.
- Los logs y eventos de auditoria DEBEN poder centralizarse posteriormente en
  Elastic.
- El modelo de jobs DEBE ejecutarse fuera de triggers de Apps Script como
  mecanismo objetivo.
- La definicion operativa inicial de jobs DEBE poder mantenerse localmente en un
  archivo JSON controlado por versionamiento durante la primera iteracion.
- La solucion local en Mac DEBE validar los mismos supuestos funcionales y
  operativos que el despliegue institucional.
- La solucion local DEBE poder operar tambien con datos mockeados para pruebas
  tempranas, desarrollo y validacion desacoplada de dependencias institucionales.
- La gestion objetivo de secretos DEBE converger a CyberArk, pero la fundacion
  inicial DEBE poder operar sin esa integracion activa mientras preserva un
  contrato compatible con el SDK mas actualizado disponible al momento de
  implementacion.

### Estrategia de transicion

La transicion se realizara por incrementos. Esta primera especificacion define
la fundacion de plataforma y no la migracion completa de todos los dominios del
backend principal.

Durante esta iteracion, el legado seguira operando como sistema vigente para las
capacidades no migradas. `legacy/` se utilizara como fuente de evidencia para
descubrir reglas, dependencias, datos y procesos actuales, pero no como base de
implementacion destino.

La coexistencia temporal debe separar tres capas:

1. La capacidad de negocio actual que hoy resuelve el legado.
2. La plataforma institucional inicial que habilita la migracion.
3. Los puentes temporales necesarios para convivir sin interrumpir la operacion.

La primera iteracion debe producir un inventario priorizado de dependencias
legadas del backend principal, clasificar cuales se mantienen temporalmente como
fuente externa, cuales se reemplazan desde el inicio y cuales requieren
adaptadores transitorios.

Las integraciones con Google Sheets, Google Drive, Google Docs, Script
Properties y triggers de Apps Script solo podran mantenerse como mecanismos
temporales de coexistencia cuando exista una justificacion explicita, evidencia
de riesgo y criterio de retiro.

El criterio de corte para comenzar a migrar capacidades de negocio en iteraciones
posteriores sera contar con una plataforma inicial validada localmente y en un
despliegue institucional candidato, con configuracion por ambiente, acceso a la
persistencia objetivo, logging y auditoria basicos, autenticacion desacoplada y
modelo de jobs calendarizables. La validacion local debe poder ejecutarse tanto
contra dependencias reales controladas como con datos mockeados cuando la
integracion institucional aun no este disponible.

Una vez validada la fundacion, el primer slice funcional a migrar sera Resumen
de Clientes y el segundo slice sera Categorizacion de Clientes, en ese orden de
prioridad.

El rollback de esta iteracion consiste en mantener la operacion funcional en el
legado sin sustituir procesamiento critico hasta que la plataforma base cumpla
sus criterios de aceptacion. Ninguna capacidad en produccion debe depender
exclusivamente de la nueva plataforma antes de esa validacion.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plataforma Base Validable (Priority: P1)

Como lider tecnico de la migracion, necesito una plataforma backend inicial que
pueda ejecutarse en local y quedar preparada para despliegue institucional,
incluyendo un modo con datos mockeados, para iniciar la migracion del backend
principal sin depender del runtime legado como base de implementacion ni de la
disponibilidad permanente de integraciones institucionales.

**Why this priority**: Sin una fundacion ejecutable y validable, cualquier
migracion posterior quedaria bloqueada o seguiria reproduciendo dependencias del
legado.

**Independent Test**: Puede validarse de forma independiente cuando el equipo
levanta la plataforma en Mac, aplica configuracion por ambiente, verifica una
operacion representativa usando datos mockeados o dependencias controladas, y
genera evidencia operativa reutilizable para el siguiente ciclo.

**Acceptance Scenarios**:

1. **Given** que existe configuracion valida para el ambiente de desarrollo,
   **When** el equipo ejecuta la plataforma inicial en Mac, **Then** el backend
   inicia correctamente y expone evidencia de que esta listo para validar
   persistencia, autenticacion, logging y jobs.
2. **Given** que Oracle o integraciones institucionales no estan disponibles,
   **When** el equipo ejecuta la modalidad local con datos mockeados, **Then**
   puede validar los flujos base de la plataforma sin bloquear el desarrollo.
3. **Given** que se genera un artefacto candidato de despliegue, **When** este
   se somete a validacion institucional, **Then** se confirma que la plataforma
   mantiene compatibilidad con el modelo de despliegue objetivo del proyecto.

---

### User Story 2 - Coexistencia Controlada Con El Legado (Priority: P2)

Como responsable de continuidad operativa, necesito que la nueva plataforma
conviva temporalmente con el legado sin forzar un reemplazo total inmediato,
para iniciar la migracion sin interrumpir las capacidades actuales del backend
principal.

**Why this priority**: El sistema actual sigue soportando operacion activa y la
transicion debe proteger la continuidad del negocio mientras se migra por
incrementos.

**Independent Test**: Puede validarse de forma independiente cuando se
documentan y prueban los limites entre plataforma nueva y legado, incluyendo
dependencias temporales, criterios de corte y mecanismo de retroceso.

**Acceptance Scenarios**:

1. **Given** una capacidad del backend principal que aun no ha sido migrada,
   **When** el equipo revisa su ruta operativa, **Then** queda definido si esa
   capacidad sigue en el legado, si requiere adaptador temporal o si ya puede
   moverse a la nueva plataforma.
2. **Given** que una validacion de la nueva plataforma falla, **When** se activa
   el mecanismo de retroceso definido, **Then** la operacion permanece soportada
   por el legado sin perdida de continuidad.

---

### User Story 3 - Operacion Basica Auditada (Priority: P3)

Como responsable de seguridad y operacion, necesito que la plataforma inicial
deje definida una base desacoplada de autenticacion, logging estructurado y jobs
calendarizables, para que el backend migrado pueda operar con trazabilidad y
control desde el inicio.

**Why this priority**: La compatibilidad institucional exige que la migracion no
solo funcione, sino que tambien sea operable, auditable y gobernable.

**Independent Test**: Puede validarse de forma independiente cuando una
operacion representativa y un job calendarizable generan registros trazables,
usan configuracion del ambiente correcto y respetan el esquema de acceso base.

**Acceptance Scenarios**:

1. **Given** una solicitud autenticada a la plataforma inicial, **When** se
   ejecuta una operacion representativa, **Then** el sistema registra trazas y
   auditoria suficientes para seguimiento operativo.
2. **Given** un job calendarizable configurado para el ambiente de desarrollo,
   **When** se ejecuta manual o programadamente, **Then** su resultado queda
   registrado y puede correlacionarse con el contexto operativo correspondiente.

---

### Edge Cases

- Que ocurre si falta configuracion obligatoria para un ambiente o se intenta
  iniciar con valores cruzados entre DEV, QA y PROD?
- Como debe responder la plataforma si Oracle no esta disponible en el momento
  de la validacion o del arranque?
- Como se controla una dependencia legada que siga siendo necesaria
  temporalmente, pero cuya fuente cambie o deje de estar disponible?
- Como se preserva la consistencia funcional entre la ejecucion con datos
  mockeados y la ejecucion con dependencias reales?
- Como se evita que el archivo JSON local de schedulers se desalineé del modelo
  operativo que despues se promovera a ambientes institucionales?
- Como se evita que una automatizacion calendarizable se ejecute dos veces y
  genere resultados duplicados durante la coexistencia?
- Como se maneja una solicitud asociada a WhatsApp para que quede claramente
  rechazada o fuera de alcance en este ciclo?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST documentar el estado actual del backend principal
  legado a partir de evidencia de `legacy/`, incluyendo runtime, persistencia,
  autenticacion, configuracion, jobs, logging y auditoria.
- **FR-002**: El sistema MUST distinguir de forma explicita la capacidad de
  negocio actual del backend principal frente a la implementacion legada que hoy
  la soporta.
- **FR-003**: El sistema MUST definir el alcance funcional de este ciclo como la
  fundacion tecnica inicial del backend principal y sus capacidades base de
  plataforma.
- **FR-004**: El sistema MUST excluir explicitamente de este ciclo el dominio de
  WhatsApp, sus webhooks, automatizaciones y cualquier migracion funcional de
  ese modulo.
- **FR-005**: El sistema MUST definir una arquitectura objetivo para esta
  iteracion compatible con Java 8, Oracle, WebSphere Application Server 9 y
  empaquetado `.ear`.
- **FR-006**: El sistema MUST definir una estrategia de ejecucion local en Mac
  para desarrollo y validacion alineada con el despliegue institucional
  posterior.
- **FR-006A**: El sistema MUST definir una modalidad de ejecucion local con
  datos mockeados para validar flujos base del backend principal sin depender
  de Oracle ni de integraciones institucionales disponibles en todo momento.
- **FR-007**: El sistema MUST definir configuracion por ambiente para DEV, QA y
  PROD, incluyendo separacion de parametros operativos y configuracion sensible.
- **FR-008**: El sistema MUST definir la capacidad minima de conexion a la
  persistencia objetivo para habilitar validaciones tempranas de acceso a datos.
- **FR-009**: El sistema MUST definir logging estructurado y una base de
  auditoria correlacionable para operaciones y jobs de la plataforma inicial.
- **FR-010**: El sistema MUST definir una base de autenticacion desacoplada del
  legado y preparada para integracion futura con un proveedor corporativo de
  identidad.
- **FR-011**: El sistema MUST definir una estrategia de jobs calendarizables
  fuera de Apps Script, incluyendo ejecucion, monitoreo y controles minimos de
  operacion.
- **FR-011A**: El sistema MUST definir un archivo JSON local versionado para la
  configuracion inicial de schedulers, utilizable en desarrollo y validacion
  temprana sin depender aun de un scheduler institucional activo.
- **FR-012**: El sistema MUST definir una estrategia de despliegue institucional
  para promover la plataforma entre DEV, QA y PROD sin mezclar configuraciones.
- **FR-012A**: El sistema MUST definir una estrategia de secretos compatible con
  CyberArk y con el SDK mas actualizado disponible al inicio de implementacion,
  sin bloquear la ejecucion inicial cuando esa integracion aun no este activa.
- **FR-013**: El sistema MUST definir la estrategia de coexistencia temporal con
  el legado, incluyendo limites operativos, adaptadores temporales, criterio de
  corte y criterio de rollback.
- **FR-014**: El sistema MUST identificar las dependencias del estado actual que
  impactan la transicion, incluyendo Google Sheets, Google Drive, Google Docs,
  Script Properties, sesiones locales, triggers y logs distribuidos.
- **FR-015**: El sistema MUST establecer restricciones para que nuevas piezas de
  la plataforma no repliquen automaticamente decisiones accidentales del legado.
- **FR-016**: El sistema MUST definir que evidencias operativas y tecnicas deben
  existir para considerar lista la plataforma inicial antes de migrar
  capacidades de negocio.
- **FR-017**: El sistema MUST definir riesgos y restricciones de migracion,
  incluyendo continuidad operativa, datos, seguridad, observabilidad y
  diferencias entre entorno local e institucional.
- **FR-018**: El sistema MUST permitir que una validacion representativa cubra,
  como minimo, una operacion autenticada, una interaccion con la persistencia
  objetivo y un job calendarizable.
- **FR-019**: El sistema MUST definir que las dependencias temporales al legado
  tengan responsable, motivo, impacto y criterio de retiro.
- **FR-020**: El sistema MUST definir criterios de aceptacion de la plataforma
  inicial que sean verificables antes de iniciar una migracion funcional
  posterior.

### Key Entities *(include if feature involves data)*

- **Inventario de capacidades legadas**: Conjunto de procesos, entidades,
  dependencias y automatizaciones del backend principal descubiertos en
  `legacy/`, clasificados por dominio, criticidad y estrategia de transicion.
- **Plataforma inicial institucional**: Base comun del backend objetivo que
  habilita ejecucion local, despliegue institucional, persistencia objetivo,
  autenticacion base, observabilidad y jobs calendarizables.
- **Dataset mockeado de validacion**: Conjunto controlado de datos de prueba que
  permite validar localmente flujos base, contratos y comportamiento operativo
  sin depender de fuentes institucionales reales.
- **Configuracion por ambiente**: Grupo de parametros operativos y sensibles que
  define el comportamiento aislado de DEV, QA y PROD.
- **Dependencia transitoria**: Integracion o componente del legado que se
  mantiene temporalmente durante la migracion con una regla clara de salida.
- **Contexto de acceso**: Informacion minima de identidad, roles y permisos que
  desacopla la plataforma inicial del mecanismo de autenticacion legado.
- **Definicion de job calendarizable**: Descripcion operativa de un proceso
  recurrente con disparador, condiciones de ejecucion, monitoreo y evidencia.
- **Catalogo local de schedulers**: Archivo JSON versionado que define jobs,
  disparadores y metadatos operativos para la validacion local de la fundacion.
- **Evidencia de validacion**: Registro verificable de arranque, ejecucion,
  trazabilidad, auditoria y compatibilidad operativa de la plataforma inicial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El equipo puede preparar y ejecutar la plataforma inicial en Mac
  para el ambiente de desarrollo en menos de 30 minutos siguiendo la
  documentacion definida para este ciclo.
- **SC-001A**: El equipo puede ejecutar localmente al menos una validacion
  completa con datos mockeados en menos de 15 minutos cuando las dependencias
  institucionales no estan disponibles.
- **SC-002**: El 100% de las validaciones de la plataforma inicial se ejecutan
  con configuracion aislada por ambiente y sin reutilizar valores sensibles de
  otro ambiente.
- **SC-003**: Antes de iniciar la siguiente fase, existe al menos una validacion
  completa y repetible que cubre una operacion autenticada, una operacion de
  datos y un job calendarizable sobre la plataforma inicial.
- **SC-004**: El 100% de las operaciones y jobs validados en la plataforma
  inicial generan registros operativos y de auditoria que permiten rastrear
  origen, resultado y ambiente sin consultar logs dispersos del legado.
- **SC-005**: El inventario de dependencias del backend principal identifica y
  clasifica la totalidad de las dependencias transitorias requeridas para este
  ciclo antes de comenzar una migracion funcional posterior.
- **SC-006**: Ninguna entrega de esta iteracion incorpora funcionalidades del
  dominio de WhatsApp como parte del alcance aprobado.

## Assumptions

- Esta primera iteracion se enfoca en la plataforma base del backend principal y
  no en la reimplementacion completa de todos los modulos funcionales del
  legado.
- La carpeta `legacy/` contiene evidencia suficiente para inferir el estado
  actual del backend principal, aun cuando algunas reglas de negocio adicionales
  deban confirmarse en ciclos posteriores.
- La integracion futura con Azure Entra ID no se implementa en esta iteracion,
  pero la base de acceso si debe quedar desacoplada para no bloquearla.
- Oracle, DEV, QA y PROD se consideran objetivos institucionales disponibles o
  provisionables para las siguientes fases, aunque la primera iteracion se
  concentre en dejar lista la fundacion y sus validaciones.
- La ejecucion local en Mac puede apoyarse en mecanismos equivalentes de
  desarrollo siempre que no rompan la compatibilidad con el modelo de despliegue
  institucional esperado.
- Los datos mockeados locales se consideran un mecanismo valido de desarrollo y
  validacion temprana, siempre que representen contratos y comportamientos
  suficientemente cercanos a los escenarios reales del backend principal.
- CyberArk se asume como mecanismo corporativo objetivo de secretos, aunque la
  primera iteracion no dependa de tener la integracion habilitada para poder
  arrancar localmente.
- Las dependencias actuales con Google Sheets, Google Drive, Google Docs, Script
  Properties y triggers de Apps Script solo podran mantenerse de manera
  transitoria y documentada durante la migracion.
- El primer slice funcional posterior a la fundacion sera Resumen de Clientes y
  el segundo sera Categorizacion de Clientes.
- El legado seguira siendo el sistema operativo vigente para las capacidades no
  migradas hasta que la plataforma inicial y los incrementos posteriores cumplan
  sus criterios de validacion.
- El dominio de WhatsApp queda completamente fuera de alcance para esta
  especificacion, aunque su existencia en `legacy/` se use como evidencia para
  delimitar exclusiones.
