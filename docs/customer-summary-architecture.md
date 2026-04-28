# Customer Summary Architecture

## Purpose

Document the architecture of the `Resumen de Clientes` slice on top of the
institutional foundation and leave clear extension points for Oracle and the
frontend.

## Slice boundaries

- `overview`: KPIs, executive summary and product distribution
- `historical`: historical openings by controlled range
- `first30`: First 30 operational cohorts
- `cards/coverage`: card coverage and recent usage
- `exports/*`: controlled and auditable exports

## Layering

- `com.billu.accounts.domain`: slice projections and export result models
- `com.billu.accounts.application`: gateways, validators, use cases and audit logic
- `com.billu.accounts.infrastructure.mock`: versioned datasets for `local-mock`
- `com.billu.accounts.infrastructure.legacy`: temporary read-only fallback
- `com.billu.accounts.infrastructure.oracle`: explicit boundary for persistence
- `com.billu.accounts.web`: JAX-RS controllers, HTTP DTOs, wiring and metrics

## Source selection

Source selection lives in
`backend/src/main/java/com/billu/accounts/web/CustomerSummaryComponentFactory.java`
and follows this priority:

1. `local-mock`
2. `legacy-bridge`
3. `oracle`

## Validation strategy

- `CustomerSummaryRequestValidator` hardens dates and monthly filters
- `CustomerSummaryMappingValidator` ensures minimum contract shape before response
- controllers keep stable HTTP contracts even when the source changes

## Observability

- audit per query and per export in `CustomerSummaryAuditService`
- consumption metrics in `CustomerSummaryMetricsPublisher`
- `correlationId` propagated from web to use cases and export flows

## Frontend readiness

The backend is ready for a first institutional frontend against:

- `/internal/customer-summary/overview`
- `/internal/customer-summary/historical`
- `/internal/customer-summary/first30`
- `/internal/customer-summary/cards/coverage`
- `/internal/customer-summary/exports/*`

The recommended first frontend rollout uses `local-mock`, then validates
coexistence with `legacy-bridge`.
