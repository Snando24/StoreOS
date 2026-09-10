$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$supabaseRoot = Join-Path $repositoryRoot 'supabase'
$functions = @('health', 'catalog', 'create-order', 'admin-upload-product-image', 'expire-reservations')
$configPath = Join-Path $supabaseRoot 'config.toml'

foreach ($path in @($configPath, (Join-Path $supabaseRoot 'openapi.yaml'))) {
  if (-not (Test-Path -LiteralPath $path)) { throw "Missing required Supabase artifact: $path" }
}

$config = Get-Content -LiteralPath $configPath -Raw
foreach ($functionName in $functions) {
  $entryPoint = Join-Path $supabaseRoot "functions/$functionName/index.ts"
  if (-not (Test-Path -LiteralPath $entryPoint)) { throw "Missing Edge Function: $entryPoint" }
  if ($config -notmatch "\[functions\.$([regex]::Escape($functionName))\]") { throw "Function is not configured in config.toml: $functionName" }
}

$frontendSource = Get-ChildItem -Path (Join-Path $repositoryRoot 'front/src') -Recurse -Filter '*.ts*' | Get-Content -Raw
if ($frontendSource -match 'SUPABASE_SERVICE_ROLE_KEY|service_role') { throw 'A private Supabase credential appears in frontend source.' }

Write-Output 'Structure validation passed: functions, contracts, configuration, and frontend secret boundary are present.'
Write-Output 'No database migration was executed by this check.'
