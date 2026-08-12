# Sets Render env vars for SHARANAMCLASSES-1 via API.
# Requires: $env:RENDER_API_KEY and optionally $env:RENDER_SERVICE_ID
# Does not print secret values.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not $env:RENDER_API_KEY) {
  Write-Host 'Missing RENDER_API_KEY.'
  Write-Host '1) Render Dashboard → Account Settings → API Keys → Create'
  Write-Host '2) PowerShell: $env:RENDER_API_KEY = "rnd_..."'
  Write-Host '3) Re-run this script'
  exit 1
}

function Read-EnvFile([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $i = $line.IndexOf('=')
    if ($i -lt 1) { return }
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1)
    if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
      $v = $v.Substring(1, $v.Length - 2)
    }
    $map[$k] = $v
  }
  return $map
}

$headers = @{
  Authorization = "Bearer $($env:RENDER_API_KEY)"
  Accept        = 'application/json'
  'Content-Type' = 'application/json'
}

$serviceId = $env:RENDER_SERVICE_ID
if (-not $serviceId) {
  # Known from dashboard screenshot earlier
  $serviceId = 'srv-d9rp5de7bikc738clspg'
}
Write-Host "Using serviceId=$serviceId"

$api = Read-EnvFile (Join-Path $root 'apps\api\.env')
$cors = 'https://sharanamclasses.com,https://sharanamclasses-admin-ttf4.vercel.app'
$adminEmails = if ($api['ADMIN_EMAILS']) { $api['ADMIN_EMAILS'] } else { 'ujjwalsharan82@gmail.com' }

$updates = @{
  CORS_ORIGINS  = $cors
  ADMIN_EMAILS  = $adminEmails
  API_BASE_URL  = 'https://sharanamclasses-1.onrender.com'
  APP_ENV       = 'production'
  NODE_ENV      = 'production'
  LOG_TO_CONSOLE = 'true'
}

foreach ($k in $updates.Keys) {
  $body = @{ value = $updates[$k] } | ConvertTo-Json
  $uri = "https://api.render.com/v1/services/$serviceId/env-vars/$k"
  try {
    Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body $body | Out-Null
    Write-Host "OK set $k"
  } catch {
    Write-Host "FAIL $k : $($_.Exception.Message)"
  }
}

Write-Host 'Triggering deploy...'
try {
  Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Body '{}' | Out-Null
  Write-Host 'Deploy triggered'
} catch {
  Write-Host "Deploy trigger failed (env may still be saved): $($_.Exception.Message)"
  Write-Host 'Use Render → Manual Deploy if needed.'
}
