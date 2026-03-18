param(
  [string]$HostName = "192.168.100.130",
  [string]$UserName = "user",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\codex_ubuntu",
  [Parameter(Mandatory = $true)]
  [string]$Command
)

if (-not (Test-Path $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath"
  exit 1
}

$sshArgs = @(
  "-i", $KeyPath,
  "-o", "StrictHostKeyChecking=accept-new",
  "$UserName@$HostName",
  $Command
)

& ssh @sshArgs
exit $LASTEXITCODE
