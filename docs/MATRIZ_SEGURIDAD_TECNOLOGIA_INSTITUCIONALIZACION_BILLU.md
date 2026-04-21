# Matriz de Seguridad y Tecnologia para Institucionalizacion de Billu

Version: 1.0  
Fecha de corte: 14 de abril de 2026

## 1. Objetivo

Este documento sirve como base para presentar ante los equipos de Seguridad y Tecnologia el estado tecnico actual de Billu, los componentes construidos, sus riesgos de continuidad y los cambios requeridos para institucionalizar cada modulo y habilitar su paso a produccion formal.

## 2. Resumen tecnico actual

La solucion Billu hoy opera principalmente sobre:

- Google Apps Script como backend transaccional y capa web interna.
- HTML/CSS/JavaScript renderizado con `HtmlService`.
- Google Sheets como persistencia principal.
- Google Drive y Google Docs como repositorio documental.
- APIs de Google para analitica, voz, transcripcion y correo.
- Un modulo nuevo de WhatsApp en `Node.js + TypeScript + Express`, pensado como base de evolucion fuera de Apps Script.

## 2.1 Tabla resumen ejecutiva

| Tema | Situacion actual | Objetivo institucional |
|---|---|---|
| Backend principal | `Google Apps Script` y `JavaScript` | Migrar modulos criticos a `Java/Spring Boot` |
| Modulo WhatsApp | `Node.js + TypeScript + Express` y PoC previa en Apps Script | Llevar a backend institucional con persistencia formal |
| Base de datos | `Google Sheets` como persistencia principal | Migrar dominios criticos a `Oracle` |
| Documentos | `Google Drive` y `Google Docs` | Integrar con repositorio documental autorizado |
| Configuracion y secretos | `Script Properties` y `.env` | Mover a secret manager corporativo |
| Autenticacion y accesos | Roles basicos y sesiones locales | Integrar con `SSO`, `IAM` y `RBAC` formal |
| Jobs y automatizaciones | Triggers de Apps Script | Migrar a scheduler institucional |
| Logs y auditoria | Hojas y logs aplicativos separados | Centralizar en plataforma de observabilidad / `SIEM` |
| Ambientes | Operacion predominantemente en ambiente unico | Separar `DEV`, `QA` y `PROD` |
| Paso a produccion | Parcialmente funcional, no totalmente institucionalizado | Homologar arquitectura, seguridad, datos y operacion |

## 3. Tabla transversal para Seguridad y Tecnologia

