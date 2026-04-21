# Documento Tecnico e Institucionalizacion de Billu

Version del documento: 1.0  
Fecha de corte: 27 de marzo de 2026  
Base analizada: repositorio tecnico, manifiesto de Apps Script, manual operativo y artefactos de carga disponibles en este proyecto.

## 1. Proposito

Este documento resume, en lenguaje tecnico pero entendible para direccion, que se construyo en el proyecto Billu, como esta armado, que capacidades ya estan operando, que componentes siguen parciales o reservados, y que se requiere para institucionalizar la solucion dentro de la operacion formal del banco.

## 2. Resumen ejecutivo

Billu evoluciono de un MVP de "Control Tower Directiva" a una plataforma operativa interna montada en Google Apps Script, con interfaz web, almacenamiento principal en Google Sheets, integracion con Google Drive y consumo de APIs de Google para analitica, transcripcion y voz.

La solucion ya contiene capacidades funcionales reales para:

- monitoreo en tiempo real del enrolamiento Billu N2 y N4,
- resumen ejecutivo de cuentas y productos,
- analisis de apertura y uso durante los primeros 30 dias,
- categorizacion automatica de clientes y exportacion de segmentos,
- seguimiento de proyectos y actividades del equipo,
- recordatorios por correo,
- asistente operativo "Preguntale al Che" para gestionar tareas,
- carga historica de saldos y ventas,
- generacion de minutas a partir de audio.

Al mismo tiempo, el repositorio muestra que algunos modulos visibles en la interfaz siguen reservados o en desarrollo, y que la institucionalizacion requiere fortalecer seguridad, gobierno de datos, administracion de configuracion, ambientes, continuidad operativa y control de cambios.

## 3. Alcance implementado

### 3.1 Capacidades implementadas

1. Monitoreo de enrolamiento en tiempo real.
2. Resumen ejecutivo de cuentas, productos y plasticos.
3. Cohortes de apertura y uso "First 30".
4. Correlacion de depositos y cargos con vista por cliente.
5. Categorizacion automatica de clientes y venta cruzada.
6. Seguimiento de proyectos, tareas y avances.
7. Seguimiento de actividades del equipo con recordatorios.
8. Asistente de lenguaje natural orientado a tareas.
9. Carga y analisis de historicos de saldos y ventas.
10. Carga de audio y generacion automatica de minutas.
11. Bootstrap tecnico para hojas, carpetas y plantillas.
12. Alertamiento operativo basico.

### 3.2 Capacidades parciales o reservadas

Los siguientes componentes existen en la interfaz, pero el propio codigo los marca como reservados, pendientes o en desarrollo:

- Agente de Conversion.
- Agente de Whatsapp.
- Programacion de Campanas.
- Ordenes de Servicio e Incidencias.
- Mapas de calor.

Adicionalmente, "Preguntale al Che" ya no opera con manuales ni base de conocimiento documental en esta etapa; en el backend esta en modo `TASK_ONLY`, es decir, enfocado unicamente en tareas del tablero operativo.

### 3.3 Alineacion con el manual operativo existente

El manual operativo revisado muestra que el proceso Billu ya venia requiriendo formalmente:

- disponibilidad de informacion operativa,
- control sobre aperturas y enrolamiento,
- soporte a procesos de cash back,
- resguardo y seguimiento de actividades.

La plataforma desarrollada si cubre la capa de visibilidad, consolidacion y seguimiento de informacion para esos procesos. Sin embargo, no se observo en el codigo una automatizacion completa del abono contable final de cash back; por lo tanto, la presentacion ante direccion debe posicionar correctamente que la solucion institucionaliza principalmente la capa de control, monitoreo, seguimiento y analitica operativa.

## 4. Arquitectura de la solucion

### 4.1 Arquitectura logica

La solucion esta construida sobre Google Apps Script como Web App, con una arquitectura por capas:

- `core`: configuracion, autenticacion, utilerias, bootstrap, ejecuciones programadas y manifest.
- `controllers`: punto de entrada para cada modulo funcional.
- `services`: logica de negocio, integraciones y transformaciones.
- `repositories`: acceso generico a datos sobre Google Sheets.
- `views`: interfaz HTML/CSS/JavaScript renderizada con `HtmlService`.
- `dist`: salida preparada para despliegue en Apps Script.

