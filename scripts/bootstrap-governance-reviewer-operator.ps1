[CmdletBinding()]
param(
  [switch]$PreflightOnly,
  [string]$BackupOperatorScriptPath = ''
)

$ErrorActionPreference = 'Stop'
$expectedProjectRef = 'kytdomflmjytzyaabogi'
$forbiddenStagingRef = 'bniwtkjtramqaozrrtrk'
$approvedCaSha256 = '700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7'
$candidateRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$repairRoot = Split-Path -Parent $candidateRoot
$bootstrapScript = Join-Path $candidateRoot 'scripts\bootstrap-governance-reviewer.mjs'

function Read-ApprovedEnvValue {
  param([string]$Path, [string]$Name)

  $found = @()
  $reader = [IO.File]::OpenText($Path)
  try {
    while (($line = $reader.ReadLine()) -ne $null) {
    if ($line -match '^\s*(?:export\s+)?(?<key>[A-Za-z_][A-Za-z0-9_]*)\s*=(?<value>.*)$' -and $Matches.key -ceq $Name) {
      $value = $Matches.value.Trim()
      if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
        $value = $value.Replace('\\', '\').Replace('\n', "`n").Replace('\r', "`r").Replace('\"', '"')
      } elseif ($value.Length -ge 2 -and $value.StartsWith("'") -and $value.EndsWith("'")) {
        $value = $value.Substring(1, $value.Length - 2)
      } else {
        $value = [regex]::Replace($value, '\s+#.*$', '').Trim()
      }
        $found += $value
      }
    }
  } finally {
    $reader.Dispose()
  }

  if ($found.Count -gt 1) { throw 'APPROVED_OPERATOR_ENV_DUPLICATE_KEY' }
  $finalValue = ''
  if ($found.Count -eq 1) { $finalValue = $found[0] }
  return [pscustomobject]@{
    Present = ($found.Count -eq 1 -and -not [string]::IsNullOrWhiteSpace($finalValue))
    Value = $finalValue
  }
}