| Rubro tecnico | Estado actual | Riesgo / brecha para produccion | Requerimiento de institucionalizacion |
|---|---|---|---|
| Lenguaje y runtime | `Google Apps Script` y `JavaScript`; modulo nuevo de WhatsApp en `Node.js + TypeScript` | Arquitectura mixta, sin estandar corporativo unico | Definir stack objetivo por modulo: `Java/Spring Boot` para servicios productivos y retiro gradual de Apps Script |
| Framework backend | Backend principal serverless sobre Apps Script; webhook WhatsApp en `Express` | Dificulta homologacion de observabilidad, seguridad y SDLC | Migrar servicios criticos a `Spring Boot` o framework corporativo homologado |
| Frontend | HTML + CSS + JavaScript embebido en Apps Script | Acoplamiento al backend y menor control de pipeline | Separar frontend en SPA corporativa o mantener UI ligera solo para operacion interna no critica |
| Persistencia | `Google Sheets` como base operativa principal | Baja integridad referencial, alta fragilidad ante cambios manuales, poca trazabilidad transaccional | Migrar entidades criticas a `Oracle` con modelo relacional, constraints, indices, versionado y auditoria |
| Repositorio documental | `Google Drive` y `Google Docs` | Dependencia de workspace y gobierno documental limitado para TI central | Definir repositorio documental institucional o integrar con gestor documental autorizado |
| Configuracion | `Script Properties` y `.env` en Node | Secretos y configuracion dispersos | Mover secretos a `Vault` o secret manager institucional; parametrizacion por ambiente |
| Autenticacion | Control por correo y sesion en Apps Script | No esta integrado formalmente a IAM/SSO corporativo | Integrar con `LDAP`, `AD`, `SSO`, `OIDC` o proveedor corporativo |
| Autorizacion | Roles basicos `ADMIN` y `OPERATOR` | RBAC insuficiente para segregacion de funciones | Definir `RBAC` por modulo, accion, dato y ambiente |
| Seguridad de APIs | Webhooks y endpoints expuestos por Apps Script y Express | Controles heterogeneos | Incorporar API Gateway, validacion de firmas, allowlists, rate limit y WAF si aplica |
| Cifrado en transito | HTTPS por plataforma | No documentado como control formal de arquitectura | Formalizar TLS extremo a extremo y validacion de certificados |
| Cifrado en reposo | Depende de Google Workspace; no controlado desde aplicacion | Gobierno parcial para datos sensibles | Definir cifrado en base de datos, columnas sensibles y llaves administradas por TI |
| Logging y auditoria | Auditoria en hoja y logs aplicativos | Auditoria no centralizada y limitada para forense | Enviar logs a `SIEM` o plataforma corporativa con retencion y correlacion |
| Observabilidad | Logs basicos; no hay APM formal | Baja deteccion temprana de fallas | Implementar metricas, trazas, tableros y alertas operativas |
| Continuidad operativa | Triggers de Apps Script y procesos manuales | Dependencia alta de personas y configuracion manual | Definir `RTO/RPO`, respaldos, monitoreo de jobs y runbooks operativos |
| Gestion de cambios | Repositorio existente pero despliegue Apps Script especial | Riesgo de cambios manuales en hojas y scripts | CI/CD institucional, control de versiones, aprobaciones y segregacion DEV/QA/PROD |
| Ambientes | Predomina ambiente unico operativo | Riesgo de pruebas sobre datos o configuracion real | Separar `DEV`, `QA/UAT`, `PROD` con datos y secretos independientes |
| Calidad y pruebas | Pruebas funcionales mayormente manuales | Riesgo de regresion | Agregar pruebas unitarias, integracion, contrato y smoke tests |
| Dependencias externas | Google APIs, Meta WhatsApp, OpenAI, Brevo | Riesgo de terceros y cumplimiento | Formalizar inventario de terceros, due diligence, monitoreo y renovacion de credenciales |
| Programacion y jobs | `ScriptApp` triggers y procesos temporizados | Baja gobernanza y monitoreo | Migrar jobs a scheduler corporativo, `Quartz`, `Control-M`, `OCI Scheduler` o equivalente |
| Gobierno de datos | Hojas con operacion manual y datasets historicos | Riesgo de calidad, duplicidad y columnas alteradas | Data model oficial, catalogo, ownership, linaje y controles de calidad |
| Privacidad y minimizacion | Hay telefonos, correos, clientes y trazabilidad en hojas | Riesgo de sobreexposicion de datos personales | Enmascarar PII en logs, limitar acceso por necesidad y definir retencion |
| Vulnerabilidades | No se observa pipeline formal de escaneo | Riesgo de librerias vulnerables o malas configuraciones | SAST, DAST, SCA y hardening de configuracion |
| Respaldo y recuperacion | Respaldado implicitamente por Google y archivos operativos | No existe estrategia documentada por modulo | Respaldos versionados, restauracion probada y evidencia de recuperacion |

## 4. Tabla tecnica por modulo

