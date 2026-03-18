# Ubuntu Deployment Guide

이 문서는 `cloud_board_lab`을 Ubuntu 서버에 직접 배포하는 기준 절차입니다.

권장 환경:

- Ubuntu 22.04 또는 24.04
- Node.js 22.12.0
- PostgreSQL
- PM2
- Nginx

## 배포 목표

- Next.js 앱을 Ubuntu에서 직접 실행
- PostgreSQL 연결
- PM2로 프로세스 유지
- Nginx로 80 포트 연결
- 필요하면 테스트용 게시글 20개 재생성

## 1. 기본 패키지 설치

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl nginx build-essential postgresql postgresql-contrib
sudo systemctl enable nginx
sudo systemctl enable postgresql
```

## 2. Node.js 설치

프로젝트는 [.nvmrc](../.nvmrc) 기준으로 `22.12.0`을 사용합니다.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22.12.0
nvm use 22.12.0
node -v
npm -v
```

## 3. PM2 설치

```bash
npm install -g pm2
pm2 -v
```

## 4. PostgreSQL 준비

```bash
sudo -u postgres psql
```

아래 SQL을 실행합니다.

```sql
CREATE USER cloudboard WITH PASSWORD 'CloudBoard2026#';
CREATE DATABASE cloud_board_lab OWNER cloudboard;
\q
```

## 5. 저장소 클론

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/hoyoung94/cloud_board_lab.git
cd cloud_board_lab
```

## 6. 서버용 `.env` 작성

```bash
cd /var/www/cloud_board_lab
nano .env
```

예시:

```env
DATABASE_URL="postgresql://cloudboard:CloudBoard2026#@localhost:5432/cloud_board_lab?schema=public"
NEXTAUTH_URL="http://SERVER_IP"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"

LOCAL_ADMIN_NAME="Cloud Board Admin"
LOCAL_ADMIN_EMAIL="admin@cloudboard.local"
LOCAL_ADMIN_PASSWORD="change-me-1234"

STORAGE_PROVIDER="supabase"
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_SECRET_KEY="YOUR_SECRET_KEY"
SUPABASE_STORAGE_BUCKET="uploads"
```

메모:

- 실습 중에는 `NEXTAUTH_URL`에 `http://SERVER_IP` 사용
- 도메인을 붙인 뒤에는 `https://your-domain.com` 으로 변경
- 테스트 데이터까지 서버에서 다시 넣을 계획이라면 `STORAGE_PROVIDER="supabase"` 상태가 편합니다

## 7. 첫 배포

프로젝트에는 첫 배포용 스크립트가 준비되어 있습니다.

```bash
cd /var/www/cloud_board_lab
bash scripts/ubuntu-first-deploy.sh
```

이 스크립트가 하는 일:

1. `npm ci`
2. `npm run prisma:generate`
3. `npx prisma migrate deploy`
4. `npm run build`
5. PM2에 앱 등록 또는 재시작
6. `pm2 save`

확인:

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

## 8. PM2 부팅 자동 시작

```bash
pm2 startup
```

출력 마지막에 보이는 `sudo ... pm2 startup ...` 명령을 한 번 더 그대로 실행한 뒤:

```bash
pm2 save
```

## 9. Nginx 연결

```bash
cd /var/www/cloud_board_lab
sudo cp deploy/nginx/cloud-board-lab.conf /etc/nginx/sites-available/cloud-board-lab
sudo ln -s /etc/nginx/sites-available/cloud-board-lab /etc/nginx/sites-enabled/cloud-board-lab
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

확인:

```bash
curl -I http://127.0.0.1
```

브라우저에서:

```text
http://SERVER_IP
```

현재 실습처럼 기존 `blog_lab`이 이미 80포트 기본 사이트로 연결돼 있다면,
`cloud_board_lab`은 `cloud-board.local` 같은 별도 로컬 도메인으로 붙이는 방식이 가장 안전합니다.

이 경우 [deploy/nginx/cloud-board-lab.conf](../deploy/nginx/cloud-board-lab.conf)는
`server_name cloud-board.local;` 과 `proxy_pass http://127.0.0.1:3001;` 기준으로 동작합니다.

Windows 호스트 파일에 아래 한 줄을 추가하면 브라우저에서 바로 열 수 있습니다.

```text
192.168.100.130 cloud-board.local
```

그다음 접속 주소:

```text
http://cloud-board.local
```

## 10. 테스트 데이터 넣기

```bash
cd /var/www/cloud_board_lab
bash scripts/ubuntu-seed-test-data.sh
```

또는:

```bash
npm run seed:test-posts
```

## 11. 재배포

코드를 갱신한 뒤에는 아래 순서로 배포합니다.

```bash
cd /var/www/cloud_board_lab
git pull origin main
bash scripts/ubuntu-redeploy.sh
```

## 12. 점검 주소

- 홈: `http://SERVER_IP/`
- 로그인: `http://SERVER_IP/login`
- 관리자: `http://SERVER_IP/admin`
- 블로그 목록: `http://SERVER_IP/blog`
- 게시판 목록: `http://SERVER_IP/board`

## 13. 로그 확인

```bash
pm2 logs cloud-board-lab
pm2 status
sudo journalctl -u nginx -n 50 --no-pager
```

## 14. 완료 체크리스트

- `pm2 status`에서 `cloud-board-lab`이 `online`
- `curl -I http://127.0.0.1:3000` 결과가 `200`
- `curl -I http://127.0.0.1` 결과가 `200`
- `/admin` 접속 가능
- `npm run seed:test-posts` 실행 가능
- Supabase `uploads` 버킷에 첨부파일 생성 확인