### 4.2 Patron de operacion

1. El usuario entra a la Web App.
2. `doGet` entrega la interfaz HTML.
3. El frontend llama controladores de Apps Script.
4. Los controladores delegan a servicios.
5. Los servicios leen o escriben en Google Sheets, Drive o APIs externas.
6. Los resultados regresan al frontend como `ApiResponse`.

### 4.3 Repositorio y persistencia

La persistencia principal vive en Google Sheets. El repositorio generico `BaseRepository` normaliza encabezados, crea hojas faltantes y ejecuta operaciones CRUD basicas.

Ventajas:

- bajo tiempo de salida a produccion,
- facilidad de administracion para negocio,
- trazabilidad visible para equipos no tecnicos.

Limitaciones:

- escalabilidad y concurrencia acotadas,
- mayor dependencia de formatos manuales,
- control de integridad mas debil que una base transaccional,
- mas riesgo ante cambios manuales de columnas o encabezados.

## 5. Componentes construidos

### 5.1 Nucleo tecnico

El nucleo contiene catalogos, constantes, configuracion por `Script Properties`, autenticacion por correo, control de roles, normalizacion de respuestas y bitacora de auditoria.

Elementos relevantes:

- nombre tecnico base: `Control Tower Directiva`,
- version del codigo: `0.7.3`,
- zona horaria: `America/Monterrey`,
- roles: `ADMIN` y `OPERATOR`,
- bitacora de auditoria en hoja `Bitacora`.

### 5.2 Monitoreo en tiempo real

El modulo de tiempo real combina dos fuentes:

- eventos operativos en tiempo real consultados desde GA4,
- ingestiones via webhook desde Outlook para aperturas reales.

Funciones principales:

- sincronizacion de buffer cada 1 minuto,
- consolidacion cada 5 minutos,
- alertamiento por ausencia de finalizaciones de enrolamiento,
- evaluacion diferenciada entre horario pico y fuera de horario,
- reparacion de duplicados y reconstruccion de cache.

Cobertura funcional:

- flujo Billu N2,
- flujo Billu Premium N4,
- semaforizacion de salud del proceso,
- correo de alerta cuando se detecta posible interrupcion.

### 5.3 Resumen de cuentas y productos

Este modulo usa como fuente principal la hoja `Clientes` y construye:

- total de cuentas,
- saldo total,
- activas e inactivas,
- desglose por producto,
- resumen de plasticos,
- distribucion por estado,
- historico de aperturas,
- analisis de cohortes `First 30`.

Productos reconocidos:

- cuenta nivel 2,
- cuenta nivel 4,
- ahorro programado,
- inversion diaria,
- tarjeta de credito.

### 5.4 Correlacion de depositos y cargos

Existe un modulo tecnico de vista ejecutiva para correlacionar:

- universo de clientes,
- transacciones enero-marzo 2026,
- comportamiento durante los primeros 30 dias,
- perfil por ID cliente,
- estado,
- producto,
- saldos promedio y puntuales.

El modulo puede:

- reconstruir su cache desde fuentes,
- exportar cohortes,
- consultar un cliente puntual,
- producir vistas ejecutivas de uso temprano.

Nota importante: este modulo existe como vista y servicio, pero no esta expuesto en el menu principal activo de la aplicacion.

### 5.5 Categorizacion automatica de clientes

La categorizacion ya implementa reglas de negocio para clasificar clientes en tres niveles:

1. Exploradores.
2. Constructores.
3. Aliados Premium.

Variables consideradas:

- saldo promedio de 3 meses,
- cantidad de transacciones,
- antiguedad,
- productos activos,
- productos faltantes,
- perfil transaccional,
- oportunidad de venta cruzada.

Salidas del modulo:

- KPIs ejecutivos,
- resumen por segmento,
- exportacion CSV por nivel,
- exportacion CSV de venta cruzada,
- consulta puntual por ID recompensas,
- tarjeta sugerida y campana sugerida.