| Modulo | Estado actual / stack | Persistencia actual | Integraciones | Riesgo principal para produccion | Objetivo institucional |
|---|---|---|---|---|---|
| Nucleo Control Tower | `Google Apps Script`, `JavaScript`, `HtmlService` | `Google Sheets`, `Script Properties` | Google Workspace | Alta dependencia de plataforma no homologada como core backend | Extraer a servicios institucionales y dejar Apps Script solo si se autoriza como capa temporal |
| Autenticacion y roles | Apps Script con sesiones y roles basicos | Sheets y propiedades | Correo corporativo | Falta `SSO`, `MFA`, politicas corporativas y segregacion fina | Integrar con IAM corporativo y RBAC por modulo |
| Dashboard ejecutivo | Apps Script + HTML embebido | Sheets | Servicios internos del proyecto | Acoplamiento UI-backend y baja trazabilidad de cambios | Separar backend/API y frontend; consumir datos ya institucionalizados |
| Monitoreo en tiempo real | Apps Script con jobs programados | Sheets de cache y auditoria | `GA4`, webhook Outlook | Motor de cache manual y operacion dependiente de triggers | Persistir eventos y snapshots en Oracle; scheduler corporativo; alertamiento central |
| Resumen de cuentas y productos | Apps Script | Hoja `Clientes` y fuentes satelite | Datasets operativos | Calidad e integridad del dato dependen de estructura manual | Crear modelo maestro de clientes, productos y aperturas en Oracle |
| Historico de saldos y ventas | Apps Script | Sheets de historicos | Archivos y hojas fuente | Cargas y transformaciones sensibles a formato | Implementar ETL institucional con tablas staging y control de calidad |
| Correlacion de depositos y cargos | Apps Script | Sheets y caches | Archivos transaccionales | Logica compleja sobre hojas, dificil de auditar | Llevar transacciones y correlaciones a Oracle con procedimientos o servicios batch |
| Categorizacion de clientes | Apps Script | Sheets de saldos, transacciones y segmentos | Fuentes de clientes y productos | Segmentacion sin versionado formal de reglas | Motor de reglas versionado, tablas de segmentos y salidas auditables |
| Proyectos y PMO | Apps Script | Sheets | Correo y vistas internas | Menor riesgo tecnico, pero sin controles enterprise | Migrar a Oracle si se institucionaliza como modulo oficial o integrarlo con herramienta PMO existente |
| Seguimiento de actividades | Apps Script | Sheets | Correo | Riesgo de operacion manual y auditoria limitada | Tabla de tareas, bitacora de cambios y notificaciones institucionales |
| Audio y minutas | Apps Script | Drive/Docs y metadata en hojas | Speech-to-Text, Drive, Docs | Exposicion documental, plantillas y archivos fuera de gobierno central | Reubicar archivos en repositorio institucional y guardar metadata en Oracle |
| Agente "Tincho" | Apps Script orientado a tareas | Sheets | TTS y servicios internos | Componente asistido sin marco formal de IA empresarial | Definir guardrails, catalogo de prompts, trazabilidad y aprobacion de uso |
| Agente de conversion | Parcial / reservado en Apps Script | Sheets | Fuentes comerciales | Modulo no consolidado | Rediseñar sobre arquitectura objetivo antes de productivizar |
| WhatsApp PoC en Apps Script | Apps Script para validacion rapida | Sheets de log y escalamiento | Meta WhatsApp Cloud API | No apto como base definitiva productiva | Retirar progresivamente y sustituir por servicio backend institucional |
| WhatsApp nuevo | `Node.js`, `TypeScript`, `Express` | Memoria de proceso; sin DB | Meta WhatsApp Cloud API, OpenAI | Estado conversacional y deduplicacion no persistentes; sin HA | Migrar a `Java/Spring Boot`, persistir mensajes, handoff y estado en Oracle |
| Programacion de campanas | Parcial en Apps Script | Sheets | Correo / fuentes comerciales | Configuracion y bitacora no institucionalizadas | Definir motor de campanas, scheduler formal, templates aprobados y trazabilidad |
| Heatmaps / prototipos | Parcial / reservado | N/A | N/A | No es prioridad productiva | Mantener fuera de alcance inicial |
| Dataset y utilerias de carga | Apps Script | Sheets y archivos | Archivos CSV/XLSX | Transformaciones dependientes de formato manual | Centralizar ingesta en ETL con staging, validaciones y rechazo controlado |

## 5. Tabla especifica de migracion de Google Sheets a Oracle

