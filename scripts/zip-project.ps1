# Zips the project for copying — excludes node_modules, .next, .git; keeps
# everything else (source, supabase/, docs, .env.local, .github, etc.).
# Run via: npm run zip   (or: powershell -ExecutionPolicy Bypass -File scripts/zip-project.ps1)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot          # project root (this script lives in scripts/)
$name = Split-Path -Leaf $root
$dest = Join-Path (Split-Path -Parent $root) "$name.zip"
$exclude = @('node_modules', '.next', '.git')

if (Test-Path $dest) { Remove-Item $dest -Force }

$items = Get-ChildItem -LiteralPath $root -Force |
  Where-Object { $exclude -notcontains $_.Name }

Compress-Archive -Path $items.FullName -DestinationPath $dest -Force

$sizeMb = [math]::Round((Get-Item $dest).Length / 1MB, 1)
Write-Host "Created $dest ($sizeMb MB), excluding: $($exclude -join ', ')"
