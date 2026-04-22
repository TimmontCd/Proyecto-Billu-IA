# Quickstart: Categorizacion de Clientes

## Purpose

Validar localmente el slice institucional de Categorizacion de Clientes con
dashboard, detalle y exportables.

## Prerequisites

- foundation compilando con `JDK 8` y `Maven`
- endpoints internos de plataforma disponibles
- datasets mockeados del slice en `foundation-infrastructure-mock`
- Tomcat 9 local con despliegue del WAR `foundation-web`

## Build base

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk1.8.0_202'
$env:PATH='C:\Program Files\Java\jdk1.8.0_202\bin;C:\Users\PouPou\AppData\Local\Programs\Apache\Maven\apache-maven-3.9.14\bin;' + $env:PATH
mvn -f backend/pom.xml -DskipTests package
```

## Build validated on macOS

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-8.jdk/Contents/Home
mvn -f backend/pom.xml -Dmaven.repo.local=/tmp/billu-m2 -DskipTests package
cp backend/foundation-web/target/foundation-web-0.1.0-SNAPSHOT.war /tmp/apache-tomcat-9.0.117/webapps/ROOT.war
/tmp/apache-tomcat-9.0.117/bin/catalina.sh run
```

## local-mock smoke

```bash
curl -s http://localhost:8080/internal/customer-categorization/dashboard
curl -s http://localhost:8080/internal/customer-categorization/rewards/ABC123
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/segment \
  -H 'Content-Type: application/json' \
  -d '{"segmentId":"Constructores"}'
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/cross-sell \
  -H 'Content-Type: application/json' \
  -d '{"segmentId":"Constructores"}'
```

## local-oracle preparation

```bash
export BILLU_ENV=local-oracle
export BILLU_ORACLE_URL='jdbc:oracle:thin:@//host:1521/service'
export BILLU_ORACLE_USER='billu_read'
export BILLU_ORACLE_PASSWORD='***'
mvn -f backend/pom.xml -Dmaven.repo.local=/tmp/billu-m2 -DskipTests package
BILLU_ENV=local-oracle /tmp/apache-tomcat-9.0.117/bin/catalina.sh run
```

Comportamiento esperado:

- `local-oracle` ya no debe degradar automaticamente a `legacy`.
- Los endpoints ya cableados a Oracle requieren `BILLU_ORACLE_URL`,
  `BILLU_ORACLE_USER` y `BILLU_ORACLE_PASSWORD`.
- Si faltan credenciales o no existe conectividad real, la respuesta debe
  fallar explicita y tempranamente.

Validacion verificada en esta maquina:

- `GET /internal/customer-categorization/dashboard` devuelve `500` con
  `Oracle connection settings are incomplete. Configure BILLU_ORACLE_URL, BILLU_ORACLE_USER and BILLU_ORACLE_PASSWORD.`
- `GET /internal/customer-categorization/rewards/ABC123` sigue la misma ruta
  Oracle y falla igual mientras no exista configuracion real.
- `POST /internal/customer-categorization/exports/segment` devuelve `500` con
  `Oracle connection settings are incomplete. Configure BILLU_ORACLE_URL, BILLU_ORACLE_USER and BILLU_ORACLE_PASSWORD.`
- `GET /internal/customer-summary/overview` devuelve `500` con
  `Oracle connection settings are incomplete. Configure BILLU_ORACLE_URL, BILLU_ORACLE_USER and BILLU_ORACLE_PASSWORD.`

## Smoke esperado

```bash
curl -s http://localhost:8080/internal/customer-categorization/dashboard
curl -s http://localhost:8080/internal/customer-categorization/rewards/ABC123
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/segment \
  -H 'Content-Type: application/json' \
  -d '{"segmentId":"Constructores"}'
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/cross-sell \
  -H 'Content-Type: application/json' \
  -d '{"segmentId":"Constructores"}'
```
