param(
  [int]$Port = 8090,
  [string]$BackendBaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "Customer Summary preview running at http://localhost:$Port/"
Write-Host "Proxying /internal/* to $BackendBaseUrl"

function Get-ContentType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".js" { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

function Write-Bytes($response, [byte[]]$bytes, [string]$contentType, [int]$statusCode = 200) {
  $response.StatusCode = $statusCode
  $response.ContentType = $contentType
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.OutputStream.Close()
}

function Proxy-Request($context) {
  $request = $context.Request
  $response = $context.Response
  $targetUrl = $BackendBaseUrl.TrimEnd("/") + $request.RawUrl
  $proxyRequest = [System.Net.HttpWebRequest]::Create($targetUrl)
  $proxyRequest.Method = $request.HttpMethod
  $proxyRequest.Accept = $request.Accept
  $proxyRequest.ContentType = $request.ContentType

  if ($request.HasEntityBody) {
    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
    $body = $reader.ReadToEnd()
    $reader.Close()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $proxyRequest.ContentLength = $bytes.Length
    $requestStream = $proxyRequest.GetRequestStream()
    $requestStream.Write($bytes, 0, $bytes.Length)
    $requestStream.Close()
  }

  try {
    $proxyResponse = $proxyRequest.GetResponse()
    $stream = $proxyResponse.GetResponseStream()
    $memory = New-Object System.IO.MemoryStream
    $stream.CopyTo($memory)
    $stream.Close()
    $proxyResponse.Close()
    Write-Bytes $response $memory.ToArray() "application/json; charset=utf-8" 200
  } catch [System.Net.WebException] {
    $message = @{ message = "Backend unavailable at $BackendBaseUrl"; details = $_.Exception.Message } | ConvertTo-Json
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
    Write-Bytes $response $bytes "application/json; charset=utf-8" 502
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = $context.Request.Url.AbsolutePath

    if ($requestPath.StartsWith("/internal/")) {
      Proxy-Request $context
      continue
    }

    $relativePath = if ($requestPath -eq "/") { "index.html" } else { $requestPath.TrimStart("/") }
    $filePath = Join-Path $scriptRoot $relativePath

    if (-not (Test-Path $filePath -PathType Leaf)) {
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      Write-Bytes $context.Response $notFound "text/plain; charset=utf-8" 404
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    Write-Bytes $context.Response $bytes (Get-ContentType $filePath)
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
