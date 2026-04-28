param(
  [Parameter(Mandatory = $true)]
  [string]$CatalogCsv,
  [string]$Output = ""
)

$ErrorActionPreference = "Stop"
$CatalogVersion = "catalogo_datos_billum"

if ([string]::IsNullOrWhiteSpace($Output)) {
  $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
  $Output = Join-Path $scriptRoot "..\config\oracle\billu_data_catalog_seed.sql"
}

function FieldMap {
  param([hashtable]$Values)
  return $Values
}

$adPerformanceFields = FieldMap @{
  "Inicio del informe" = "REPORT_START_TEXT"
  "Campaña" = "CAMPAIGN_NAME"
  "Campana" = "CAMPAIGN_NAME"
  "Conjunto de anuncios" = "AD_SET_NAME"
  "Nombre del anuncio" = "AD_NAME"
  "Resultados" = "RESULTS_COUNT"
  "Indicador de resultado" = "RESULT_INDICATOR"
  "Costo por resultados" = "COST_PER_RESULT_AMOUNT"
  "Importe gastado (MXN)" = "SPEND_AMOUNT_MXN"
  "Impresiones" = "IMPRESSIONS_COUNT"
  "Alcance" = "REACH_COUNT"
  "Nombre del conjunto de anuncios" = "AD_SET_DISPLAY_NAME"
  "Clics (todos)" = "ALL_CLICKS_COUNT"
  "CTR (todos)" = "ALL_CTR_RATE"
  "Clics en el enlace" = "LINK_CLICKS_COUNT"
  "Activaciones de la app" = "APP_ACTIVATIONS_TEXT"
  "Instalaciones de la app" = "APP_INSTALLS_TEXT"
  "CUENTA_CREADA" = "CREATED_ACCOUNT_TEXT"
  "Costo por Instalación" = "COST_PER_INSTALL_AMOUNT"
  "Costo por Instalacion" = "COST_PER_INSTALL_AMOUNT"
  "Costo por clic" = "COST_PER_CLICK_AMOUNT"
  "Costo por cuenta creada" = "COST_PER_CREATED_ACCOUNT_AMOUNT"
  "Costo por impresiones" = "COST_PER_IMPRESSION_AMOUNT"
}

$demographicFields = FieldMap @{
  "Inicio del informe" = "REPORT_START_TEXT"
  "Edad" = "AGE_RANGE_TEXT"
  "Sexo" = "SEX_TEXT"
  "Alcance" = "REACH_COUNT"
  "Impresiones" = "IMPRESSIONS_COUNT"
  "Frecuencia" = "FREQUENCY_RATE"
  "Tipo de resultado" = "RESULT_TYPE_TEXT"
  "Resultados" = "RESULTS_COUNT"
  "Costo por resultado" = "COST_PER_RESULT_AMOUNT"
  "Importe gastado (MXN)" = "SPEND_AMOUNT_MXN"
  "CPM (costo por mil impresiones)" = "CPM_AMOUNT"
  "Clics en el enlace" = "LINK_CLICKS_COUNT"
  "CPC (costo por clic en el enlace)" = "LINK_CPC_AMOUNT"
  "CTR (porcentaje de clics en el enlace)" = "LINK_CTR_RATE"
  "Clics (todos)" = "ALL_CLICKS_COUNT"
  "Instalaciones de la app" = "APP_INSTALLS_TEXT"
}

$transactionFields = FieldMap @{
  "FECHA PROCESO" = "TRANSACTION_DATE"
  "ID RECOMPENSAS" = "REWARDS_ID"
  "DESCRIPCION" = "DESCRIPTION_TEXT"
  "DESCRIPCION DEL CODIGO" = "DESCRIPTION_CODE_TEXT"
  "ABONO" = "ABONO_AMOUNT"
  "CARGO" = "CARGO_AMOUNT"
  "HORA" = "TRANSACTION_TIME_TEXT"
  "OPERADOR" = "OPERATOR_TEXT"
  "BIN" = "CARD_BIN"
  "DESCRIPCION MEDIO DE ACCESO" = "ACCESS_MEDIUM_DESC"
  "ECOMMERCE" = "ECOMMERCE_FLAG"
  "TIENDA_FISICA" = "PHYSICAL_STORE_FLAG"
  "GIRO_COMERCIAL" = "MERCHANT_CATEGORY_CODE"
  "DESCRIPCION_GIRO" = "MERCHANT_CATEGORY_DESC"
}