### 5.6 Proyectos y PMO

El modulo de proyectos permite:

- alta y actualizacion de proyectos,
- tareas por proyecto,
- registro de avances,
- resumen de portafolio,
- semaforo de riesgo,
- consulta de detalle del proyecto.

Reglas destacadas:

- recalculo automatico del avance del proyecto segun el promedio de tareas,
- semaforo basado en riesgo, bloqueo, fecha compromiso y avance,
- visibilidad por responsable y usuarios autorizados.

### 5.7 Seguimiento de actividades del equipo

Este es uno de los modulos mas maduros para operacion interna. Permite:

- alta, edicion y cierre de actividades,
- responsables autenticados,
- prioridad y fechas limite,
- tablero por usuario,
- actividad reciente,
- recordatorios por vencer o vencidas,
- auditoria de cambios.

El modulo puede operar incluso sobre un spreadsheet dedicado distinto al maestro, lo que facilita aislar la gestion diaria del equipo.

### 5.8 Asistente operativo "Preguntale al Che"

El asistente ya esta orientado al tablero de actividades. Sus capacidades actuales son:

- consultar pendientes,
- resumir carga de trabajo,
- crear actividades,
- actualizar estatus,
- registrar feedback,
- sintetizar voz con Google TTS.

Estado funcional real:

- si opera como asistente de tareas,
- si guarda historial de consultas y feedback,
- no opera actualmente como motor documental basado en manuales,
- no tiene Dialogflow habilitado en la configuracion observada.

### 5.9 Historico de saldos y ventas

Este modulo permite importar registros historicos y generar:

- resumen diario,
- resumen por hora,
- variacion diaria,
- promedio movil 7 y 30 dias,
- alertas por desviacion historica.

Se utiliza hashing por registro para evitar duplicados en la carga.

### 5.10 Audio y minutas

La plataforma incluye:

- carga de archivos de audio a Drive,
- transcripcion con Google Speech-to-Text cuando esta habilitado,
- extraccion automatica de resumen, acuerdos, tareas y riesgos,
- generacion de minuta en Google Docs,
- creacion opcional de tareas derivadas de la minuta.

### 5.11 Administracion y bootstrap

El bootstrap crea o normaliza:

- hojas del modelo de datos,
- carpetas en Drive,
- plantillas de documentos,
- catalogos base,
- roles,
- usuario administrador inicial,
- tokens operativos.

Tambien existen checks administrativos para ejecutar alertas y revisiones operativas.

## 6. Modelo de datos operativo

El modelo de datos principal esta definido sobre hojas de Google Sheets. Las mas relevantes son:

| Hoja | Proposito |
| --- | --- |
| `Usuarios` | control de acceso y perfiles |
| `Roles` | definicion de permisos |
| `Proyectos` | portafolio de iniciativas |
| `Tareas` | tareas ligadas a proyectos |
| `SeguimientoActividades` | tablero diario del equipo |
| `Avances` | evidencias y progreso |
| `Incidencias` | incidencias de proyectos |
| `Alertas` | alertamiento operativo |
| `Documentos` | referencias a documentos generados |
| `Audios` | archivos y estado de transcripcion |
| `Minutas` | minutas derivadas de audio |
| `AnalisisFuncionales` | analisis funcionales generados |
| `AnaliticaDataset` y `AnaliticaDatasetRows` | datasets cargados |
| `DepositosCargos*` | capas operativas y cache de depositos/cargos |
| `SaldosVentasHistorico` | historico de saldos y ventas |
| `CargasHistoricas` | control de cargas historicas |
| `Tincho*` | consultas, feedback y escalaciones del asistente |
| `Bitacora` | auditoria de acciones |

## 7. Fuentes de datos e integraciones

### 7.1 Fuentes principales observadas en configuracion

- spreadsheet maestro Billu,
- spreadsheet de saldos de cliente,
- spreadsheet de categorizacion / saldos mensuales,
- spreadsheets mensuales de transacciones enero, febrero y marzo 2026,
- folder raiz en Google Drive,
- propiedad GA4 para analitica.

### 7.2 Integraciones externas

