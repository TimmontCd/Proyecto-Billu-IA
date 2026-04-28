# Billu data catalog mapping

`catalogo_datos_billum.csv` se carga como metadata en `DLK_DATA_CATALOG_FIELD`.
Cada renglon conserva documento, hoja, dominio, entidad sugerida, grano, campo,
tipo, clasificacion, regla de calidad y tabla/columna destino.

| Entidad sugerida | Tabla destino |
| --- | --- |
| `cliente_master` | `DLK_CUSTOMER` |
| `cliente_master.PRODUCTO DE LA CUENTA` | `DLK_CUSTOMER_PRODUCT_SNAPSHOT` |
| `cuenta_saldos_mensuales` | `DLK_MONTHLY_BALANCE` |
| `tarjeta_cliente` | `DLK_CARD_STATUS` |
| `metas_ahorro` | `DLK_SAVINGS_GOAL` |
| `tdc_cliente` | `DLK_CREDIT_CARD_ACCOUNT` |
| `transacciones_enero`, `transacciones_febrero`, `transacciones_marzo` | `DLK_TRANSACTION` |
| `meta_cuentas_descargadas`, `meta_android`, `meta_ios` | `DLK_MARKETING_AD_PERFORMANCE` |
| `meta_demografia` | `DLK_MARKETING_DEMOGRAPHIC_PERFORMANCE` |
| `campana_billuweekend` | `DLK_CAMPAIGN_CUSTOMER` |

## Scripts

1. Crear estructura Oracle: `backend/config/oracle/billu_datalake_mvp.sql`
2. Cargar metadata del catalogo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File backend/scripts/generate-data-catalog-sql.ps1 `
  -CatalogCsv "C:\Users\PouPou\Downloads\catalogo_datos_billum.csv"
```

3. Ejecutar en Oracle el SQL generado: `backend/config/oracle/billu_data_catalog_seed.sql`

El generador debe dejar todos los campos en `MAPPED`; si aparece
`NEEDS_REVIEW`, falta confirmar una columna destino antes de usarlo en cargas
productivas.
