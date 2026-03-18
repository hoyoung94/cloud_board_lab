$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entry = "192.168.100.130 cloud-board.local"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "관리자 권한 PowerShell에서 실행해야 합니다."
  exit 1
}

$content = Get-Content $hostsPath -ErrorAction Stop

if ($content -contains $entry) {
  Write-Output "이미 hosts 파일에 등록되어 있습니다: $entry"
  exit 0
}

Add-Content -Path $hostsPath -Value $entry
Write-Output "hosts 파일에 추가했습니다: $entry"
