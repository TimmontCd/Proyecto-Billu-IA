# Research: Fundacion Backend Institucional

## Decision 1: Empaquetado y topologia del backend

**Decision**: Usar un build Maven multi-module con un modulo web desplegable en
WebSphere 9 y un modulo `foundation-ear` como artefacto final de despliegue.

**Rationale**: Esta topologia alinea el proyecto con Java 8, WebSphere 9 y
empaquetado `.ear`, permite compartir librerias entre capas y separa desde el
inicio la logica de dominio de los adaptadores de infraestructura.

**Alternatives considered**:

- Un `fat jar` ejecutable localmente: rechazado porque se aleja del artefacto
  institucional objetivo.
- Un solo `war` sin `ear`: rechazado porque no cumple de forma explicita la
  restriccion de empaquetado final.
- Mantener Apps Script como backend principal temporal: rechazado porque no
  crea la fundacion institucional pedida por la especificacion.

## Decision 2: Estrategia de ejecucion local

**Decision**: Definir dos perfiles locales de trabajo sobre la misma
aplicacion: `local-mock` para desarrollo y validacion sin dependencias
institucionales, y `local-oracle` para validar la integracion con la
persistencia objetivo.

**Rationale**: Esto permite avanzar aun cuando Oracle, IAM o secretos
corporativos no esten disponibles, pero conserva los mismos contratos y flujos
que se usaran en ambientes institucionales.

**Alternatives considered**:

- Exigir solo modo Oracle: rechazado porque bloquearia desarrollo local y no
  cumple la necesidad de datos mockeados.
- Crear una aplicacion mock separada: rechazado porque generaria drift entre
  contratos y comportamiento.
- Validar solo empaquetado sin ejecucion local: rechazado porque incumple el
  objetivo del spec y la constitucion.

## Decision 3: Estrategia de persistencia y coexistencia

**Decision**: Oracle sera el destino formal de persistencia del nuevo backend;
las dependencias legadas se integraran unicamente mediante adaptadores
read-only, y los datasets mockeados se trataran como fuente local controlada
para desarrollo.

**Rationale**: Evita dual writes, reduce inconsistencia durante la transicion y
mantiene claro que Google Sheets no es la persistencia objetivo del backend
institucional.

**Alternatives considered**:

- Dual write Oracle + Sheets: rechazado por alto riesgo de divergencia y mayor
  complejidad de rollback.
- Mantener Sheets como fuente de verdad en la nueva fundacion: rechazado porque
  contradice el estado objetivo institucional.
- Cutover completo a Oracle en esta iteracion: rechazado porque la fase actual
  solo debe construir la fundacion de plataforma.

## Decision 4: Modelo de autenticacion de fundacion

**Decision**: Introducir una abstraccion `AccessContext` con un proveedor local
mock para desarrollo y un adaptador futuro para integracion corporativa
compatible con Azure Entra ID y el entorno WebSphere.

**Rationale**: Desacopla la plataforma inicial del esquema de sesiones locales
del legado y evita bloquear la evolucion posterior hacia autenticacion
federada.

**Alternatives considered**:

- Portar el esquema de sesiones del legado: rechazado porque replica una deuda
  que el proyecto busca retirar.
- Posponer por completo la autenticacion: rechazado porque la especificacion
  exige base desacoplada de acceso desde la primera iteracion.
- Integrar Azure Entra ID desde el primer sprint: rechazado porque excede el
  alcance de fundacion y depende de definiciones institucionales posteriores.

## Decision 5: Estrategia de jobs calendarizables

**Decision**: Modelar jobs como comandos idempotentes invocables mediante una
fachada de scheduler cuya configuracion local viva en un archivo JSON
versionado, ejecutables localmente de forma manual y desplegables despues sobre
un scheduler institucional.

**Rationale**: Permite validar comportamiento, logging y auditoria en local sin
quedar atados a triggers de Apps Script, deja auditable la configuracion de
jobs en repositorio y no fuerza desde ahora una tecnologia de calendarizacion
irreversible.

**Alternatives considered**:

- Seguir usando triggers de Apps Script: rechazado por incompatibilidad con el
  objetivo institucional.
- Acoplar la primera iteracion a un scheduler corporativo especifico: rechazado
  porque la fundacion debe seguir siendo portable entre local, DEV y WebSphere.
- Implementar jobs sin idempotencia: rechazado por riesgo alto en coexistencia y
  reprocesos.

## Decision 5A: Gestion de secretos

**Decision**: Diseñar la capa de secretos con un contrato desacoplado que pueda
resolver valores localmente al inicio y que despues integre CyberArk mediante
el SDK vigente mas actual disponible al inicio de implementacion.

**Rationale**: Permite arrancar la fundacion sin bloquear desarrollo por falta
de integracion corporativa, pero evita construir un mecanismo local que luego
rompa la convergencia a CyberArk.

**Alternatives considered**:

- Hardcodear secretos temporales en configuracion local: rechazado por riesgo
  de seguridad y drift.
- Hacer CyberArk obligatorio desde el dia uno: rechazado porque bloquearia el
  arranque inicial y la validacion local temprana.
- Mantener Script Properties como puente de secretos: rechazado porque replica
  una dependencia del legado no deseada.

## Decision 6: Observabilidad y auditoria

**Decision**: Estandarizar logs en JSON estructurado y un modelo de auditoria
correlacionable desde la primera iteracion, con campos listos para exportacion a
Elastic.

**Rationale**: El legado ya evidencia fragmentacion de logs y auditoria. La
fundacion debe corregir eso desde su primer caso de uso y no como mejora tardia.

**Alternatives considered**:

- Logs de texto plano: rechazados porque dificultan correlacion y adopcion en
  observabilidad centralizada.
- Auditoria solo en base de datos: rechazada porque no cubre todos los eventos
  operativos ni el troubleshooting temprano.
- Posponer observabilidad hasta migrar un modulo de negocio: rechazado por la
  constitucion del proyecto.

## Decision 7: Contratos expuestos por la fundacion

**Decision**: Diseñar primero un contrato HTTP interno de plataforma para
health, readiness, contexto de acceso, dependencias, carga de datasets mock y
ejecucion de jobs.

**Rationale**: Estos endpoints permiten probar la fundacion sin esperar la
migracion de modulos funcionales y sirven como base de smoke tests, despliegue y
validacion local.

**Alternatives considered**:

- No exponer contrato hasta migrar un modulo funcional: rechazado porque deja la
  fundacion sin superficie comprobable.
- Exponer desde ahora APIs de negocio del legado: rechazado porque esta
  iteracion no migra dominios funcionales.
- Hacer solo verificaciones por consola: rechazado porque no deja evidencia ni
  contrato repetible para tareas y pruebas posteriores.

## Decision 8: Orden de slices funcionales posteriores

**Decision**: Una vez cerrada la fundacion, migrar primero Resumen de Clientes y
despues Categorizacion de Clientes.

**Rationale**: Resumen de Clientes entrega primero una lectura consolidada de la
base operativa y habilita modelos y contratos reutilizables para la
segmentacion posterior. Categorizacion aprovecha despues esa base ya
institucionalizada.

**Alternatives considered**:

- Migrar Categorizacion primero: rechazado porque depende de una lectura
  consolidada de clientes y productos.
- Iniciar con PMO u otros modulos maduros: rechazado porque no maximizan la
  preparacion del dominio principal priorizado para la institucionalizacion.