$entityTargets = @{
  "cliente_master" = @{
    Table = "DLK_CUSTOMER"
    Fields = FieldMap @{
      "ID RECOMPENSAS" = "REWARDS_ID"
      "ESTATUS DE LA CUENTA" = "ACCOUNT_STATUS"
      "FECHA DE APERTURA CUENTA" = "OPENING_DATE"
      "ESTADO" = "STATE_NAME"
      "GENERO" = "GENDER_CODE"
      "FECHA DE NACIMIENTO" = "BIRTH_DATE"
      "SALDO PROMEDIO HOY" = "CURRENT_AVG_BALANCE_AMOUNT"
      "CORREO" = "EMAIL_ADDRESS"
    }
  }
  "tarjeta_cliente" = @{
    Table = "DLK_CARD_STATUS"
    Fields = FieldMap @{
      "ID RECOMPENSAS" = "REWARDS_ID"
      "TARJETA FISICA" = "HAS_PHYSICAL_CARD_FLAG"
      "TARJETA DIGITAL" = "HAS_DIGITAL_CARD_FLAG"
      "ESTATUS DE LA TARJETA" = "CARD_STATUS"
      "TD_RECIENTE_FISICA" = "HAS_RECENT_PHYSICAL_USAGE_FLAG"
      "TD_RECIENTE_DIGITAL" = "HAS_RECENT_DIGITAL_USAGE_FLAG"
      "DISEÑO" = "CARD_DESIGN_LABEL"
      "DISEÃ‘O" = "CARD_DESIGN_LABEL"
      "FECHA DE SOLICITUD TARJETA" = "CARD_REQUEST_DATE"
      "FECHA DE VENCIMIENTO" = "CARD_EXPIRATION_DATE"
      "FECHA_1ER_CARGO" = "FIRST_CHARGE_DATE"
      "DIAS_1ER_CARGO" = "DAYS_TO_FIRST_CHARGE"
      "MESES_1ER_CARGO" = "MONTHS_TO_FIRST_CHARGE"
    }
  }
  "cuenta_saldos_mensuales" = @{
    Table = "DLK_MONTHLY_BALANCE"
    Fields = FieldMap @{
      "ID RECOMPENSAS" = "REWARDS_ID"
      "SALDO PROMEDIO ENERO" = "BALANCE_AMOUNT"
      "SALDO PROMEDIO FEBRERO" = "BALANCE_AMOUNT"
      "SALDO PROMEDIO MARZO" = "BALANCE_AMOUNT"
    }
  }
  "metas_ahorro" = @{
    Table = "DLK_SAVINGS_GOAL"
    Fields = FieldMap @{
      "ID RECOMPENSAS" = "REWARDS_ID"
      "SALDO ACTUAL" = "CURRENT_BALANCE_AMOUNT"
      "FECHA APERTURA INVERSION" = "INVESTMENT_OPENING_DATE"
    }
  }
  "tdc_cliente" = @{
    Table = "DLK_CREDIT_CARD_ACCOUNT"
    Fields = FieldMap @{
      "ID RECOMPENSAS" = "REWARDS_ID"
      "ESTATUS CUENTA BILLÚ" = "BILLU_ACCOUNT_STATUS"
      "ESTATUS CUENTA BILLU" = "BILLU_ACCOUNT_STATUS"
      "TDC" = "TDC_FLAG"
      "PRODUCTO TDC" = "TDC_PRODUCT_LABEL"
      "ESTATUS TDC" = "TDC_STATUS"
    }
  }
  "transacciones_enero" = @{ Table = "DLK_TRANSACTION"; Fields = $transactionFields }
  "transacciones_febrero" = @{ Table = "DLK_TRANSACTION"; Fields = $transactionFields }
  "transacciones_marzo" = @{ Table = "DLK_TRANSACTION"; Fields = $transactionFields }
  "meta_cuentas_descargadas" = @{ Table = "DLK_MARKETING_AD_PERFORMANCE"; Fields = $adPerformanceFields }
  "meta_android" = @{ Table = "DLK_MARKETING_AD_PERFORMANCE"; Fields = $adPerformanceFields }
  "meta_ios" = @{ Table = "DLK_MARKETING_AD_PERFORMANCE"; Fields = $adPerformanceFields }
  "meta_demografia" = @{ Table = "DLK_MARKETING_DEMOGRAPHIC_PERFORMANCE"; Fields = $demographicFields }
  "campana_billuweekend" = @{
    Table = "DLK_CAMPAIGN_CUSTOMER"
    Fields = FieldMap @{
      "ID Recompensas" = "REWARDS_ID"
    }
  }
}

$fieldTargetOverrides = @{
  "cliente_master|PRODUCTO DE LA CUENTA" = @{
    Table = "DLK_CUSTOMER_PRODUCT_SNAPSHOT"
    Column = "PRODUCT_CODE"
    Notes = "Producto normalizado como snapshot por cliente y fecha."
  }
}

function Clean {
  param([object]$Value)
  if ($null -eq $Value) {
    return ""
  }
  return ([string]$Value).Trim()
}

