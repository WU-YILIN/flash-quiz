param(
  [Parameter(Mandatory = $true)]
  [string]$VaultPath
)

$ErrorActionPreference = "Stop"

$pluginId = "flash-quiz"
$pluginDir = Join-Path $VaultPath ".obsidian\plugins\$pluginId"

if (!(Test-Path $VaultPath)) {
  throw "Vault path does not exist: $VaultPath"
}

if (!(Test-Path $pluginDir)) {
  New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null
}

Copy-Item -LiteralPath (Join-Path $PSScriptRoot "..\manifest.json") -Destination (Join-Path $pluginDir "manifest.json") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "..\main.js") -Destination (Join-Path $pluginDir "main.js") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "..\styles.css") -Destination (Join-Path $pluginDir "styles.css") -Force

Write-Output "Deployed Flash Quiz to $pluginDir"
