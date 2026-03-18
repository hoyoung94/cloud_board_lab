import "dotenv/config";
import crypto from "node:crypto";
import { hash } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL이 비어 있습니다.");
}

if (STORAGE_PROVIDER !== "supabase") {
  throw new Error('테스트 게시글 시드는 STORAGE_PROVIDER="supabase" 상태에서만 실행하도록 구성되어 있습니다.');
}

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error(
    "SUPABASE_URL과 SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY를 먼저 설정해 주세요.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function cuidLike() {
  return `c${Date.now().toString(36)}${crypto.randomBytes(10).toString("hex")}`.slice(0, 25);
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeSvgBuffer({ title, subtitle, accent, meta }) {
  const safeTitle = title.replace(/[<&>"]/g, "");
  const safeSubtitle = subtitle.replace(/[<&>"]/g, "");
  const safeMeta = meta.replace(/[<&>"]/g, "");

  return Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="900" fill="#f8fafc"/>
  <rect x="50" y="50" width="1500" height="800" rx="36" fill="${accent}"/>
  <rect x="90" y="90" width="1420" height="720" rx="28" fill="#ffffff" fill-opacity="0.92"/>
  <text x="120" y="180" fill="#111827" font-family="Arial, sans-serif" font-size="44" font-weight="700">Cloud Board Lab</text>
  <text x="120" y="300" fill="#111827" font-family="Arial, sans-serif" font-size="68" font-weight="700">${safeTitle}</text>
  <text x="120" y="390" fill="#334155" font-family="Arial, sans-serif" font-size="34">${safeSubtitle}</text>
  <text x="120" y="760" fill="#64748b" font-family="Arial, sans-serif" font-size="28">${safeMeta}</text>
</svg>`,
    "utf8",
  );
}

function buildNoteContent(post) {
  return `# ${post.title}

- 유형: ${post.type === "BLOG" ? "블로그" : "게시판"}
- 상태: ${post.status}
- 카테고리: ${post.categorySlug}
- 태그: ${post.tags.join(", ")}

## 요약
${post.summary}

## 확인 포인트
- ${post.checks[0]}
- ${post.checks[1]}
- ${post.checks[2]}

## 재현 명령
\`\`\`bash
${post.command}
\`\`\`
`;
}

async function uploadFile(path, buffer, contentType) {
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function removeFiles(paths) {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove(paths);

  if (error) {
    console.error("기존 시드 파일 삭제 실패:", error.message);
  }
}

function buildBlogContent(post, imageUrl, noteUrl) {
  return `## 실습 배경

${post.summary}

## 이번에 확인한 핵심

- ${post.checks[0]}
- ${post.checks[1]}
- ${post.checks[2]}

## 실행 메모

\`\`\`bash
${post.command}
\`\`\`

## 다음 단계

1. 관리자 화면에서 발행/초안 상태를 다시 확인합니다.
2. 첨부파일 URL 복사 기능으로 본문 링크를 재사용합니다.
3. Ubuntu 배포 전 체크리스트에 이 기록을 반영합니다.

## 첨부 자료

![${post.title}](${imageUrl})

- [실습 메모 파일](${noteUrl})
`;
}

function buildBoardContent(post, imageUrl, noteUrl) {
  return `## 공지 요약

${post.summary}

## 확인 항목

| 항목 | 내용 |
| --- | --- |
| 1 | ${post.checks[0]} |
| 2 | ${post.checks[1]} |
| 3 | ${post.checks[2]} |

## 운영 메모

\`\`\`bash
${post.command}
\`\`\`

## 첨부 자료

![${post.title}](${imageUrl})

- [운영 메모 파일](${noteUrl})
`;
}

function createPostDefinitions() {
  const blogPosts = [
    {
      title: "[테스트] Ubuntu 서버 첫 점검 체크리스트",
      summary: "VMware Ubuntu 환경에서 패키지 상태, 포트 확인, PM2 재시작 여부를 한 번에 점검하는 흐름을 정리했습니다.",
      tags: ["ubuntu", "pm2", "nginx"],
      categorySlug: "deploy-lab",
      status: "PUBLISHED",
      isPinned: true,
      checks: ["systemctl 상태 확인", "Nginx 리버스 프록시 점검", "PM2 자동 시작 재확인"],
      command: "sudo systemctl status nginx\npm2 status\ncurl -I http://127.0.0.1",
    },
    {
      title: "[테스트] Next.js App Router 구조 정리",
      summary: "app 디렉터리 기준으로 공개 페이지와 관리자 페이지를 나누는 방법을 테스트용 글로 정리했습니다.",
      tags: ["nextjs", "app-router", "typescript"],
      categorySlug: "study-log",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["layout과 page 역할 구분", "동적 라우트 구조 확인", "관리자 경로 접근 제어 점검"],
      command: "npm run dev\nnpm run build",
    },
    {
      title: "[테스트] Prisma 마이그레이션 흐름 메모",
      summary: "로컬 PostgreSQL 스키마를 바꾼 뒤 마이그레이션을 적용하고 화면까지 연결하는 흐름을 기록했습니다.",
      tags: ["prisma", "postgresql", "migration"],
      categorySlug: "study-log",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["schema 수정", "migrate 실행", "build 검증"],
      command: "npm run prisma:migrate -- --name add_test_fields\nnpm run build",
    },
    {
      title: "[테스트] PostgreSQL 로컬 연결 트러블슈팅",
      summary: "DATABASE_URL, 비밀번호, 서비스 상태를 기준으로 로컬 연결 문제를 점검하는 절차를 정리했습니다.",
      tags: ["postgresql", "database", "troubleshooting"],
      categorySlug: "study-log",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["서비스 상태 확인", "환경변수 점검", "연결 문자열 검증"],
      command: "npm run prisma:studio\nGet-Service postgresql-x64-17",
    },
    {
      title: "[테스트] Supabase Storage 전환 기록",
      summary: "로컬 파일 저장에서 Supabase Storage로 바꿀 때 필요한 URL, 키, 버킷 설정을 점검했습니다.",
      tags: ["supabase", "storage", "upload"],
      categorySlug: "deploy-lab",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["버킷 public 설정", "secret key 확인", "공개 URL 저장 검증"],
      command: "npm run dev\n# 첨부파일 업로드 후 admin 화면 확인",
    },
    {
      title: "[테스트] Ubuntu Nginx 리버스 프록시 실험",
      summary: "Next.js 개발 서버를 Nginx 뒤에 두고 80 포트로 연결하는 흐름을 초안 상태로 남겨 두었습니다.",
      tags: ["ubuntu", "nginx", "reverse-proxy"],
      categorySlug: "deploy-lab",
      status: "DRAFT",
      isPinned: false,
      checks: ["sites-available 설정", "nginx -t 검증", "localhost 80 응답 확인"],
      command: "sudo nginx -t\nsudo systemctl restart nginx",
    },
    {
      title: "[테스트] PM2 재시작 정책 확인",
      summary: "프로세스 재시작과 reboot 이후 상태가 어떻게 유지되는지 확인한 내용을 정리했습니다.",
      tags: ["pm2", "process", "linux"],
      categorySlug: "deploy-lab",
      status: "DRAFT",
      isPinned: false,
      checks: ["pm2 save 실행", "startup 스크립트 확인", "재부팅 후 online 여부 점검"],
      command: "pm2 startup\npm2 save\npm2 status",
    },
    {
      title: "[테스트] AWS EC2 배포 준비 노트",
      summary: "실제 외부 공개 배포로 넘어가기 전에 보안 그룹, SSH, 도메인 계획을 미리 정리한 보관 글입니다.",
      tags: ["aws", "ec2", "deployment"],
      categorySlug: "deploy-lab",
      status: "ARCHIVED",
      isPinned: false,
      checks: ["보안 그룹 포트 설계", "SSH 키 관리", "도메인 연결 순서 정리"],
      command: "aws ec2 describe-instances\n# 보안 그룹과 퍼블릭 IP 확인",
    },
    {
      title: "[테스트] Markdown 기반 글쓰기 운영 팁",
      summary: "Markdown 본문, 코드 블록, 첨부파일 복사 흐름을 같이 테스트하기 위한 샘플 글입니다.",
      tags: ["markdown", "editor", "content"],
      categorySlug: "study-log",
      status: "PUBLISHED",
      isPinned: true,
      checks: ["코드 블록 렌더링", "링크 문법 확인", "이미지 삽입 확인"],
      command: "npm run dev\n# 관리자 미리보기에서 Markdown 확인",
    },
    {
      title: "[테스트] 관리자 권한 구조 메모",
      summary: "관리자 로그인, 공개 페이지, 초안 미리보기의 역할을 분리해 보는 연습용 글입니다.",
      tags: ["auth", "admin", "preview"],
      categorySlug: "study-log",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["로그인 후 /admin 접근", "초안 미리보기 전용 경로 확인", "공개 페이지 노출 범위 점검"],
      command: "npm run dev\n# /login -> /admin -> /admin/posts/[id]/preview",
    },
  ];

  const boardPosts = [
    {
      title: "[테스트] 3월 18일 운영 점검 메모",
      summary: "관리자 화면 검색, 첨부파일 업로드, Supabase 버킷 연결 상태를 한 번에 점검한 운영 메모입니다.",
      tags: ["ops", "checklist", "supabase"],
      categorySlug: "ops-notice",
      status: "PUBLISHED",
      isPinned: true,
      checks: ["관리자 검색 확인", "첨부파일 공개 URL 점검", "Supabase 버킷 반영 확인"],
      command: "npm run dev\n# /admin 에서 필터와 검색 테스트",
    },
    {
      title: "[테스트] 첨부파일 업로드 테스트 결과",
      summary: "이미지와 일반 파일을 함께 업로드했을 때 관리자 화면과 공개 상세 화면이 어떻게 보이는지 기록했습니다.",
      tags: ["attachment", "upload", "qa"],
      categorySlug: "qa-notes",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["이미지 썸네일 노출", "파일 열기 링크 확인", "Markdown 복사 버튼 점검"],
      command: "npm run dev\n# edit 페이지에서 파일 업로드",
    },
    {
      title: "[테스트] 카테고리 정리 안내",
      summary: "블로그와 게시판에서 어떤 카테고리를 쓸지 테스트용으로 정리해 둔 공지입니다.",
      tags: ["category", "board", "notice"],
      categorySlug: "ops-notice",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["기본 카테고리 확인", "추가 카테고리 활용", "필터 동작 점검"],
      command: "npm run dev\n# /blog 와 /board 카테고리 필터 확인",
    },
    {
      title: "[테스트] 배포 전 체크 항목",
      summary: "환경변수, 빌드 성공, 업로드 동작 여부를 배포 전에 다시 확인하기 위한 초안 게시글입니다.",
      tags: ["deploy", "check", "env"],
      categorySlug: "ops-notice",
      status: "DRAFT",
      isPinned: false,
      checks: ["환경변수 점검", "build 성공 여부", "로그인/업로드 확인"],
      command: "npm run lint\nnpm run build",
    },
    {
      title: "[테스트] Supabase 버킷 정책 메모",
      summary: "public 버킷과 파일 크기 제한, secret key 사용 규칙을 운영 메모로 정리했습니다.",
      tags: ["supabase", "bucket", "policy"],
      categorySlug: "cloud-memo",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["public 설정 확인", "6MB 제한 점검", "secret key 보안 관리"],
      command: "Storage > uploads > Edit bucket",
    },
    {
      title: "[테스트] 로컬 DB 백업 점검",
      summary: "로컬 PostgreSQL을 기준으로 백업 파일과 복구 절차를 정리한 보관용 메모입니다.",
      tags: ["backup", "postgresql", "ops"],
      categorySlug: "cloud-memo",
      status: "ARCHIVED",
      isPinned: false,
      checks: ["백업 파일 보관 위치", "복구 명령 점검", "테스트 데이터 재생성 계획"],
      command: "pg_dump cloud_board_lab > backup.sql",
    },
    {
      title: "[테스트] 404 이슈 재현 기록",
      summary: "상세보기 링크와 slug 처리에서 발생한 404 문제를 재현하고 수정 방향을 메모로 남겼습니다.",
      tags: ["404", "routing", "debug"],
      categorySlug: "qa-notes",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["id 기반 링크 확인", "slug fallback 확인", "prefetch 영향 점검"],
      command: "npm run dev\n# /blog 목록 -> 상세 이동 확인",
    },
    {
      title: "[테스트] 관리자 검색 필터 QA",
      summary: "유형, 상태, 검색어를 동시에 걸었을 때 페이지네이션이 유지되는지 테스트한 초안입니다.",
      tags: ["admin", "search", "pagination"],
      categorySlug: "qa-notes",
      status: "DRAFT",
      isPinned: false,
      checks: ["검색어 유지", "페이지 이동 유지", "필터 초기화 버튼 확인"],
      command: "npm run dev\n# /admin?q=test&type=BLOG&status=PUBLISHED",
    },
    {
      title: "[테스트] 테스트 데이터 정리 공지",
      summary: "시드 데이터와 실제 운영 데이터를 구분하기 위해 제목과 slug 규칙을 맞추는 메모입니다.",
      tags: ["seed", "data", "notice"],
      categorySlug: "ops-notice",
      status: "PUBLISHED",
      isPinned: true,
      checks: ["seed slug prefix 사용", "테스트 이미지 구분", "운영 전 정리 기준 마련"],
      command: "npm run seed:test-posts",
    },
    {
      title: "[테스트] 다음 주 개발 계획",
      summary: "배포 단계로 넘어가기 전 남은 기능과 점검 순서를 정리한 게시판용 계획 글입니다.",
      tags: ["plan", "roadmap", "board"],
      categorySlug: "cloud-memo",
      status: "PUBLISHED",
      isPinned: false,
      checks: ["Ubuntu 배포 준비", "로그 확인 흐름 정리", "운영 체크리스트 완성"],
      command: "npm run build\n# Ubuntu + PM2 + Nginx 배포 진행 예정",
    },
  ];

  return [
    ...blogPosts.map((post, index) => ({
      ...post,
      type: "BLOG",
      slug: `seed-blog-${String(index + 1).padStart(2, "0")}-${slugify(post.title.replace("[테스트]", ""))}`,
      accent: "#f97316",
    })),
    ...boardPosts.map((post, index) => ({
      ...post,
      type: "BOARD",
      slug: `seed-board-${String(index + 1).padStart(2, "0")}-${slugify(post.title.replace("[테스트]", ""))}`,
      accent: "#0ea5e9",
    })),
  ];
}

async function ensureAdminUser(client) {
  const email = process.env.LOCAL_ADMIN_EMAIL ?? "admin@cloudboard.local";
  const name = process.env.LOCAL_ADMIN_NAME ?? "로컬 관리자";
  const password = process.env.LOCAL_ADMIN_PASSWORD ?? "change-me-1234";

  const existing = await client.query(
    'SELECT id FROM "User" WHERE email = $1 LIMIT 1',
    [email],
  );

  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }

  const id = cuidLike();
  const passwordHash = await hash(password, 10);
  const now = new Date();

  await client.query(
    `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ADMIN', $5, $5)`,
    [id, name, email, passwordHash, now],
  );

  return id;
}

async function upsertCategory(client, category) {
  const id = cuidLike();
  const now = new Date();
  const result = await client.query(
    `INSERT INTO "Category" ("id", "name", "slug", "description", "type", "isDefault", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
     ON CONFLICT ("slug") DO UPDATE
     SET "name" = EXCLUDED."name",
         "description" = EXCLUDED."description",
         "type" = EXCLUDED."type",
         "isDefault" = EXCLUDED."isDefault",
         "updatedAt" = EXCLUDED."updatedAt"
     RETURNING id, slug`,
    [id, category.name, category.slug, category.description, category.type, category.isDefault, now],
  );

  return result.rows[0];
}

async function upsertTag(client, tagName) {
  const slug = slugify(tagName);
  const id = cuidLike();
  const now = new Date();
  const result = await client.query(
    `INSERT INTO "Tag" ("id", "name", "slug", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT ("slug") DO UPDATE
     SET "name" = EXCLUDED."name",
         "updatedAt" = EXCLUDED."updatedAt"
     RETURNING id`,
    [id, tagName, slug, now],
  );

  return result.rows[0].id;
}

async function cleanupExistingSeedData(client) {
  const attachments = await client.query(
    `SELECT a."storagePath"
     FROM "Attachment" a
     INNER JOIN "Post" p ON p.id = a."postId"
     WHERE p.slug LIKE 'seed-%' AND a."storageBucket" = $1`,
    [SUPABASE_BUCKET],
  );

  if (attachments.rows.length > 0) {
    await removeFiles(attachments.rows.map((row) => row.storagePath));
  }

  await client.query(`DELETE FROM "Post" WHERE slug LIKE 'seed-%'`);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const authorId = await ensureAdminUser(client);

  const categoryMap = new Map();
  for (const category of [
    {
      name: "학습 기록",
      slug: "study-log",
      description: "개발 학습 과정과 실습 메모를 정리하는 기본 블로그 카테고리입니다.",
      type: "BLOG",
      isDefault: true,
    },
    {
      name: "배포 실습",
      slug: "deploy-lab",
      description: "서버 배포와 운영 점검 흐름을 기록하는 블로그 카테고리입니다.",
      type: "BLOG",
      isDefault: false,
    },
    {
      name: "운영 메모",
      slug: "ops-notice",
      description: "공지와 운영 메모를 정리하는 기본 게시판 카테고리입니다.",
      type: "BOARD",
      isDefault: true,
    },
    {
      name: "QA 메모",
      slug: "qa-notes",
      description: "테스트와 검수 기록을 모으는 게시판 카테고리입니다.",
      type: "BOARD",
      isDefault: false,
    },
    {
      name: "클라우드 메모",
      slug: "cloud-memo",
      description: "클라우드 설정과 운영 정책을 정리하는 게시판 카테고리입니다.",
      type: "BOARD",
      isDefault: false,
    },
  ]) {
    const row = await upsertCategory(client, category);
    categoryMap.set(row.slug, row.id);
  }

  await cleanupExistingSeedData(client);

  const definitions = createPostDefinitions();
  let uploadedFiles = 0;

  for (let index = 0; index < definitions.length; index += 1) {
    const post = definitions[index];
    const postId = cuidLike();
    const createdAt = new Date(Date.now() - (definitions.length - index) * 1000 * 60 * 60 * 12);
    const updatedAt = new Date(createdAt.getTime() + 1000 * 60 * 30);
    const publishedAt = post.status === "PUBLISHED" ? updatedAt : null;
    const viewCount =
      post.status === "PUBLISHED" ? 24 + index * 7 : post.status === "DRAFT" ? 0 : 8 + index * 2;

    const imageStoragePath = `posts/${postId}/${Date.now()}-${post.slug}-cover.svg`;
    const noteStoragePath = `posts/${postId}/${Date.now()}-${post.slug}-notes.md`;

    const imageUrl = await uploadFile(
      imageStoragePath,
      makeSvgBuffer({
        title: post.title,
        subtitle: post.summary,
        accent: post.accent,
        meta: `${post.type} · ${post.status} · ${post.tags.join(", ")}`,
      }),
      "image/svg+xml",
    );

    const noteUrl = await uploadFile(
      noteStoragePath,
      Buffer.from(buildNoteContent(post), "utf8"),
      "text/markdown",
    );

    uploadedFiles += 2;

    const content =
      post.type === "BLOG"
        ? buildBlogContent(post, imageUrl, noteUrl)
        : buildBoardContent(post, imageUrl, noteUrl);

    const excerpt = `${post.summary} 관리자 화면과 공개 화면에서 모두 점검할 수 있도록 구성했습니다.`;

    await client.query(
      `INSERT INTO "Post" (
        "id", "title", "slug", "excerpt", "content", "type", "status", "isPinned",
        "viewCount", "publishedAt", "authorId", "categoryId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14
      )`,
      [
        postId,
        post.title,
        post.slug,
        excerpt,
        content,
        post.type,
        post.status,
        post.isPinned,
        viewCount,
        publishedAt,
        authorId,
        categoryMap.get(post.categorySlug) ?? null,
        createdAt,
        updatedAt,
      ],
    );

    for (const tagName of post.tags) {
      const tagId = await upsertTag(client, tagName);
      await client.query(
        `INSERT INTO "PostTag" ("postId", "tagId", "assignedAt")
         VALUES ($1, $2, $3)
         ON CONFLICT ("postId", "tagId") DO NOTHING`,
        [postId, tagId, updatedAt],
      );
    }

    await client.query(
      `INSERT INTO "Attachment" (
        "id", "postId", "uploaderId", "kind", "fileName", "originalName",
        "mimeType", "fileSize", "storageBucket", "storagePath", "publicUrl", "createdAt"
      ) VALUES
      ($1, $2, $3, 'IMAGE', $4, $5, 'image/svg+xml', $6, $7, $8, $9, $10),
      ($11, $2, $3, 'FILE', $12, $13, 'text/markdown', $14, $7, $15, $16, $10)`,
      [
        cuidLike(),
        postId,
        authorId,
        imageStoragePath.split("/").pop(),
        `${post.slug}-cover.svg`,
        makeSvgBuffer({
          title: post.title,
          subtitle: post.summary,
          accent: post.accent,
          meta: `${post.type} · ${post.status} · ${post.tags.join(", ")}`,
        }).length,
        SUPABASE_BUCKET,
        imageStoragePath,
        imageUrl,
        updatedAt,
        cuidLike(),
        noteStoragePath.split("/").pop(),
        `${post.slug}-notes.md`,
        Buffer.byteLength(buildNoteContent(post), "utf8"),
        noteStoragePath,
        noteUrl,
      ],
    );
  }

  const summary = await client.query(
    `SELECT
       COUNT(*) FILTER (WHERE slug LIKE 'seed-blog-%')::int AS blog_count,
       COUNT(*) FILTER (WHERE slug LIKE 'seed-board-%')::int AS board_count,
       COUNT(*) FILTER (WHERE status = 'PUBLISHED' AND slug LIKE 'seed-%')::int AS published_count,
       COUNT(*) FILTER (WHERE status = 'DRAFT' AND slug LIKE 'seed-%')::int AS draft_count,
       COUNT(*) FILTER (WHERE status = 'ARCHIVED' AND slug LIKE 'seed-%')::int AS archived_count
     FROM "Post"`,
  );

  console.log(
    JSON.stringify(
      {
        createdPosts: 20,
        uploadedFiles,
        summary: summary.rows[0],
      },
      null,
      2,
    ),
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