- Google Analytics Data API,
- Google Speech-to-Text,
- Google Text-to-Speech,
- Google Drive API para conversion de archivos a Google Sheets,
- Google Docs para plantillas y minutas,
- Outlook via webhook para aperturas reales.

### 7.3 Script Properties relevantes

La operacion depende de propiedades como:

- dominios permitidos,
- IDs de spreadsheets y carpetas,
- property ID de GA4,
- correos de alertas,
- configuracion de transcripcion,
- configuracion del asistente,
- tokens de integracion operativa.

## 8. Operacion y automatizacion

### 8.1 Jobs y ejecuciones programadas

Se identificaron dos grupos principales de automatizacion:

1. Refresco diario de fuentes transaccionales.
   - horario observado: diario a las 10:00.
   - acciones: sincroniza saldos mensuales, relee fuentes transaccionales, recalcula depositos/cargos y refresca cohortes First 30.

2. Monitoreo en tiempo real.
   - sincronizacion live: cada 1 minuto.
   - consolidacion de cache: cada 5 minutos.
   - chequeo de alertas: cada 5 minutos.

### 8.2 Mantenimiento por endpoint

La Web App tambien expone acciones tecnicas para:

- configurar spreadsheet de seguimiento,
- instalar trigger de refresco diario,
- correr refresco diario en demanda,
- correr sincronizacion mensual,
- formatear columnas monetarias,
- registrar usuarios operativos.

## 9. Seguridad, control y cumplimiento

### 9.1 Controles ya presentes

- autenticacion por correo del usuario activo de Google,
- control por rol `ADMIN` y `OPERATOR`,
- allowlist de correos externos,
- bitacora de auditoria por alta y cambio,
- campos sensibles bloqueados para analitica,
- tokens para acciones de mantenimiento,
- scopes explicitos en `appsscript.json`.

### 9.2 Riesgos y observaciones de seguridad

1. La Web App esta configurada con acceso `ANYONE`.
   - Aunque el frontend valida usuario al entrar, para institucionalizacion se recomienda validar si este nivel de exposicion es aceptable o si debe limitarse al dominio corporativo.

2. Existen tokens y valores sensibles hardcodeados en codigo.
   - Para institucionalizacion deben moverse a `Script Properties` o a un esquema formal de secretos.

3. Hay correos personales en defaults y allowlists.
   - Deben sustituirse por cuentas institucionales o listas administradas formalmente.

4. El almacenamiento en hojas permite cambios manuales.
   - Se requieren controles de acceso, propietarios formales y respaldo.

## 10. Hallazgos tecnicos para presentar con transparencia

### 10.1 Fortalezas

- la solucion ya resuelve problemas operativos reales,
- el time to market fue corto por apoyarse en Google Workspace,
- la interfaz ya unifica varios tableros antes dispersos,
- existe audit trail,
- existen automatizaciones programadas,
- hay una base clara para estandarizar operacion.

### 10.2 Deuda tecnica y pendientes

1. Hay modulos visibles que todavia son placeholders.
2. No se observaron pruebas automatizadas ni pipeline formal de despliegue.
3. La configuracion esta dispersa entre codigo y `Script Properties`.
4. La persistencia en Sheets es util para MVP, pero limitada para escalamiento.
5. El repositorio contiene artefactos de compilacion repetidos (`dist`, `dist 2`, `dist 3`, etc.), lo cual debe ordenarse.
6. Parte de la documentacion funcional existente requiere alineacion temporal.

### 10.3 Observacion documental relevante

El archivo `Manual para la Operacion y Administracion de Billu` indica version `1.3` y "Ultima Modificacion: Junio 2026". Dado que la fecha de corte de este documento es 27 de marzo de 2026, esa marca temporal debe validarse antes de usar el manual como evidencia oficial en comites o direccion.

## 11. Propuesta de institucionalizacion

### 11.1 Gobierno

Se recomienda formalizar la solucion con los siguientes duenos:

- dueno de negocio: Direccion de Innovacion Digital,
- dueno funcional: lider operativo del proceso Billu,
- dueno tecnico: celula de automatizacion / data / desarrollo,
- dueno de datos: area responsable de las fuentes oficiales,
- dueno de seguridad: arquitectura y seguridad de la informacion.

