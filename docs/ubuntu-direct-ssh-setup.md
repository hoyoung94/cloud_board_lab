# Ubuntu Direct SSH Setup

이 문서는 Windows의 Codex 환경에서 VMware Ubuntu VM에 직접 SSH로 붙기 위한 1회 설정 가이드입니다.

현재 확인된 상태:

- Ubuntu VM 경로: `C:\Users\HP\Documents\Virtual Machines\Ubuntu 64-bit\Ubuntu 64-bit.vmx`
- 현재 Ubuntu VM IP: `192.168.100.130`
- 추정 사용자명: `user`
- 현재 상태: VM은 켜져 있지만 `22`번 SSH 포트는 닫혀 있음

즉, Ubuntu 콘솔에서 `openssh-server` 설치와 공개키 등록을 한 번만 해주면 이후에는 Windows에서 직접 접속할 수 있습니다.

## 1. Ubuntu 콘솔에서 실행할 명령

Ubuntu 가상머신 터미널에서 아래를 순서대로 실행합니다.

```bash
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
sudo systemctl status ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

## 2. Windows에서 생성한 공개키 등록

아래 공개키 한 줄을 Ubuntu의 `~/.ssh/authorized_keys`에 그대로 추가합니다.

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMVxLUDTrZnrJf2BG//sh9y2ec0ag7Rv8AsoSXsB4MOh codex-ubuntu
```

Ubuntu에서 실행:

```bash
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

붙여넣고 저장한 뒤 권한까지 맞추면 됩니다.

## 3. Ubuntu에서 네트워크 확인

```bash
hostname -I
ss -tlnp | grep :22
```

정상이라면:

- `hostname -I`에 `192.168.100.130` 또는 비슷한 VMware NAT IP가 보임
- `ss -tlnp | grep :22` 에서 `sshd`가 `LISTEN` 상태

## 4. Windows에서 접속 테스트

PowerShell에서:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ubuntu-ssh.ps1 -Command "hostname && whoami && pwd"
```

또는 직접:

```powershell
ssh -i $env:USERPROFILE\.ssh\codex_ubuntu -o StrictHostKeyChecking=accept-new user@192.168.100.130 "hostname && whoami && pwd"
```

## 5. 이후 Codex가 직접 실행할 수 있는 명령 예시

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ubuntu-ssh.ps1 -Command "sudo systemctl status ssh"
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ubuntu-ssh.ps1 -Command "cd /var/www/cloud_board_lab && bash scripts/ubuntu-first-deploy.sh"
```

## 6. 현재 막히는 이유

Windows에서 확인한 결과:

- `192.168.100.130` 에 `ping` 응답은 옴
- 하지만 TCP `22` 포트는 닫혀 있음

즉 VM 전원 문제는 아니고, SSH 서버 미설치 또는 미실행 문제입니다.
