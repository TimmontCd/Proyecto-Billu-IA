# Customer Summary Runbook

## Purpose

Operate the `Resumen de Clientes` slice during its initial coexistence with the
legacy domain and prepare the backend for the first institutional frontend.

## Scope

- executive summary of accounts and products
- historical and First 30 views
- card coverage and controlled exports

## Current operational mode

- `local-mock`: controlled source for functional validation
- `legacy read-only`: temporary fallback while Oracle projections are incomplete
- `oracle`: target source for the institutional slice

## Oracle readiness note

- `overview` already has a JDBC Oracle adapter wired through `local-oracle`.
- `historical`, `first30`, `cards/coverage` and summary exports still remain on
  placeholder Oracle boundaries until their queries are implemented.
- Without `BILLU_ORACLE_URL`, `BILLU_ORACLE_USER` and `BILLU_ORACLE_PASSWORD`,
  `local-oracle` must fail fast instead of degrading silently.

## Rollback trigger

- any main endpoint breaks contract
- the selected source stops returning valid data without controlled degradation
- audit evidence for actor, environment or correlation is missing

## Operational checks

- confirm the `environment` field matches the active profile
- confirm `correlationId` is present in overview, historical, first30, coverage and exports
- verify audit events exist for read flows and export flows
- confirm `legacy-bridge` is only used as a temporary fallback

## Recommended rollout

1. Validate backend packaging with `JDK 8 + Maven`.
2. Run smoke requests in `local-mock`.
3. Point the first frontend version to `local-mock`.
4. Validate basic parity before enabling `legacy-bridge`.

## Frontend handoff

The frontend can safely start against these endpoints:

- `/internal/customer-summary/overview`
- `/internal/customer-summary/historical`
- `/internal/customer-summary/first30`
- `/internal/customer-summary/cards/coverage`
- `/internal/customer-summary/exports/*`

The recommended first screen is `overview`, followed by tabs or sections for
historical, First 30 and card coverage.
