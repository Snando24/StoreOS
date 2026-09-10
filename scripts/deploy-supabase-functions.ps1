param(
  [switch]$SkipSecrets,
  [switch]$PruneRemoteFunctions,
  [switch]$HealthOnly
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$supabaseRoot = Join-Path $repositoryRoot 'supabase'
$projectRef = $env:SUPABASE_PROJECT_REF
$secretsFile = Join-Path $supabaseRoot '.env.functions.local'
$functions = @('health', 'catalog', 'create-order', 'admin-upload-product-image', 'expire-reservations')

if ([string]::IsNullOrWhiteSpace($projectRef)) { throw 'Set SUPABASE_PROJECT_REF in the process environment before deploying.' }
if ([string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)) {
  Write-Output 'SUPABASE_ACCESS_TOKEN is not set; using the saved Supabase CLI login if available.'
}

& (Join-Path $PSScriptRoot 'validate-supabase-structure.ps1')

if (-not $SkipSecrets) {
  if (-not (Test-Path -LiteralPath $secretsFile)) {
    throw "Missing $secretsFile. Copy supabase/.env.functions.example and set real values."
  }
  npx supabase secrets set --project-ref $projectRef --env-file $secretsFile
  if ($LASTEXITCODE -ne 0) { throw 'Failed to configure Edge Function secrets.' }
}

$arguments = @('supabase', 'functions', 'deploy', '--project-ref', $projectRef, '--use-api')
if ($PruneRemoteFunctions) { $arguments += '--prune' }
if ($HealthOnly) { $functions = @('health') }
$arguments += $functions
npx @arguments
if ($LASTEXITCODE -ne 0) { throw 'Edge Function deployment failed.' }

Write-Output "Edge Functions deployed to project $projectRef. No database migration was run."
