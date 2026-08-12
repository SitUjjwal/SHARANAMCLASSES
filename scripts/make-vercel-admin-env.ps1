$ErrorActionPreference = 'Stop'
$root = 'c:\SHARANAM CLASSES'
$api = @{}
Get-Content (Join-Path $root 'apps\api\.env') | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $i = $line.IndexOf('=')
  if ($i -lt 1) { return }
  $k = $line.Substring(0, $i).Trim()
  $v = $line.Substring($i + 1)
  if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
    $v = $v.Substring(1, $v.Length - 2)
  }
  $api[$k] = $v
}
$url = $api['SUPABASE_URL']
$anon = $api['SUPABASE_ANON_KEY']
if (-not $url -or -not $anon) { throw 'missing supabase in apps/api/.env' }
$out = Join-Path $root 'apps\admin\.env.vercel.production'
@(
  'VITE_API_BASE_URL=https://sharanamclasses-1.onrender.com'
  "VITE_SUPABASE_URL=$url"
  "VITE_SUPABASE_ANON_KEY=$anon"
) | Set-Content -Path $out -Encoding utf8
Write-Host "OK wrote $out"
Write-Host "URL len=$($url.Length) ANON len=$($anon.Length)"
Start-Process notepad $out
