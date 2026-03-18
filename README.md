# Cloud Board Lab

`Cloud Board Lab`은 블로그와 간단한 게시판을 한 프로젝트 안에서 함께 운영해보는 실습용 웹 애플리케이션입니다.

관리자 로그인, 게시글 CRUD, 카테고리/태그, Markdown 본문, 첨부파일 업로드, Supabase Storage 전환, Ubuntu 배포 연습까지 한 번에 다룰 수 있도록 구성했습니다.

## Stack

- TypeScript
- Next.js App Router
- PostgreSQL
- Prisma
- Auth.js
- Supabase Storage
- Ubuntu + PM2 + Nginx

## Features

- 공개 페이지
  - 홈
  - 블로그 목록/상세
  - 게시판 목록/상세
- 관리자 기능
  - 로그인
  - 게시글 작성 / 수정 / 삭제
  - 초안 미리보기
  - 관리자 목록 검색 / 필터 / 페이지네이션
- 콘텐츠 기능
  - 카테고리 / 태그
  - 고정글
  - Markdown 본문 작성과 미리보기
  - 조회수 증가
- 첨부파일 기능
  - 이미지 / 일반 파일 업로드
  - 첨부파일 URL 복사
  - Markdown 삽입용 문법 복사
  - 로컬 업로드 -> Supabase Storage 마이그레이션
- 운영 보조
  - 테스트용 게시글 20개 + 첨부파일 40개 시드 스크립트
  - Ubuntu 배포 문서와 PM2 / Nginx 설정 제공

## Routes

- `/`
- `/blog`
- `/blog/[slug]`
- `/board`
- `/board/[slug]`
- `/login`
- `/admin`
- `/admin/posts/new`
- `/admin/posts/[id]/edit`
- `/admin/posts/[id]/preview`

## Quick Start

### 1. 환경변수 준비

`.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

```bash
copy .env.example .env
```

필수 값:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `LOCAL_ADMIN_EMAIL`
- `LOCAL_ADMIN_PASSWORD`

### 2. 로컬 PostgreSQL 준비

`cloud_board_lab` 데이터베이스를 만들고 `.env`의 `DATABASE_URL`을 연결합니다.

### 3. 마이그레이션과 개발 서버 실행

```bash
npm install
npm run prisma:migrate -- --name init
npm run dev
```

브라우저에서 확인:

- `http://localhost:3000`
- `http://localhost:3000/login`
- `http://localhost:3000/admin`

## Environment Variables

예시는 [.env.example](./.env.example)에 정리되어 있습니다.

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloud_board_lab?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"

LOCAL_ADMIN_NAME="Cloud Board Admin"
LOCAL_ADMIN_EMAIL="admin@cloudboard.local"
LOCAL_ADMIN_PASSWORD="change-me-1234"

STORAGE_PROVIDER="local"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-secret-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_STORAGE_BUCKET="uploads"
```

## Storage Mode

기본값은 `STORAGE_PROVIDER="local"` 입니다.

Supabase Storage로 전환하려면:

1. Supabase 프로젝트 생성
2. `uploads` 버킷 생성
3. 버킷을 `public`으로 설정
4. `.env`에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` 입력
5. `STORAGE_PROVIDER="supabase"` 로 변경
6. 개발 서버 재시작

이미 로컬에 저장된 첨부파일은 관리자 화면의 `로컬 첨부파일을 Supabase로 이전` 버튼으로 옮길 수 있습니다.

## Test Data

테스트용 게시글 20개와 첨부파일 40개를 생성하는 스크립트를 포함하고 있습니다.

```bash
npm run seed:test-posts
```

생성되는 데이터:

- 블로그 10개
- 게시판 10개
- 첨부파일 40개

## Daily Commands

```bash
npm run dev
npm run lint
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run seed:test-posts
```

## Ubuntu Deployment

Ubuntu 서버에서 실제로 배포하려면 아래 문서를 따라가면 됩니다.

- 배포 가이드: [docs/ubuntu-deploy.md](./docs/ubuntu-deploy.md)
- PM2 설정: [ecosystem.config.cjs](./ecosystem.config.cjs)
- Nginx 설정: [deploy/nginx/cloud-board-lab.conf](./deploy/nginx/cloud-board-lab.conf)
- 첫 배포 스크립트: [scripts/ubuntu-first-deploy.sh](./scripts/ubuntu-first-deploy.sh)
- 재배포 스크립트: [scripts/ubuntu-redeploy.sh](./scripts/ubuntu-redeploy.sh)
- 테스트 데이터 스크립트: [scripts/ubuntu-seed-test-data.sh](./scripts/ubuntu-seed-test-data.sh)

## Project Structure

```text
cloud_board_lab/
├─ prisma/
├─ public/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
├─ deploy/
│  └─ nginx/
├─ scripts/
└─ docs/
```

## Next Steps

- Ubuntu VM 또는 EC2에 실제 배포
- 도메인 연결과 HTTPS
- 운영 로그 점검
- 댓글 / 일반 사용자 기능 같은 2차 확장
