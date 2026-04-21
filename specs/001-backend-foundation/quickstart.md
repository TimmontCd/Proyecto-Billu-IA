# Quickstart: Fundacion Backend Institucional

## Purpose

Levantar y validar localmente la fundacion del backend institucional en Mac en
dos modalidades:

- `local-mock`: sin Oracle ni integraciones institucionales reales.
- `local-oracle`: con Oracle disponible para validar la persistencia objetivo.

## Prerequisites

- JDK 8 instalado y activo en terminal.
- Maven 3.8+ disponible.
- Acceso al repositorio actual.
- Credenciales Oracle solo para `local-oracle`.
- Archivo de schedulers local disponible en
  `backend/config/schedulers/local-schedulers.json`.
- Variables de configuracion por ambiente resueltas fuera del codigo.

## Expected repository layout

```text
backend/
├── pom.xml
├── config/
│   └── schedulers/
│       └── local-schedulers.json
├── foundation-domain/
├── foundation-application/
├── foundation-infrastructure-oracle/
├── foundation-infrastructure-mock/
├── foundation-infrastructure-legacy/
├── foundation-infrastructure-secrets/
├── foundation-web/
└── foundation-ear/
```

## 1. Validacion local con datos mockeados

### Build

```bash
mvn -f backend/pom.xml clean verify -P local-mock
```

### Run

```bash
mvn -f backend/pom.xml -pl foundation-web -am -P local-mock \
  -Dbillu.environment=local-mock \
  -DskipTests \
  package
```

Despliegue local esperado:

- publicar `backend/foundation-web/target/foundation-web-0.1.0-SNAPSHOT.war` en un
  contenedor servlet/Jakarta EE compatible con Servlet 3.1;
- o desplegar el `EAR` generado en un WebSphere 9 local/compartido de validacion.

### Smoke checks

```bash
curl -s http://localhost:8080/internal/platform/health
curl -s http://localhost:8080/internal/platform/readiness
curl -s http://localhost:8080/internal/platform/dependencies
curl -s http://localhost:8080/internal/platform/auth/context
curl -s -X POST http://localhost:8080/internal/platform/mock-datasets/bootstrap/load
```

### Expected result

- El servicio arranca en Mac sin Oracle.
- El perfil activo queda resuelto como `local-mock` via `-Dbillu.environment`
  o `BILLU_ENV`.
- Se puede cargar un dataset mockeado controlado.
- El endpoint de readiness responde `READY`.
- Los endpoints internos de plataforma responden con `correlationId` y el mismo
  contrato tanto en smoke manual como en pruebas.

## 2. Validacion local con Oracle

### Environment

Configurar variables seguras externas, por ejemplo:

```bash
export BILLU_ENV=local-oracle
export BILLU_ORACLE_URL='jdbc:oracle:thin:@//host:1521/service'
export BILLU_ORACLE_USER='usuario'
export BILLU_ORACLE_PASSWORD='***'
```

Si CyberArk aun no esta disponible:

- usar proveedor local controlado solo para desarrollo;
- mantener el mismo contrato de resolucion de secretos que usara el adaptador
  de CyberArk;
- no hardcodear secretos en codigo ni en el archivo JSON de schedulers.

### Build

```bash
mvn -f backend/pom.xml clean verify -P local-oracle
```

### Run

```bash
mvn -f backend/pom.xml -pl foundation-web -am -P local-oracle \
  -Dbillu.environment=local-oracle \
  -DskipTests \
  package
```

Despliegue local esperado:

- publicar `backend/foundation-web/target/foundation-web-0.1.0-SNAPSHOT.war` en un
  contenedor local compatible;
- usar el mismo `WAR` dentro del `EAR` para validacion institucional posterior.

### Smoke checks

```bash
curl -s http://localhost:8080/internal/platform/health
curl -s http://localhost:8080/internal/platform/readiness
curl -s http://localhost:8080/internal/platform/dependencies
curl -s http://localhost:8080/internal/platform/auth/context
```

### Expected result

- El backend valida conectividad a Oracle.
- La respuesta de readiness distingue dependencias listas y no listas.
- Si Oracle no esta disponible, readiness responde `DEGRADED` y el contrato HTTP
  se mantiene estable.
- Los contratos siguen siendo los mismos que en `local-mock`.
- El proveedor de secretos puede seguir siendo local mientras la integracion con
  CyberArk aun no este habilitada.

## 3. Generar artefacto de despliegue institucional

```bash
mvn -f backend/pom.xml -pl foundation-ear -am clean package -P dev
```

Resultado esperado:

- Se genera un `.ear` listo para promoverse a un despliegue candidato.
- El build falla si alguna validacion de contrato, pruebas o empaquetado no
  cumple.

## 4. Fallback operativo

Si `local-oracle` falla:

1. volver a `local-mock`,
2. validar contratos y jobs de plataforma,
3. documentar la dependencia no disponible,
4. no avanzar a migracion funcional hasta resolver la brecha.

## 5. Non-goals of this quickstart

- No migra modulos de negocio del legado.
- No implementa integracion final con Azure Entra ID.
- No habilita el dominio de WhatsApp.
- No migra aun Resumen de Clientes ni Categorizacion de Clientes; esos son los
  slices funcionales siguientes a la fundacion.
