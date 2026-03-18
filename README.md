# Cloud Board Lab

개발 블로그와 간단한 게시판을 하나의 프로젝트에서 운영해 보는 실습용 앱입니다.  
`Next.js + PostgreSQL + Prisma + Auth.js + Supabase Storage` 조합으로 관리자형 CRUD, 첨부파일 업로드, Markdown 작성, 운영 화면까지 묶어 두었습니다.

## 기술 스택

- TypeScript
- Next.js App Router
- PostgreSQL
- Prisma
- Auth.js
- Supabase Storage
- Ubuntu + PM2 + Nginx

## 현재 구현된 기능

- 공개 페이지: `/`, `/blog`, `/blog/[slug]`, `/board`, `/board/[slug]`
- 관리자 페이지: `/admin`, `/admin/posts/new`, `/admin/posts/[id]/edit`, `/admin/posts/[id]/preview`
- 관리자 로그인
- 블로그/게시판 CRUD
- 카테고리, 태그, 고정글
- Markdown 본문 작성과 실시간 미리보기
- 첨부파일 업로드/삭제
- 첨부파일 URL 복사, Markdown 복사
- 목록 검색, 필터, 페이지네이션
- 조회수 증가
- 로컬 첨부파일 -> Supabase 마이그레이션 버튼

## 로컬 실행

1. `.env.example`을 참고해 `.env`를 준비합니다.
2. 로컬 PostgreSQL에 `cloud_board_lab` 데이터베이스를 만듭니다.
3. 아래 명령으로 마이그레이션과 개발 서버를 실행합니다.

```bash
npm run prisma:migrate -- --name init
npm run dev
```

4. 브라우저에서 아래 주소를 확인합니다.

- `http://localhost:3000/`
- `http://localhost:3000/login`
- `http://localhost:3000/admin`
- `http://localhost:3000/blog`
- `http://localhost:3000/board`

## 환경변수 예시

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloud_board_lab?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
LOCAL_ADMIN_NAME="로컬 관리자"
LOCAL_ADMIN_EMAIL="admin@cloudboard.local"
LOCAL_ADMIN_PASSWORD="change-me-1234"

STORAGE_PROVIDER="local"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-secret-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_STORAGE_BUCKET="uploads"
```

## Supabase Storage 전환

기본값은 `STORAGE_PROVIDER="local"`입니다. Supabase로 전환하려면:

1. Supabase 프로젝트를 만듭니다.
2. Storage에서 `uploads` 버킷을 만듭니다.
3. 버킷을 `public`으로 설정합니다.
4. 필요하면 버킷 제한을 `6MB`로 맞춥니다.
5. `.env`에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`을 실제 값으로 넣습니다.
6. `STORAGE_PROVIDER="supabase"`로 변경합니다.
7. 개발 서버를 다시 시작합니다.

전환 후 새 첨부파일은 Supabase Storage에 저장됩니다. 예전에 로컬에 저장된 첨부파일은 관리자 대시보드의 `로컬 첨부파일을 Supabase로 이전` 버튼으로 옮길 수 있습니다.

## 관리자 운영 흐름

1. `/login`에서 관리자 계정으로 로그인합니다.
2. `/admin`에서 글 검색, 상태/유형 필터, 페이지네이션을 사용합니다.
3. `/admin/posts/new`에서 새 글을 작성합니다.
4. 저장 후 `/admin/posts/[id]/edit`에서 첨부파일을 업로드합니다.
5. 업로드된 첨부파일의 URL 또는 Markdown 문법을 복사해 본문에 붙여 넣습니다.
6. `/admin/posts/[id]/preview`에서 초안 미리보기를 확인합니다.

## 자주 쓰는 명령

```bash
npm run dev
npm run lint
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## 다음 단계 아이디어

- 일반 사용자용 댓글 기능
- 공개 사용자 인증
- 배포 후 업로드/로그 모니터링
- Ubuntu + PM2 + Nginx 운영 자동화

## Ubuntu 배포 실습

실제 Ubuntu 서버에서 실행하는 절차는 [ubuntu-deploy.md](C:/Users/HP/Desktop/cloud_board_lab/docs/ubuntu-deploy.md)에 정리해 두었습니다.

- PM2 설정: [ecosystem.config.cjs](C:/Users/HP/Desktop/cloud_board_lab/ecosystem.config.cjs)
- Nginx 설정: [cloud-board-lab.conf](C:/Users/HP/Desktop/cloud_board_lab/deploy/nginx/cloud-board-lab.conf)
- 재배포 스크립트: [ubuntu-redeploy.sh](C:/Users/HP/Desktop/cloud_board_lab/scripts/ubuntu-redeploy.sh)
- 테스트 데이터 생성 스크립트: [ubuntu-seed-test-data.sh](C:/Users/HP/Desktop/cloud_board_lab/scripts/ubuntu-seed-test-data.sh)
