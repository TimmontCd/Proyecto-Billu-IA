param(
  [string]$OracleUrl,
  [string]$AdminUser,
  [string]$AdminPassword,
  [string]$AppUser,
  [string]$AppPassword,
  [string]$EnvFile = ".env",
  [string]$JavaHome = "C:\Program Files\Java\jdk1.8.0_202",
  [switch]$NoReset,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $backendDir
$envPath = Join-Path $repoRoot $EnvFile
$targetDir = Join-Path $backendDir "target"
$classpathFile = Join-Path $targetDir "local-oracle-classpath.txt"
$sqlDir = Join-Path $backendDir "config\oracle"

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
      return
    }
    if ($line -notmatch "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$") {
      return
    }

    $name = $Matches[1]
    $value = $Matches[2].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Coalesce-Value {
  param([string[]]$Values)

  foreach ($value in $Values) {
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value
    }
  }
  return $null
}

function Invoke-Checked {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
  }
}

Import-DotEnv -Path $envPath

if (Test-Path -LiteralPath $JavaHome) {
  $env:JAVA_HOME = $JavaHome
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

$OracleUrl = Coalesce-Value @(
  $OracleUrl,
  $env:BILLU_ORACLE_ADMIN_URL,
  $env:BILLU_ORACLE_URL,
  "jdbc:oracle:thin:@//localhost:1521/xepdb1"
)
$AdminUser = Coalesce-Value @($AdminUser, $env:BILLU_ORACLE_ADMIN_USER, "SYSTEM")
$AdminPassword = Coalesce-Value @($AdminPassword, $env:BILLU_ORACLE_ADMIN_PASSWORD, "password")
$AppUser = Coalesce-Value @($AppUser, $env:BILLU_ORACLE_USER, "BILLU_READ")
$AppPassword = Coalesce-Value @($AppPassword, $env:BILLU_ORACLE_PASSWORD, "BILLU_READ")

if (-not (Test-Path -LiteralPath $sqlDir)) {
  throw "No existe el directorio SQL: $sqlDir"
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

if (-not $SkipBuild) {
  Write-Host "Compilando backend y herramienta de bootstrap..."
  Invoke-Checked "mvn" @("-f", "backend/pom.xml", "-DskipTests", "package")

  Write-Host "Resolviendo classpath runtime..."
  Invoke-Checked "mvn" @(
    "-f", "backend/pom.xml",
    "-DincludeScope=runtime",
    "-Dmdep.outputFile=$classpathFile",
    "dependency:build-classpath"
  )
}

if (-not (Test-Path -LiteralPath $classpathFile)) {
  throw "No existe el classpath runtime: $classpathFile. Ejecuta sin -SkipBuild para generarlo."
}

$runtimeClasspath = Get-Content -LiteralPath $classpathFile -Raw
$bootstrapClasspath = (Join-Path $targetDir "classes") + ";" + $runtimeClasspath.Trim()
$javaExe = "java"
if (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
  $candidate = Join-Path $env:JAVA_HOME "bin\java.exe"
  if (Test-Path -LiteralPath $candidate) {
    $javaExe = $candidate
  }
}

Write-Host "Creando esquema local Oracle y sembrando datos dummy..."
Write-Host "  URL: $OracleUrl"
Write-Host "  Admin: $AdminUser"
Write-Host "  App user: $AppUser"
Write-Host "  Reset DLK_*: $(-not $NoReset)"

$bootstrapArgs = @(
  "-cp", $bootstrapClasspath,
  "com.billu.foundation.tools.OracleLocalBootstrap",
  "--url", $OracleUrl,
  "--admin-user", $AdminUser,
  "--admin-password", $AdminPassword,
  "--app-user", $AppUser,
  "--app-password", $AppPassword,
  "--sql-dir", $sqlDir,
  "--reset", ([string](-not $NoReset)).ToLowerInvariant()
)

Invoke-Checked $javaExe $bootstrapArgs

Write-Host ""
Write-Host "Listo. Para correr la app local-oracle usa estas variables en .env:"
Write-Host "BILLU_ORACLE_URL=$OracleUrl"
Write-Host "BILLU_ORACLE_USER=$AppUser"
Write-Host "BILLU_ORACLE_PASSWORD=<password de $AppUser>"
