param(
  [string]$Tags = '@e2e'
)
$ErrorActionPreference = 'Stop'
npm run ci -- --tags "$Tags"
