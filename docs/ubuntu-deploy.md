# Ubuntu 배포 실습 가이드

이 문서는 `cloud_board_lab`을 Ubuntu 서버에 직접 배포하는 실습용 가이드입니다.  
기준 환경은 `Ubuntu 22.04/24.04`, `Nginx`, `PM2`, `PostgreSQL` 입니다.

## 목표

- Next.js 앱을 Ubuntu 서버에서 직접 실행
- PostgreSQL을 서버에 설치해서 연결
- PM2로 프로세스 유지
- Nginx로 80 포트 연결
- 테스트 데이터 20개를 서버에서도 다시 생성

## 1. 서버 기본 패키지 설치

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl nginx build-essential postgresql postgresql-contrib
```

## 2. Node.js 설치

이 프로젝트는 [.nvmrc](C:/Users/HP/Desktop/cloud_board_lab/.nvmrc) 기준으로 `22.12.0`을 사용합니다.

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

## 4. PostgreSQL 데이터베이스 준비

```bash
sudo -u postgres psql
```

아래 SQL을 실행합니다.

```sql
CREATE USER cloudboard WITH PASSWORD 'CloudBoard2026#';
CREATE DATABASE cloud_board_lab OWNER cloudboard;
\q
```

## 5. 프로젝트 내려받기

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/<your-account>/cloud_board_lab.git
cd cloud_board_lab
```

GitHub에 아직 올리지 않았다면, Windows에서 현재 프로젝트를 먼저 원격 저장소에 올린 뒤 서버에서 clone 하면 됩니다.

## 6. 서버용 환경변수 작성

서버에서 `.env` 파일을 만듭니다.

```bash
cd /var/www/cloud_board_lab
nano .env
```

예시:

```env
DATABASE_URL="postgresql://cloudboard:CloudBoard2026#@localhost:5432/cloud_board_lab?schema=public"
NEXTAUTH_URL="http://SERVER_IP"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"

LOCAL_ADMIN_NAME="로컬 관리자"
LOCAL_ADMIN_EMAIL="admin@cloudboard.local"
LOCAL_ADMIN_PASSWORD="change-me-1234"

STORAGE_PROVIDER="supabase"
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_SECRET_KEY="YOUR_SECRET_KEY"
SUPABASE_STORAGE_BUCKET="uploads"
```

주의:

- `NEXTAUTH_URL`은 실습 중에는 `http://서버IP`
- 도메인을 붙인 뒤에는 `https://도메인`
- 테스트 데이터를 서버에서도 똑같이 만들려면 `STORAGE_PROVIDER="supabase"` 상태여야 합니다

## 7. 앱 설치와 첫 빌드

```bash
cd /var/www/cloud_board_lab
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run build
```

## 8. PM2로 앱 실행

```bash
cd /var/www/cloud_board_lab
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` 실행 후 마지막에 출력되는 명령을 한 번 더 실행해야 부팅 시 자동 시작이 활성화됩니다.

확인:

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

## 9. Nginx 연결

```bash
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

## 10. 테스트 데이터 20개 다시 만들기

서버에서도 Windows와 같은 샘플 글 20개와 첨부파일 40개를 다시 만들 수 있습니다.

```bash
cd /var/www/cloud_board_lab
npm run seed:test-posts
```

또는 준비해 둔 스크립트를 실행합니다.

```bash
bash scripts/ubuntu-seed-test-data.sh
```

## 11. 수정 후 재배포

서버에서 최신 코드를 받은 뒤 재배포:

```bash
cd /var/www/cloud_board_lab
git pull origin main
bash scripts/ubuntu-redeploy.sh
```

## 12. 확인할 주소

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

## 14. 실습 완료 체크리스트

- `pm2 status` 에서 `cloud-board-lab` 이 `online`
- `curl -I http://127.0.0.1:3000` 이 `200`
- `curl -I http://127.0.0.1` 이 `200`
- `http://SERVER_IP/admin` 접속 가능
- `npm run seed:test-posts` 후 블로그/게시판 글 20개 확인
- Supabase `uploads` 버킷에 첨부파일 생성 확인
