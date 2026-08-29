$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

function Test-CommandExists {
  param([string]$Command)
  $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-FreePort {
  param(
    [int]$StartPort = 8000,
    [int]$MaxPort = 8099
  )

  for ($port = $StartPort; $port -le $MaxPort; $port++) {
    $listener = $null
    try {
      $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
      $listener.Start()
      return $port
    } catch {
      continue
    } finally {
      if ($listener) {
        $listener.Stop()
      }
    }
  }

  throw "No free port found between $StartPort and $MaxPort."
}

$pythonCommand = $null
if (Test-CommandExists "py") {
  $pythonCommand = "py"
  $pythonArgs = @("-3", "-m", "http.server")
} elseif (Test-CommandExists "python") {
  $pythonCommand = "python"
  $pythonArgs = @("-m", "http.server")
} else {
  Write-Host ""
  Write-Host "Python was not found. Install Python or run a static server manually." -ForegroundColor Red
  Write-Host "https://www.python.org/downloads/" -ForegroundColor Cyan
  exit 1
}

$port = Get-FreePort
$url = "http://localhost:$port"

Write-Host ""
Write-Host "Starting Web Aim Trainer..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Green
Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
Write-Host ""

Start-Process $url
& $pythonCommand @pythonArgs $port
