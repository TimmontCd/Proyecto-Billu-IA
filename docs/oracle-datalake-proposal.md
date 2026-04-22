# Propuesta Oracle Datalake MVP

## Objetivo

Definir una base inicial en Oracle para reemplazar la dependencia operativa en
Google Sheets y soportar los slices ya identificados en Billú:

- `001-backend-foundation`
- `002-resumen-clientes`
- `003-categorizacion-clientes`
- correlacion de depositos y cargos

La propuesta busca cubrir primero los dominios que hoy ya usa el sistema en el
legado y que aparecen en la configuracion y servicios actuales:

- maestro de clientes
- saldos mensuales
- transacciones
- tarjetas
- homologacion de comercios

Referencias principales del legado:

- [legacy/src/core/01_Config.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/core/01_Config.gs:87)
- [legacy/src/core/05_Schema.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/core/05_Schema.gs:1)
- [legacy/src/services/MonthlyBalanceSyncService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/MonthlyBalanceSyncService.gs:1)
- [legacy/src/services/CustomerCategorizationService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/CustomerCategorizationService.gs:1)
- [legacy/src/services/AccountsService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/AccountsService.gs:1)
- [legacy/src/services/DepositChargeCorrelationService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/DepositChargeCorrelationService.gs:1)

## Alcance MVP

### Fuentes identificadas

- `MASTER_SPREADSHEET_ID` con hoja `Clientes`
- `MONTHLY_BALANCE_SPREADSHEET_ID` con hoja `Cuentas`
- tres fuentes de transacciones para enero, febrero y marzo 2026
- `CARDS_SUMMARY_SPREADSHEET_ID`
- `MERCHANT_HOMOLOGATION_SPREADSHEET_ID`

Configuracion actual:

- [legacy/src/core/01_Config.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/core/01_Config.gs:87)
- [legacy/src/core/01_Config.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/core/01_Config.gs:312)
- [legacy/src/core/01_Config.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/core/01_Config.gs:340)

### Casos que debe soportar

- resumen ejecutivo de clientes y productos
- historico / first30
- cobertura de tarjetas
- categorizacion por cliente y por segmento
- exportables de segmento y venta cruzada
- correlacion de depositos y cargos

## Modelo recomendado

### Capa 1: Landing / Bronze

Guardar la fuente cruda tal como llega, con trazabilidad de archivo, lote e
ingestion. No se recomienda consultar negocio directamente aqui.

Tablas:

- `DLK_BRONZE_CUSTOMER_RAW`
- `DLK_BRONZE_MONTHLY_BALANCE_RAW`
- `DLK_BRONZE_TRANSACTION_RAW`
- `DLK_BRONZE_CARD_RAW`
- `DLK_BRONZE_MERCHANT_RAW`

### Capa 2: Canonica / Silver

Modelo limpio y normalizado que ya puede consumir el backend Java.

Tablas MVP:

- `DLK_CUSTOMER`
- `DLK_CUSTOMER_PRODUCT_SNAPSHOT`
- `DLK_MONTHLY_BALANCE`
- `DLK_TRANSACTION`
- `DLK_CARD_STATUS`
- `DLK_MERCHANT_HOMOLOGATION`
- `DLK_CUSTOMER_SEGMENT_SNAPSHOT`

### Capa 3: Consumo / Gold

No es obligatorio arrancar con tablas fisicas. Puede resolverse con vistas o
materialized views despues.

Sugeridas:

- `VW_CUSTOMER_SUMMARY_OVERVIEW`
- `VW_CUSTOMER_FIRST30`
- `VW_CUSTOMER_CARD_COVERAGE`
- `VW_CUSTOMER_CATEGORIZATION`
- `VW_DEPOSIT_CHARGE_CORRELATION`

## Tablas MVP

### 1. `DLK_CUSTOMER`

Dimension base del cliente. Su llave natural operativa es `REWARDS_ID`.

Campos minimos:

- `REWARDS_ID`
- `ACCOUNT_STATUS`
- `OPENING_DATE`
- `STATE_NAME`
- `MUNICIPALITY_NAME`
- `GENDER_CODE`
- `BIRTH_DATE`
- `AGE_YEARS`
- `SOURCE_SYSTEM`
- `SOURCE_SPREADSHEET_ID`
- `SOURCE_SHEET_NAME`
- `INGESTION_BATCH_ID`
- `EFFECTIVE_AT`

### 2. `DLK_CUSTOMER_PRODUCT_SNAPSHOT`

Representa los productos activos por cliente y su saldo puntual para un corte.

Campos minimos:

- `REWARDS_ID`
- `SNAPSHOT_DATE`
- `PRODUCT_CODE`
- `PRODUCT_LABEL`
- `PRODUCT_ACTIVE_FLAG`
- `PRODUCT_BALANCE_AMOUNT`
- `ACCOUNT_STATUS`
- `SOURCE_SYSTEM`
- `INGESTION_BATCH_ID`

Esto sale directo del armado de `productFlags`, `productBalances` y
`productLabels` en
[MonthlyBalanceSyncService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/MonthlyBalanceSyncService.gs:71).

### 3. `DLK_MONTHLY_BALANCE`

Hecho mensual por cliente para construir `SALDO PROMEDIO 3 MESES`.