| Dominio de datos | Situacion actual en Sheets | Modelo objetivo en Oracle | Accion tecnica recomendada |
|---|---|---|---|
| Clientes | Hoja maestra y hojas satelite | `CLIENTE`, `CLIENTE_PRODUCTO`, `CLIENTE_ESTADO` | Diseñar llaves de negocio, historificacion y validacion de duplicados |
| Saldos historicos | Archivos y hojas de carga | `SALDO_DIARIO`, `SALDO_MENSUAL`, `SALDO_CORTE` | Crear tablas staging, reglas de calidad y carga incremental |
| Transacciones | CSV/XLSX y hojas temporales | `TRANSACCION`, `TRANSACCION_TIPO`, `TRANSACCION_FUENTE` | Normalizar fechas, montos, origen y claves de cliente |
| Eventos de enrolamiento | Cache de tiempo real y auditoria | `EVENTO_ENROLAMIENTO`, `EVENTO_AGREGADO_5M`, `ALERTA_OPERATIVA` | Persistir eventos crudos y agregados para observabilidad e historico |
| Segmentacion | Hojas con clasificacion y exportables | `SEGMENTO_CLIENTE`, `REGLA_SEGMENTACION`, `OPORTUNIDAD_CROSSSELL` | Versionar reglas y resultados por fecha de corrida |
| Proyectos | Hojas de proyectos, tareas y avances | `PROYECTO`, `TAREA`, `AVANCE`, `RESPONSABLE` | Mantener auditoria y estados con catálogos |
| Actividades del equipo | Hojas operativas | `ACTIVIDAD`, `ACTIVIDAD_HISTORICO`, `RECORDATORIO` | Modelar trazabilidad de cambios y SLA |
| WhatsApp | Logs y escalamiento en sheets o memoria | `WA_CONVERSACION`, `WA_MENSAJE`, `WA_HANDOFF`, `WA_ESTADO_FLUJO` | Persistir mensajes inbound/outbound, deduplicacion y casos escalados |
| Campanas | Configuracion y logs en hojas | `CAMPANA`, `CAMPANA_ENVIO`, `CAMPANA_RESULTADO`, `PLANTILLA` | Separar configuracion, ejecucion y evidencia |
| Documentos y minutas | Drive/Docs + metadata minima | `DOCUMENTO`, `DOCUMENTO_TIPO`, `DOCUMENTO_RELACION` | Guardar metadata en Oracle y dejar binarios en repositorio documental autorizado |
| Auditoria | Bitacoras en hojas y logs dispersos | `AUDIT_EVENT`, `JOB_EXECUTION`, `INTEGRATION_LOG` | Unificar auditoria tecnica y funcional |

## 6. Recomendaciones puntuales para Seguridad

| Rubro de seguridad | Recomendacion concreta |
|---|---|
| Identidad y acceso | Integrar con `SSO` corporativo, `MFA` y recertificacion periodica de accesos |
| Secretos | Retirar secretos de `Script Properties` y `.env`; usar secreto administrado centralmente |
| PII | Enmascarar telefono, correo e identificadores en logs y reportes operativos |
| Trazabilidad | Enviar auditoria y logs a `SIEM` con correlacion por usuario, modulo y transaccion |
| Webhooks | Validar firma, origen, replay protection, rate limiting y rotacion de credenciales |
| Endurecimiento | Deshabilitar accesos anonimos, aplicar listas de control y hardening de headers |
| Terceros | Formalizar evaluacion de Meta, OpenAI, Google APIs, Brevo y cualquier proveedor adicional |
| Retencion | Definir politicas de retencion y purga para conversaciones, minutas, tareas y datasets |

## 7. Recomendaciones puntuales para Tecnologia

| Rubro de tecnologia | Recomendacion concreta |
|---|---|
| Arquitectura objetivo | `Java/Spring Boot` para servicios institucionales; Oracle como persistencia central |
| Integracion de datos | ETL o microservicios batch con tablas staging, validaciones y carga incremental |
| Ambientes | Separar DEV, QA y PROD con pipelines y datos controlados |
| Despliegue | Contenedores, CI/CD, versionado semantico y aprobaciones por ambiente |
| Scheduler | Sustituir triggers de Apps Script por scheduler institucional |
| Monitoreo | Centralizar metricas, logs, healthchecks, alertas y capacidad |
| Resiliencia | Timeouts, retries, circuit breakers y manejo formal de errores de terceros |
| Modelo de datos | Catalogo de entidades maestras y ownership por dominio |

## 8. Propuesta de ruta de institucionalizacion

1. Congelar la estructura funcional actual y definir alcance oficial por modulo.
2. Clasificar modulos en tres grupos: productivizar, rediseñar o retirar.
3. Diseñar modelo de datos Oracle para clientes, eventos, tareas, campañas y WhatsApp.
4. Migrar primero los modulos de mayor criticidad operativa: monitoreo, clientes, historicos, WhatsApp y actividades.
5. Integrar identidad, secretos, auditoria y observabilidad antes del paso a produccion.
6. Ejecutar pruebas de regresion funcional, seguridad y continuidad operativa.
7. Formalizar runbooks, soporte, ownership y matriz RACI por modulo.

## 9. Mensaje corto para presentar la tabla

Texto sugerido:

"La solucion Billu ya demostro valor funcional y operativo, pero su base actual es predominantemente de prototipado acelerado sobre Google Apps Script y Google Sheets. Para institucionalizarla y llevarla a produccion formal, proponemos homologar arquitectura, seguridad, observabilidad, gobierno de datos y persistencia en Oracle, modulo por modulo, priorizando los componentes con mayor impacto operativo."
