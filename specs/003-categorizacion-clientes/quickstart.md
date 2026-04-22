# Quickstart: Categorizacion de Clientes

## Purpose

Validar localmente el slice institucional de Categorizacion de Clientes con
dashboard, detalle y exportables.

## Prerequisites

- foundation compilando con `JDK 8` y `Maven`
- endpoints internos de plataforma disponibles
- datasets mockeados del slice en `foundation-infrastructure-mock`

## Build base

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk1.8.0_202'
$env:PATH='C:\Program Files\Java\jdk1.8.0_202\bin;C:\Users\PouPou\AppData\Local\Programs\Apache\Maven\apache-maven-3.9.14\bin;' + $env:PATH
mvn -f backend/pom.xml -DskipTests package
```

## Smoke esperado

```bash
curl -s http://localhost:8080/internal/customer-categorization/dashboard
curl -s http://localhost:8080/internal/customer-categorization/rewards/ABC123
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/segment
curl -s -X POST http://localhost:8080/internal/customer-categorization/exports/cross-sell
```
