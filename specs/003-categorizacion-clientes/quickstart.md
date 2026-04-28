# Quickstart: Categorizacion de Clientes

## Purpose

Validar localmente el slice institucional de Categorizacion de Clientes con
dashboard, detalle y exportables.

## Prerequisites

- backend Spring Boot compilando con `JDK 8` y `Maven`
- endpoints internos de plataforma disponibles
- datasets mockeados del slice en `backend/src/main/resources/mock-datasets`
- Spring Boot 2.7.x en `backend/src`
- Oracle local disponible en `localhost:1521` cuando se valide `local-oracle`

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
mvn -f backend/pom.xml -DskipTests \
  -Dspring-boot.run.jvmArguments=-Dbillu.environment=local-mock \
  -Dspring-boot.run.arguments=--server.port=8080 \
  spring-boot:run
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

```powershell
$env:BILLU_ENV='local-oracle'
$env:BILLU_ORACLE_URL='jdbc:oracle:thin:@//localhost:1521/xepdb1'
$env:BILLU_ORACLE_USER='SYSTEM'
$env:BILLU_ORACLE_PASSWORD='***'
mvn -f backend/pom.xml -DskipTests package
.\backend\scripts\run-local-oracle.ps1
```

Comportamiento esperado:

- `local-oracle` ya no debe degradar automaticamente a `legacy`.
- Los endpoints ya cableados a Oracle requieren `BILLU_ORACLE_URL`,
  `BILLU_ORACLE_USER` y `BILLU_ORACLE_PASSWORD`.
- Si faltan credenciales o no existe conectividad real, la respuesta debe
  fallar explicita y tempranamente.
- Con credenciales validas, las respuestas deben reportar `sourceMode: ORACLE`
  y `environment: local-oracle`.

Validacion verificada en esta maquina:

- `GET /internal/customer-categorization/dashboard` devuelve `200`,
  `sourceMode: ORACLE`, `environment: local-oracle` y 4 clientes analizados.
- `GET /internal/customer-categorization/rewards/ABC123` devuelve `200` con
  1 coincidencia Oracle para `ID RECOMPENSAS`.
- `GET /internal/customer-categorization/rewards/NOEXISTE` devuelve `200`
  controlado con `totalMatches: 0`.
- `POST /internal/customer-categorization/exports/segment` devuelve `202`
  con `categorizacion_cliente_constructores.csv` y `rowCount: 1`.
- `POST /internal/customer-categorization/exports/cross-sell` devuelve `202`
  con `venta_cruzada_constructores.csv` y `rowCount: 1`.
- La pantalla institucional se sirve desde
  `http://localhost:8080/customer-categorization/`.

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

## Frontend smoke

```powershell
Invoke-WebRequest http://localhost:8080/customer-categorization/
Invoke-WebRequest http://localhost:8080/customer-categorization/app.js
Invoke-WebRequest http://localhost:8080/customer-categorization/styles.css
Invoke-WebRequest http://localhost:8080/assets/app-shell.js
```
