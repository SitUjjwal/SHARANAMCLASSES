# Deploys apps/admin to Vercel (production).
# Reads VITE_* from apps/admin/.env if present, else apps/api/.env + fixed API URL.
# Does not print secret values.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

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

$adminEnv = Read-EnvFile (Join-Path $root 'apps\admin\.env')
$apiEnv = Read-EnvFile (Join-Path $root 'apps\api\.env')

# Production deploy always uses the live API (ignore local localhost VITE_API_BASE_URL).
$viteApi = 'https://sharanamclasses-1.onrender.com'
$viteUrl = if ($adminEnv['VITE_SUPABASE_URL']) { $adminEnv['VITE_SUPABASE_URL'] } else { $apiEnv['SUPABASE_URL'] }
$viteAnon = if ($adminEnv['VITE_SUPABASE_ANON_KEY']) { $adminEnv['VITE_SUPABASE_ANON_KEY'] } else { $apiEnv['SUPABASE_ANON_KEY'] }
$viteRz = if ($adminEnv['VITE_RAZORPAY_KEY_ID']) { $adminEnv['VITE_RAZORPAY_KEY_ID'] } else { $apiEnv['RAZORPAY_KEY_ID'] }

if (-not $viteUrl -or -not $viteAnon) {
  throw 'Missing Supabase URL/anon key (set apps/admin/.env or apps/api/.env)'
}

Write-Host "VITE_API_BASE_URL=$viteApi"
Write-Host "VITE_SUPABASE_URL set (len=$($viteUrl.Length))"
Write-Host "VITE_SUPABASE_ANON_KEY set (len=$($viteAnon.Length))"
Write-Host 'Deploying admin from apps/admin ...'

$deployArgs = @(
  '--yes', 'vercel@latest', 'deploy', 'apps/admin', '--prod', '--yes',
  '--env', "VITE_API_BASE_URL=$viteApi",
  '--build-env', "VITE_API_BASE_URL=$viteApi",
  '--env', "VITE_SUPABASE_URL=$viteUrl",
  '--build-env', "VITE_SUPABASE_URL=$viteUrl",
  '--env', "VITE_SUPABASE_ANON_KEY=$viteAnon",
  '--build-env', "VITE_SUPABASE_ANON_KEY=$viteAnon"
)
if ($viteRz) {
  $deployArgs += @('--env', "VITE_RAZORPAY_KEY_ID=$viteRz", '--build-env', "VITE_RAZORPAY_KEY_ID=$viteRz")
}

& npx @deployArgs

Write-Host ''
Write-Host 'After deploy: add the Vercel admin URL to Render CORS_ORIGINS (comma-separated).'
Write-Host 'Example: https://sharanamclasses.com,https://YOUR-ADMIN.vercel.app'