### 11.2 Ambientes

Crear y separar al menos tres ambientes:

1. Desarrollo.
2. UAT o certificacion.
3. Produccion.

Cada ambiente debe tener:

- proyecto Apps Script independiente,
- spreadsheets y carpetas independientes,
- propiedades y tokens propios,
- lista de usuarios autorizados propia.

### 11.3 Seguridad y cumplimiento

Acciones recomendadas:

1. mover todos los tokens hardcodeados a propiedades seguras,
2. restringir acceso de la Web App al dominio corporativo si el caso de uso lo permite,
3. eliminar correos personales de configuracion por default,
4. documentar matriz de accesos y segregacion de funciones,
5. revisar scopes OAuth con seguridad.

### 11.4 Gobierno de datos

Formalizar:

- catalogo de fuentes oficiales,
- dueno por spreadsheet,
- diccionario de datos por hoja critica,
- reglas de calidad para encabezados y formatos,
- calendario de actualizacion por fuente,
- SLA de disponibilidad y tiempos de refresco.

### 11.5 Operacion y soporte

Definir un modelo operativo con:

- mesa de soporte de primer nivel,
- responsable de monitoreo diario,
- procedimiento de atencion de incidentes,
- procedimiento de rollback funcional,
- procedimiento de alta y baja de usuarios,
- procedimiento de rotacion de tokens,
- respaldo de plantillas, hojas y configuracion.

### 11.6 Desarrollo y despliegue

Se recomienda institucionalizar el ciclo de vida asi:

1. desarrollo en rama controlada,
2. build de `dist` limpio y unico,
3. validacion en ambiente UAT,
4. aprobacion funcional,
5. despliegue a produccion,
6. registro de version y fecha de liberacion.

### 11.7 Documentacion minima obligatoria

Para convertirlo en capacidad institucional se recomienda mantener:

- documento tecnico maestro,
- documento funcional por modulo,
- matriz de fuentes y responsables,
- SOP de operacion diaria,
- manual de administracion,
- manual de soporte,
- bitacora de cambios y versiones.

## 12. Roadmap sugerido de institucionalizacion

### 0 a 30 dias

- congelar alcance de lo ya operativo,
- limpiar configuraciones hardcodeadas,
- formalizar propietarios,
- separar DEV y PROD,
- depurar artefactos del repositorio,
- cerrar documento tecnico y SOP base.

### 31 a 60 dias

- endurecer seguridad de acceso,
- implementar proceso formal de despliegue,
- crear matriz de datos y controles,
- estabilizar monitoreo y alertas,
- habilitar tablero de soporte operativo.

### 61 a 90 dias

- evaluar migracion de tablas criticas a una base mas robusta si el volumen lo exige,
- definir continuidad operativa y respaldo,
- medir adopcion, uso y tiempos de respuesta,
- decidir que modulos reservados pasan a fase 2 y cuales se retiran del menu.

## 13. Recomendacion para presentacion ante direccion

El mensaje recomendado es:

- Billu ya cuenta con una plataforma interna funcional que integra monitoreo, analitica operativa y gestion del trabajo.
- La solucion ya genera valor real en seguimiento y control.
- El siguiente paso no es "hacer otro sistema", sino institucionalizar lo construido.
- Institucionalizar implica gobierno, seguridad, ambientes, soporte, documentacion y control de cambios.

## 14. Evidencia tecnica base revisada

Artefactos principales utilizados para este levantamiento:

- `README.md`
- `appsscript.json`
- `src/core/*`
- `src/controllers/*`
- `src/services/*`
- `src/repositories/BaseRepository.gs`
- `src/views/index.html`
- `src/views/partials/scripts.html`
- `Manual para la Operacion y Administracion de Billu.txt`

## 15. Conclusion

Billu ya no debe presentarse como un experimento aislado. Tecnica y funcionalmente ya existe una plataforma operativa con componentes productivos claros. Lo que corresponde ahora es cerrar brechas de institucionalizacion para convertirla en una capacidad formal, segura, trazable y sostenible dentro del banco.