function NormalizeKey {
  param([object]$Value)
  $text = (Clean $Value).Normalize([System.Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($character in $text.ToCharArray()) {
    $category = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($character)
    if ($category -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($character)
    }
  }
  return $builder.ToString().Normalize([System.Text.NormalizationForm]::FormC).ToUpperInvariant()
}

function GetMappedColumn {
  param(
    [hashtable]$Map,
    [string]$Field
  )
  if ($Map.ContainsKey($Field)) {
    return $Map[$Field]
  }
  $normalizedField = NormalizeKey $Field
  foreach ($key in $Map.Keys) {
    if ((NormalizeKey $key) -eq $normalizedField) {
      return $Map[$key]
    }
  }
  return ""
}

function SqlString {
  param([object]$Value)
  $text = Clean $Value
  if ([string]::IsNullOrWhiteSpace($text)) {
    return "NULL"
  }
  return "'" + $text.Replace("'", "''") + "'"
}

function DefaultNote {
  param(
    [string]$Entity,
    [string]$Field,
    [string]$Table,
    [string]$Column
  )
  if ($Table -eq "DLK_MARKETING_AD_PERFORMANCE") {
    return "Tabla comun para reportes Meta por anuncio; SOURCE_ENTITY_NAME separa la hoja origen."
  }
  if ($Table -eq "DLK_MONTHLY_BALANCE" -and $Field.StartsWith("SALDO PROMEDIO ")) {
    return "Campo mensual pivotado a BALANCE_MONTH + BALANCE_AMOUNT."
  }
  if (-not [string]::IsNullOrWhiteSpace($Column)) {
    return ""
  }
  return "Revisar mapeo antes de usar en una carga productiva."
}

function ResolveTarget {
  param([object]$Row)

  $entity = Clean $Row.entidad_sugerida
  $field = Clean $Row.campo
  $overrideKey = "$entity|$field"
  if ($fieldTargetOverrides.ContainsKey($overrideKey)) {
    $override = $fieldTargetOverrides[$overrideKey]
    return [pscustomobject]@{
      Table = $override.Table
      Column = $override.Column
      Status = "MAPPED"
      Notes = $override.Notes
    }
  }

  if (-not $entityTargets.ContainsKey($entity)) {
    return [pscustomobject]@{
      Table = "DLK_UNMAPPED_SOURCE_FIELD"
      Column = ""
      Status = "NEEDS_REVIEW"
      Notes = "Entidad sugerida sin tabla destino confirmada."
    }
  }

  $target = $entityTargets[$entity]
  $column = GetMappedColumn $target.Fields $field
  $status = "MAPPED"
  if ([string]::IsNullOrWhiteSpace($column)) {
    $status = "NEEDS_REVIEW"
  }

  $note = DefaultNote $entity $field $target.Table $column
  if ($entity.StartsWith("transacciones_")) {
    $month = $entity.Replace("transacciones_", "")
    $note = "Fuente mensual consolidada en DLK_TRANSACTION; SOURCE_MONTH conserva $month."
  }

  return [pscustomobject]@{
    Table = $target.Table
    Column = $column
    Status = $status
    Notes = $note
  }
}

if (-not (Test-Path -LiteralPath $CatalogCsv)) {
  throw "No existe el CSV de catalogo: $CatalogCsv"
}

$rows = Import-Csv -Encoding UTF8 -LiteralPath $CatalogCsv
$outputDirectory = Split-Path -Parent $Output
if (-not [string]::IsNullOrWhiteSpace($outputDirectory) -and -not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("-- Billu data catalog seed generated from catalogo_datos_billum.csv")
$lines.Add("WHENEVER SQLERROR EXIT SQL.SQLCODE")
$lines.Add("SET DEFINE OFF")
$lines.Add("DELETE FROM DLK_DATA_CATALOG_FIELD WHERE CATALOG_VERSION = '$CatalogVersion';")
$lines.Add("")

$order = 0
foreach ($row in $rows) {
  $order += 1
  $target = ResolveTarget $row
  $lines.Add("INSERT INTO DLK_DATA_CATALOG_FIELD (")
  $lines.Add("  SOURCE_DOCUMENT_NAME, SOURCE_SHEET_NAME, SOURCE_DOMAIN_NAME,")
  $lines.Add("  SUGGESTED_ENTITY_NAME, SUGGESTED_GRAIN_NAME, SOURCE_FIELD_ORDER,")
  $lines.Add("  SOURCE_FIELD_NAME, SUGGESTED_TYPE_NAME, DATA_CLASSIFICATION_NAME,")
  $lines.Add("  QUALITY_RULE_TEXT, TARGET_TABLE_NAME, TARGET_COLUMN_NAME,")
  $lines.Add("  MAPPING_STATUS, NOTES_TEXT, CATALOG_VERSION")
  $lines.Add(") VALUES (")
  $values = @(
    (SqlString $row.documento),
    (SqlString $row.hoja),
    (SqlString $row.dominio),
    (SqlString $row.entidad_sugerida),
    (SqlString $row.grano_sugerido),
    $order,
    (SqlString $row.campo),
    (SqlString $row.tipo_sugerido),
    (SqlString $row.clasificacion),
    (SqlString $row.regla_calidad_base),
    (SqlString $target.Table),
    (SqlString $target.Column),
    (SqlString $target.Status),
    (SqlString $target.Notes),
    (SqlString $CatalogVersion)
  )
  $lines.Add("  " + ($values -join ", "))
  $lines.Add(");")
}

$lines.Add("")
$lines.Add("COMMIT;")
$lines.Add("EXIT;")

$encoding = New-Object System.Text.UTF8Encoding $false
$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
[System.IO.File]::WriteAllLines($resolvedOutput, $lines, $encoding)

Write-Host "Catalog fields: $($rows.Count)"
Write-Host "SQL file: $Output"
