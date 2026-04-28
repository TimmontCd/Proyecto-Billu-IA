param(
  [int]$Port = 8080,
  [string]$Environment = "local-oracle",
  [string]$JavaHome = "C:\Program Files\Java\jdk1.8.0_202",
  [string]$EnvFile = ".env",
  [int]$NgrokWebPort = 4040,
  [switch]$SkipNgrok,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $backendDir
$envPath = Join-Path $repoRoot $EnvFile

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

Import-DotEnv -Path $envPath

if (Test-Path -LiteralPath $JavaHome) {
  $env:JAVA_HOME = $JavaHome
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

if ([string]::IsNullOrWhiteSpace($env:BILLU_ORACLE_URL)) {
  $env:BILLU_ORACLE_URL = "jdbc:oracle:thin:@//localhost:1521/xepdb1"
}

$missing = @()
if ([string]::IsNullOrWhiteSpace($env:BILLU_ORACLE_USER)) {
  $missing += "BILLU_ORACLE_USER"
}
if ([string]::IsNullOrWhiteSpace($env:BILLU_ORACLE_PASSWORD)) {
  $missing += "BILLU_ORACLE_PASSWORD"
}

if ($missing.Count -gt 0) {
  Write-Error ("Faltan variables de Oracle: " + ($missing -join ", ") + ". Configuralas en esta terminal antes de correr el script.")
}

$mavenArgs = @(
  "-f", "backend/pom.xml",
  "-DskipTests",
  "-Dspring-boot.run.jvmArguments=-Dbillu.environment=$Environment",
  "-Dspring-boot.run.arguments=--server.port=$Port",
  "spring-boot:run"
)

function Get-NgrokTunnel {
  param(
    [int]$ApplicationPort,
    [int]$WebPort
  )

  try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:$WebPort/api/tunnels" -TimeoutSec 2
    return $response.tunnels |
      Where-Object {
        $_.proto -eq "https" -and
        ($_.config.addr -eq "http://localhost:$ApplicationPort" -or
          $_.config.addr -eq "http://127.0.0.1:$ApplicationPort")
      } |
      Select-Object -First 1
  } catch {
    return $null
  }
}

function Start-NgrokTunnel {
  param(
    [int]$ApplicationPort,
    [int]$WebPort,
    [string]$BackendDirectory
  )

  if ($SkipNgrok) {
    Write-Host "Ngrok omitido por parametro -SkipNgrok."
    return $null
  }

  $existingTunnel = Get-NgrokTunnel -ApplicationPort $ApplicationPort -WebPort $WebPort
  if ($existingTunnel) {
    Write-Host "Ngrok ya esta activo: $($existingTunnel.public_url)"
    return $null
  }

  $ngrokCommand = Get-Command ngrok -ErrorAction SilentlyContinue
  if (-not $ngrokCommand) {
    Write-Warning "No encontre ngrok en PATH. La app arrancara solo localmente."
    return $null
  }

  $logDir = Join-Path $BackendDirectory "target\ngrok"
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $stdoutLog = Join-Path $logDir "ngrok-$ApplicationPort.out.log"
  $stderrLog = Join-Path $logDir "ngrok-$ApplicationPort.err.log"
  Remove-Item -LiteralPath $stdoutLog, $stderrLog -ErrorAction SilentlyContinue

  $ngrokArgs = @(
    "http",
    "$ApplicationPort",
    "--log",
    "stdout",
    "--web-addr",
    "127.0.0.1:$WebPort"
  )

  Write-Host "Arrancando ngrok para http://localhost:$ApplicationPort ..."
  $process = Start-Process -FilePath $ngrokCommand.Source `
    -ArgumentList $ngrokArgs `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  $tunnel = $null
  for ($attempt = 0; $attempt -lt 15; $attempt += 1) {
    Start-Sleep -Seconds 1
    $tunnel = Get-NgrokTunnel -ApplicationPort $ApplicationPort -WebPort $WebPort
    if ($tunnel) {
      break
    }
  }

  if ($tunnel) {
    Write-Host "Ngrok publico: $($tunnel.public_url)"
  } else {
    Write-Warning "Ngrok arranco, pero no pude leer la URL publica. Revisa http://127.0.0.1:$WebPort o $stdoutLog"
  }

  return $process
}

Write-Host "Arrancando Billu Spring Boot en http://localhost:$Port/ con perfil $Environment"
Write-Host "Oracle URL: $env:BILLU_ORACLE_URL"

if ($DryRun) {
  Write-Host "Dry run. Comando:"
  if (-not $SkipNgrok) {
    Write-Host "ngrok http $Port --log stdout --web-addr 127.0.0.1:$NgrokWebPort"
  }
  Write-Host ("mvn " + ($mavenArgs -join " "))
  exit 0
}

$startedNgrok = $null
Push-Location $repoRoot
try {
  $startedNgrok = Start-NgrokTunnel `
    -ApplicationPort $Port `
    -WebPort $NgrokWebPort `
    -BackendDirectory $backendDir
  & mvn @mavenArgs
} finally {
  Pop-Location
  if ($startedNgrok -and -not $startedNgrok.HasExited) {
    Write-Host "Deteniendo ngrok iniciado por este script..."
    Stop-Process -Id $startedNgrok.Id -Force
  }
}
