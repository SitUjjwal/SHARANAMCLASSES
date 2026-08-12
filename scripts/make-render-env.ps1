# Builds a Render-ready .env (gitignored) from apps/api/.env — never prints secret values.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$src = Join-Path $root 'apps\api\.env'
$out = Join-Path $root 'apps\api\.env.render.local'

if (-not (Test-Path $src)) { throw "Missing $src" }

$map = @{}
Get-Content $src | ForEach-Object {
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

$overrides = @{
  NODE_ENV        = 'production'
  APP_ENV         = 'production'
  LOG_TO_CONSOLE  = 'true'
  LOG_LEVEL       = 'info'
  API_BASE_URL    = 'https://sharanamclasses.onrender.com'
  CORS_ORIGINS    = 'https://sharanamclasses.com'
  ADMIN_EMAILS    = 'ujjwalsharan82@gmail.com'
  JWT_EXPIRES_IN  = '7d'
}
foreach ($k in $overrides.Keys) { $map[$k] = $overrides[$k] }

$required = @(
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
)

$missing = @()
foreach ($k in $required) {
  if (-not $map.ContainsKey($k) -or [string]::IsNullOrWhiteSpace([string]$map[$k])) {
    $missing += $k
  }
}
if ($missing.Count) {
  throw ("Missing keys in apps/api/.env: " + ($missing -join ', '))
}

if ($map['JWT_SECRET'] -eq 'dev-only-change-me' -or $map['JWT_SECRET'].Length -lt 32) {
  throw 'JWT_SECRET must be 32+ chars and not the default'
}
if (-not ($map['SUPABASE_URL'] -match 'supabase\.co')) {
  throw 'SUPABASE_URL looks invalid'
}
if ($map['SUPABASE_SERVICE_ROLE_KEY'].Length -lt 100) {
  Write-Warning 'SUPABASE_SERVICE_ROLE_KEY looks short — confirm it is the service_role secret from Supabase (usually a long JWT).'
}

$keys = @(
  'NODE_ENV', 'APP_ENV', 'LOG_TO_CONSOLE', 'LOG_LEVEL',
  'API_BASE_URL', 'CORS_ORIGINS', 'ADMIN_EMAILS',
  'JWT_SECRET', 'JWT_EXPIRES_IN',
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY',
  'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'
)
if ($map.ContainsKey('RAZORPAY_WEBHOOK_SECRET') -and $map['RAZORPAY_WEBHOOK_SECRET']) {
  $keys += 'RAZORPAY_WEBHOOK_SECRET'
}

$lines = foreach ($k in $keys) { "$k=$($map[$k])" }
[System.IO.File]::WriteAllLines($out, $lines)
Write-Host "OK wrote: $out"
Write-Host ("Keys: " + ($keys -join ', '))
Write-Host 'Values not printed. Open this file, Ctrl+A, Ctrl+C, then Render → Environment → Add from .env → paste → Save, rebuild, and deploy.'