function Get-DatabaseRef {
  param([string]$ConnectionString)

  $pattern = '^(?<scheme>postgres(?:ql)?):\/\/(?<userinfo>[^@\/]+)@(?<host>[^:\/?#]+)(?::(?<port>\d+))?(?<path>\/[^?#]*)?(?:\?(?<query>[^#]*))?$'
  $match = [regex]::Match($ConnectionString, $pattern, [Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if (-not $match.Success) { return $null }

  $dbHost = $match.Groups['host'].Value.ToLowerInvariant()
  $direct = [regex]::Match($dbHost, '^db\.([a-z0-9]{20})\.supabase\.co$')
  if ($direct.Success) {
    $ref = $direct.Groups[1].Value
  } elseif ($dbHost.EndsWith('.pooler.supabase.com')) {
    $user = [Uri]::UnescapeDataString(($match.Groups['userinfo'].Value -split ':', 2)[0])
    $pooler = [regex]::Match($user, '^postgres\.([a-z0-9]{20})$')
    if (-not $pooler.Success) { return $null }
    $ref = $pooler.Groups[1].Value
  } else {
    return $null
  }

  $port = if ($match.Groups['port'].Success) { $match.Groups['port'].Value } else { '5432' }
  $database = [Uri]::UnescapeDataString($match.Groups['path'].Value.TrimStart('/'))
  if ($port -ne '5432' -or $database -ne 'postgres') { return $null }

  $query = $match.Groups['query'].Value
  if ($query -match '(?i)(?:^|&)sslmode=(?:disable|no-verify|allow|prefer)(?:&|$)') { return $null }
  if ($query -match '(?i)(?:^|&)ssl=(?:0|false|disable|no-verify)(?:&|$)') { return $null }
  return $ref
}

function Normalize-ApprovedOperatorDatabaseUrl {
  param([string]$ConnectionString)

  $pattern = '^(?<prefix>postgres(?:ql)?:\/\/[^@\/]+@(?<host>[^:\/?#]+)):(?<port>\d+)(?<suffix>.*)$'
  $match = [regex]::Match($ConnectionString, $pattern, [Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($match.Success -and $match.Groups['host'].Value.EndsWith('.pooler.supabase.com') -and $match.Groups['port'].Value -eq '6543') {
    return $match.Groups['prefix'].Value + ':5432' + $match.Groups['suffix'].Value
  }
  return $ConnectionString
}

function Get-SupabaseRef {
  param([string]$Value)
  try {
    $uri = [Uri]$Value
    if ($uri.Scheme -ne 'https') { return $null }
    $match = [regex]::Match($uri.Host.ToLowerInvariant(), '^([a-z0-9]{20})\.supabase\.co$')
    if ($match.Success) { return $match.Groups[1].Value }
  } catch {}
  return $null
}

$databaseUrl = ''
$databaseUrlPresent = $false
$caFile = ''
$caPresent = $false
$dbRefMatch = $false
$databaseHostRefMatch = $false
$serverAuthRefMatch = $false
$browserAuthRefMatch = $false
$ownerId = [Environment]::GetEnvironmentVariable('GOVERNANCE_BOOTSTRAP_OWNER_USER_ID', 'Process')
$reviewerId = [Environment]::GetEnvironmentVariable('GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID', 'Process')
$bootstrapIdsPresent = $ownerId -match '^[0-9a-fA-F-]{36}$' -and $reviewerId -match '^[0-9a-fA-F-]{36}$' -and $ownerId -ne $reviewerId
$publicSupabaseUrl = ''
$serverSupabaseUrl = ''
$configurationValid = $false
$nodeExe = ''
$safeEnvironment = @{}
$originalEnvironment = [Environment]::GetEnvironmentVariables('Process')
$exitCode = 2

try {
  if (-not (Test-Path -LiteralPath $bootstrapScript -PathType Leaf)) { throw 'BOOTSTRAP_SCRIPT_MISSING' }

  if (-not $BackupOperatorScriptPath) {
    $backupScripts = @(Get-ChildItem -LiteralPath $repairRoot -Recurse -File -Filter 'OWNER_FRESH_BACKUP.ps1' -ErrorAction Stop)
    if ($backupScripts.Count -ne 1) { throw 'APPROVED_BACKUP_WORKFLOW_NOT_UNIQUE' }
    $BackupOperatorScriptPath = $backupScripts[0].FullName
  }
  if (-not (Test-Path -LiteralPath $BackupOperatorScriptPath -PathType Leaf)) { throw 'APPROVED_BACKUP_WORKFLOW_MISSING' }

  $backupSource = [IO.File]::ReadAllText($BackupOperatorScriptPath)
  $sourcePathPattern = '\$sourceOperatorEnv\s*=\s*[''\"](?<path>[^''\"]+)[''\"]'
  $sourcePathMatch = [regex]::Match($backupSource, $sourcePathPattern)
  if (-not $sourcePathMatch.Success) { throw 'APPROVED_OPERATOR_ENV_PATH_UNAVAILABLE' }
  $sourceEnvironmentFile = [IO.Path]::GetFullPath($sourcePathMatch.Groups['path'].Value)
  if (-not (Test-Path -LiteralPath $sourceEnvironmentFile -PathType Leaf)) { throw 'APPROVED_OPERATOR_ENV_FILE_MISSING' }

  $caFile = Join-Path (Split-Path -Parent $BackupOperatorScriptPath) 'prod-ca-2021.crt'
  if (Test-Path -LiteralPath $caFile -PathType Leaf) {
    $caHash = (Get-FileHash -LiteralPath $caFile -Algorithm SHA256).Hash.ToUpperInvariant()
    $caPresent = $caHash -eq $approvedCaSha256
  }

  $databaseEntry = Read-ApprovedEnvValue -Path $sourceEnvironmentFile -Name 'DATABASE_URL'
  $publicEntry = Read-ApprovedEnvValue -Path $sourceEnvironmentFile -Name 'NEXT_PUBLIC_SUPABASE_URL'
  $serverEntry = Read-ApprovedEnvValue -Path $sourceEnvironmentFile -Name 'SUPABASE_URL'
  $databaseUrl = if ($databaseEntry.Present) { Normalize-ApprovedOperatorDatabaseUrl -ConnectionString $databaseEntry.Value } else { '' }
  $databaseUrlPresent = $databaseEntry.Present
  $publicSupabaseUrl = $publicEntry.Value
  $serverSupabaseUrl = if ($serverEntry.Present) { $serverEntry.Value } else { $publicSupabaseUrl }

  $dbProjectRef = if ($databaseUrlPresent) { Get-DatabaseRef -ConnectionString $databaseUrl } else { $null }
  $authProjectRef = Get-SupabaseRef -Value $serverSupabaseUrl
  $browserProjectRef = Get-SupabaseRef -Value $publicSupabaseUrl
  $databaseHostRefMatch = $dbProjectRef -eq $expectedProjectRef -and $dbProjectRef -ne $forbiddenStagingRef
  $serverAuthRefMatch = $authProjectRef -eq $expectedProjectRef
  $browserAuthRefMatch = $browserProjectRef -eq $expectedProjectRef
  $dbRefMatch = $databaseHostRefMatch -and $serverAuthRefMatch -and $browserAuthRefMatch

  $nodeCommand = Get-Command 'node.exe' -ErrorAction SilentlyContinue
  if (-not $nodeCommand) { $nodeCommand = Get-Command 'node' -ErrorAction Stop }
  $nodeExe = $nodeCommand.Source

  $configurationValid = $databaseUrlPresent -and $caPresent -and $dbRefMatch -and ($PreflightOnly -or $bootstrapIdsPresent)
  $safeEnvironment = @{
    DATABASE_URL = $databaseUrl
    DATABASE_SSL = 'verify-full'
    DATABASE_SSL_REJECT_UNAUTHORIZED = 'true'
    SUPABASE_URL = $serverSupabaseUrl
    NEXT_PUBLIC_SUPABASE_URL = $publicSupabaseUrl
    SUPABASE_PROJECT_REF = $expectedProjectRef
    STUDENTHUB_PRODUCTION_CA_FILE = [IO.Path]::GetFullPath($caFile)
    GOVERNANCE_BOOTSTRAP_OWNER_USER_ID = $ownerId
    GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID = $reviewerId
  }
  foreach ($name in @('PATH','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','COMSPEC','PATHEXT')) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Process')
    if (-not [string]::IsNullOrEmpty($value)) { $safeEnvironment[$name] = $value }
  }
} catch {
  $configurationValid = $false
}

Write-Output ('DATABASE_URL_PRESENT = {0}' -f $(if ($databaseUrlPresent) { 'YES' } else { 'NO' }))
Write-Output ('TLS_CA_PRESENT = {0}' -f $(if ($caPresent) { 'YES' } else { 'NO' }))
Write-Output ('DB_PROJECT_REF = {0}' -f $expectedProjectRef)
Write-Output ('DB_REF_MATCH = {0}' -f $(if ($dbRefMatch) { 'YES' } else { 'NO' }))
Write-Output ('DB_HOST_REF_MATCH = {0}' -f $(if ($databaseHostRefMatch) { 'YES' } else { 'NO' }))
Write-Output ('SERVER_AUTH_REF_MATCH = {0}' -f $(if ($serverAuthRefMatch) { 'YES' } else { 'NO' }))
Write-Output ('BROWSER_AUTH_REF_MATCH = {0}' -f $(if ($browserAuthRefMatch) { 'YES' } else { 'NO' }))
Write-Output 'TLS_STRICT = YES'
Write-Output ('BOOTSTRAP_IDS_PRESENT = {0}' -f $(if ($bootstrapIdsPresent) { 'YES' } else { 'NO' }))

if (-not $configurationValid) {
  Write-Output 'TRANSPORT_CONFIG = HOLD'
  exit 2
}

Push-Location $candidateRoot
try {
  $currentNames = @([Environment]::GetEnvironmentVariables('Process').Keys)
  foreach ($name in $currentNames) {
    [Environment]::SetEnvironmentVariable([string]$name, $null, 'Process')
  }
  foreach ($entry in $safeEnvironment.GetEnumerator()) {
    [Environment]::SetEnvironmentVariable([string]$entry.Key, [string]$entry.Value, 'Process')
  }

  & $nodeExe $bootstrapScript '--transport-preflight-only'
  $exitCode = $LASTEXITCODE
  if ($exitCode -eq 0 -and -not $PreflightOnly) {
    & $nodeExe $bootstrapScript
    $exitCode = $LASTEXITCODE
  }
} catch {
  Write-Output 'OPERATOR_LAUNCH = FAILED'
  $exitCode = 1
} finally {
  $currentNames = @([Environment]::GetEnvironmentVariables('Process').Keys)
  foreach ($name in $currentNames) {
    [Environment]::SetEnvironmentVariable([string]$name, $null, 'Process')
  }
  foreach ($entry in $originalEnvironment.GetEnumerator()) {
    [Environment]::SetEnvironmentVariable([string]$entry.Key, [string]$entry.Value, 'Process')
  }
  Pop-Location
}

exit $exitCode
