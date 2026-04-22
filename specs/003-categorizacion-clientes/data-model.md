# Data Model: Categorizacion de Clientes

## CustomerCategorizationDashboard

- `environment`: string
- `sourceMode`: string
- `executiveSummary`: string
- `kpis`: map<string, number>
- `segmentSummary`: list<CustomerSegmentSummary>

## CustomerSegmentSummary

- `segmentId`: string
- `segmentLabel`: string
- `rule`: string
- `recommendedCard`: string
- `clients`: integer
- `sharePct`: number
- `totalBalance`: number
- `averageBalance`: number
- `averageTransactions`: number
- `averageTenureDays`: number
- `missingCreditCardClients`: integer
- `portfolioCompleteClients`: integer
- `topStates`: list<object>
- `productAdoption`: list<object>
- `missingProducts`: list<object>

## RewardsLookupResult

- `environment`: string
- `correlationId`: string
- `rewardsId`: string
- `totalMatches`: integer
- `executiveSummary`: string
- `rows`: list<object>

## CustomerSegmentExportResult

- `exportType`: string
- `segmentId`: string
- `segmentLabel`: string
- `outcome`: string
- `fileName`: string
- `rowCount`: integer
- `correlationId`: string
- `summary`: string

## CustomerCategorizationDataSource

- `environment`: string
- `sourceMode`: string
- `origin`: string
- `lastUpdatedAt`: string
