# Quickstart: Resumen de Clientes

## Purpose

Validate locally the first post-foundation functional slice and leave it ready
for an initial institutional frontend.

## Prerequisites

- foundation builds with `JDK 8` and `Maven`
- internal platform endpoints are available
- mock datasets exist in `foundation-infrastructure-mock`
- legacy access remains read-only during coexistence checks

## 1. Build base

```bash
mvn -f backend/pom.xml -DskipTests package
```

Validated command set used in this iteration:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk1.8.0_202'
$env:PATH='C:\Program Files\Java\jdk1.8.0_202\bin;C:\Users\PouPou\AppData\Local\Programs\Apache\Maven\apache-maven-3.9.14\bin;' + $env:PATH
mvn -f backend/pom.xml -DskipTests package
```

## 2. Local-mock validation

```bash
mvn -f backend/pom.xml -pl foundation-web -am -P local-mock -DskipTests package
```

Expected smoke requests:

```bash
curl -s http://localhost:8080/internal/customer-summary/overview
curl -s "http://localhost:8080/internal/customer-summary/historical?startDate=2026-01-01&endDate=2026-03-31"
curl -s http://localhost:8080/internal/customer-summary/first30
curl -s http://localhost:8080/internal/customer-summary/cards/coverage
curl -s -X POST http://localhost:8080/internal/customer-summary/exports/historical-month \
  -H "Content-Type: application/json" \
  -d '{"selectedYear":2026,"selectedMonth":1}'
curl -s -X POST http://localhost:8080/internal/customer-summary/exports/first30-month \
  -H "Content-Type: application/json" \
  -d '{"selectedYear":2026,"selectedMonth":1}'
curl -s -X POST http://localhost:8080/internal/customer-summary/exports/card-coverage
```

Expected result:

- stable HTTP contracts
- `correlationId` present
- `environment=local-mock`
- no dependency on Oracle or Apps Script runtime
- overview, historical, first30, coverage and exports stay consistent

## 3. Local-oracle / coexistence validation

```bash
mvn -f backend/pom.xml -pl foundation-web -am -P local-oracle -DskipTests package
```

Additional validation:

- if Oracle projection is still missing, the legacy bridge must be explicit in observability
- exports and queries must keep the same contract even if the source changes

## 4. Rollback criteria

- repeatable contract failures
- temporary dependency unavailable without controlled degradation
- missing audit evidence for queries or exports
- critical mismatch against legacy KPIs or cohorts

## 5. Exit criteria

- overview can be demonstrated without the legacy UI
- historical and First 30 can be validated by contract
- card coverage and exports leave auditable traceability
- the Oracle migration path is documented

## 6. Next practical step

After backend validation, the next recommended step is to run a first frontend
version against these endpoints in `local-mock`.