Campos minimos:

- `REWARDS_ID`
- `BALANCE_MONTH`
- `BALANCE_AMOUNT`
- `SOURCE_SYSTEM`
- `SOURCE_SPREADSHEET_ID`
- `SOURCE_SHEET_NAME`
- `INGESTION_BATCH_ID`
- `LOADED_AT`

Opcional pero muy util:

- `IS_IMPUTED_FLAG`
- `MONTH_HEADER_LABEL`

### 4. `DLK_TRANSACTION`

Hecho granular de movimientos.

Campos minimos:

- `REWARDS_ID`
- `TRANSACTION_DATE`
- `ABONO_AMOUNT`
- `CARGO_AMOUNT`
- `DESCRIPTION_TEXT`
- `DESCRIPTION_CODE_TEXT`
- `OPERATOR_TEXT`
- `ECOMMERCE_FLAG`
- `PHYSICAL_STORE_FLAG`
- `MERCHANT_CATEGORY_CODE`
- `MERCHANT_CATEGORY_DESC`
- `SOURCE_MONTH`
- `SOURCE_FILE_LABEL`
- `SOURCE_SPREADSHEET_ID`
- `SOURCE_SHEET_ID`
- `INGESTION_BATCH_ID`

Esto cubre lo que hoy buscan `AccountsService` y
`CustomerCategorizationService` para perfil transaccional y conteos:

- [legacy/src/services/AccountsService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/AccountsService.gs:1)
- [legacy/src/services/CustomerCategorizationService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/CustomerCategorizationService.gs:26)

### 5. `DLK_CARD_STATUS`

Estado de tarjetas fisicas y digitales por cliente.

Campos minimos:

- `REWARDS_ID`
- `CUT_DATE`
- `HAS_PHYSICAL_CARD_FLAG`
- `HAS_DIGITAL_CARD_FLAG`
- `HAS_RECENT_PHYSICAL_USAGE_FLAG`
- `HAS_RECENT_DIGITAL_USAGE_FLAG`
- `CARD_STATUS`
- `SOURCE_SYSTEM`
- `INGESTION_BATCH_ID`

### 6. `DLK_MERCHANT_HOMOLOGATION`

Tabla de referencia para clasificar descripciones de comercio y operador.

Campos minimos:

- `RAW_DESCRIPTION_TEXT`
- `RAW_OPERATOR_TEXT`
- `MERCHANT_CATEGORY_CODE`
- `MERCHANT_CATEGORY_LABEL`
- `MERCHANT_GROUP_LABEL`
- `ACTIVE_FLAG`
- `SOURCE_SYSTEM`
- `INGESTION_BATCH_ID`

### 7. `DLK_CUSTOMER_SEGMENT_SNAPSHOT`

Tabla derivada para no recalcular categorizacion en cada consulta.

Campos minimos:

- `REWARDS_ID`
- `SNAPSHOT_DATE`
- `BALANCE_AVG_3M`
- `CURRENT_BALANCE_AMOUNT`
- `TOTAL_TRANSACTIONS`
- `ABONOS_COUNT_30D`
- `CARGOS_COUNT_30D`
- `TENURE_DAYS`
- `SEGMENT_ID`
- `SEGMENT_LABEL`
- `SEGMENT_RULE_TEXT`
- `RECOMMENDED_CARD`
- `RECOMMENDED_CARD_BENEFITS`
- `TRANSACTION_PROFILE`
- `MISSING_PRODUCTS_TEXT`
- `SUGGESTED_CAMPAIGN`
- `INGESTION_BATCH_ID`

Esto cubre exactamente el payload exportable que hoy construye el legado:

- [legacy/src/services/CustomerCategorizationService.gs](/Users/martinmercado/dev/Proyecto-Billu-IA/legacy/src/services/CustomerCategorizationService.gs:258)

## Reglas de diseño

- `REWARDS_ID` debe ser la llave de negocio transversal.
- Los importadores deben guardar `INGESTION_BATCH_ID`, `SOURCE_SPREADSHEET_ID`,
  `SOURCE_SHEET_NAME` y `LOADED_AT`.
- Las tablas de hechos deben ser append-only; las tablas snapshot pueden usar
  `MERGE`.
- No guardar importes formateados con moneda. Guardar montos numericos.
- No usar encabezados de Google Sheets como contrato final; normalizarlos en la
  capa Oracle.

## Orden recomendado de implementacion

1. `DLK_CUSTOMER`
2. `DLK_MONTHLY_BALANCE`
3. `DLK_TRANSACTION`
4. `DLK_CUSTOMER_PRODUCT_SNAPSHOT`
5. `DLK_CARD_STATUS`
6. `DLK_MERCHANT_HOMOLOGATION`
7. `DLK_CUSTOMER_SEGMENT_SNAPSHOT`

## Siguiente paso recomendado

Implementar primero el DDL de las tablas MVP y despues un proceso ETL simple:

1. carga cruda desde Sheets o CSV a Bronze
2. normalizacion a Silver
3. snapshot diario de segmentacion

El archivo inicial de DDL queda en:

- [backend/config/oracle/billu_datalake_mvp.sql](/Users/martinmercado/dev/Proyecto-Billu-IA/backend/config/oracle/billu_datalake_mvp.sql:1)
