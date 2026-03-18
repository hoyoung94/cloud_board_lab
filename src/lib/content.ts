import { AttachmentKind, PostStatus, PostType, Prisma, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { db } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  {
    name: "학습 기록",
    slug: "study-log",
    description: "개발 학습 과정과 실습 메모를 정리하는 기본 블로그 카테고리입니다.",
    type: PostType.BLOG,
  },
  {
    name: "운영 메모",
    slug: "ops-notice",
    description: "공지와 운영 메모를 정리하는 기본 게시판 카테고리입니다.",
    type: PostType.BOARD,
  },
] as const;

export const POSTS_PER_PAGE = 6;
export const ADMIN_POSTS_PER_PAGE = 10;

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: PostType;
  isDefault: boolean;
};

export type CategoryExploreItem = CategoryOption & {
  postCount: number;
};

export type TagSummary = {
  id: string;
  name: string;
  slug: string;
};

export type TagExploreItem = TagSummary & {
  postCount: number;
};

export type AttachmentSummary = {
  id: string;
  kind: AttachmentKind;
  fileName: string;
  originalName: string | null;
  mimeType: string;
  fileSize: number;
  storageBucket: string;
  storagePath: string;
  publicUrl: string | null;
  createdAt: Date;
};

export type PublicPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  type: PostType;
  isPinned: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  authorName: string | null;
  viewCount: number;
  attachmentCount: number;
  category: CategoryOption | null;
  tags: TagSummary[];
};

export type PostDetail = PublicPostSummary & {
  content: string;
  attachments: AttachmentSummary[];
};

export type PreviewPostDetail = PostDetail & {
  status: PostStatus;
};

export type AdminPostListItem = PublicPostSummary & {
  status: PostStatus;
};

export type EditablePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: PostType;
  status: PostStatus;
  isPinned: boolean;
  categoryId: string;
  tags: string;
  attachments: AttachmentSummary[];
};

export type PostFilterParams = {
  categorySlug?: string;
  tagSlug?: string;
  searchQuery?: string;
  page?: number;
};

export type AdminPostFilterParams = {
  searchQuery?: string;
  status?: PostStatus;
  type?: PostType;
  page?: number;
};

export type CollectionExploreData = {
  categories: CategoryExploreItem[];
  tags: TagExploreItem[];
  activeCategory: CategoryExploreItem | null;
  activeTag: TagExploreItem | null;
};

export type HomeExploreData = {
  blog: CollectionExploreData;
  board: CollectionExploreData;
};

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginatedPostList = {
  items: PublicPostSummary[];
  pagination: PaginationInfo;
};

export type PaginatedAdminPostList = {
  posts: AdminPostListItem[];
  pagination: PaginationInfo;
  stats: {
    total: number;
    published: number;
    drafts: number;
    archived: number;
    blog: number;
    board: number;
    pinned: number;
    localAttachments: number;
    supabaseAttachments: number;
  };
};

type QueryResult<T> = {
  data: T;
  error: string | null;
};

function normalizeText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.normalize("NFC") : undefined;
}

function normalizePage(value?: number) {
  if (!value || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function createExcerpt(content: string, excerpt?: string | null) {
  if (excerpt?.trim()) {
    return excerpt.trim();
  }

  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137)}...`;
}

function mapCategory(
  category:
    | {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        type: PostType;
        isDefault: boolean;
      }
    | null
    | undefined,
) {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    type: category.type,
    isDefault: category.isDefault,
  } satisfies CategoryOption;
}

function mapTags(tags: Array<{ tag: { id: string; name: string; slug: string } }>) {
  return tags.map(({ tag }) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}

function mapAttachments(
  attachments: Array<{
    id: string;
    kind: AttachmentKind;
    fileName: string;
    originalName: string | null;
    mimeType: string;
    fileSize: number;
    storageBucket: string;
    storagePath: string;
    publicUrl: string | null;
    createdAt: Date;
  }>,
) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    kind: attachment.kind,
    fileName: attachment.fileName,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    storageBucket: attachment.storageBucket,
    storagePath: attachment.storagePath,
    publicUrl: attachment.publicUrl,
    createdAt: attachment.createdAt,
  }));
}

function mapPublicPost(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  type: PostType;
  status?: PostStatus;
  isPinned: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  author: {
    name: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: PostType;
    isDefault: boolean;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    attachments: number;
  };
}) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: createExcerpt(post.content, post.excerpt),
    type: post.type,
    isPinned: post.isPinned,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    authorName: post.author.name,
    viewCount: post.viewCount,
    attachmentCount: post._count.attachments,
    category: mapCategory(post.category),
    tags: mapTags(post.tags),
  } satisfies PublicPostSummary;
}

function mapAdminPost(post: Parameters<typeof mapPublicPost>[0] & { status: PostStatus }) {
  return {
    ...mapPublicPost(post),
    status: post.status,
  } satisfies AdminPostListItem;
}

function getReadableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("Can't reach database server")) {
      return "로컬 PostgreSQL 연결에 실패했습니다. 데이터베이스 실행 상태와 DATABASE_URL을 확인해 주세요.";
    }

    return error.message;
  }

  return "데이터 조회 중 문제가 발생했습니다.";
}

async function queryWithFallback<T>(
  action: () => Promise<T>,
  fallback: T,
): Promise<QueryResult<T>> {
  try {
    const data = await action();
    return { data, error: null };
  } catch (error) {
    console.error(error);
    return { data: fallback, error: getReadableErrorMessage(error) };
  }
}

function getPostRelationSelect() {
  return {
    author: {
      select: {
        name: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
        isDefault: true,
      },
    },
    tags: {
      orderBy: {
        assignedAt: "asc" as const,
      },
      select: {
        tag: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
    _count: {
      select: {
        attachments: true,
      },
    },
  };
}

function getAttachmentSelect() {
  return {
    attachments: {
      orderBy: {
        createdAt: "asc" as const,
      },
      select: {
        id: true,
        kind: true,
        fileName: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        storageBucket: true,
        storagePath: true,
        publicUrl: true,
        createdAt: true,
      },
    },
  };
}

function buildPublishedPostWhere(type: PostType, filters?: PostFilterParams): Prisma.PostWhereInput {
  const categorySlug = normalizeText(filters?.categorySlug);
  const tagSlug = normalizeText(filters?.tagSlug);
  const searchQuery = normalizeText(filters?.searchQuery);

  return {
    type,
    status: PostStatus.PUBLISHED,
    ...(categorySlug
      ? {
          category: {
            slug: categorySlug,
          },
        }
      : {}),
    ...(tagSlug
      ? {
          tags: {
            some: {
              tag: {
                slug: tagSlug,
              },
            },
          },
        }
      : {}),
    ...(searchQuery
      ? {
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              excerpt: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              category: {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            },
            {
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: searchQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
}

function buildAdminPostWhere(filters?: AdminPostFilterParams): Prisma.PostWhereInput {
  const searchQuery = normalizeText(filters?.searchQuery);

  return {
    ...(filters?.type ? { type: filters.type } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(searchQuery
      ? {
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              excerpt: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              category: {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            },
            {
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: searchQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
}

function createPaginationInfo(totalCount: number, requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(normalizePage(requestedPage), totalPages);

  return {
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  } satisfies PaginationInfo;
}

export function getDatabaseSetupState() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    return {
      configured: false,
      message: "DATABASE_URL이 비어 있습니다.",
    };
  }

  if (value.includes("postgresql://postgres:password@localhost:5432/cloud_board_lab")) {
    return {
      configured: false,
      message:
        "예시 DATABASE_URL이 그대로 남아 있습니다. 로컬 PostgreSQL 비밀번호를 실제 값으로 바꿔 주세요.",
    };
  }

  return {
    configured: true,
    message: null,
  };
}

export async function ensureDefaultCategories() {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      db.category.upsert({
        where: {
          slug: category.slug,
        },
        update: {
          name: category.name,
          description: category.description,
          type: category.type,
          isDefault: true,
        },
        create: {
          ...category,
          isDefault: true,
        },
      }),
    ),
  );
}

export async function listCategoryOptions(type?: PostType) {
  return queryWithFallback(
    async () => {
      await ensureDefaultCategories();

      const categories = await db.category.findMany({
        where: type ? { type } : undefined,
        orderBy: [{ type: "asc" }, { isDefault: "desc" }, { name: "asc" }],
      });

      return categories.map((category) => mapCategory(category)!);
    },
    [] as CategoryOption[],
  );
}

export async function getHomeSnapshot() {
  const recentBlogPromise = queryWithFallback(
    async () => {
      const posts = await db.post.findMany({
        where: {
          type: PostType.BLOG,
          status: PostStatus.PUBLISHED,
        },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 3,
        include: getPostRelationSelect(),
      });

      return posts.map(mapPublicPost);
    },
    [] as PublicPostSummary[],
  );

  const recentBoardPromise = queryWithFallback(
    async () => {
      const posts = await db.post.findMany({
        where: {
          type: PostType.BOARD,
          status: PostStatus.PUBLISHED,
        },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 3,
        include: getPostRelationSelect(),
      });

      return posts.map(mapPublicPost);
    },
    [] as PublicPostSummary[],
  );

  const countPromise = queryWithFallback(
    async () => {
      const [blogCount, boardCount, publishedCount] = await Promise.all([
        db.post.count({
          where: {
            type: PostType.BLOG,
            status: PostStatus.PUBLISHED,
          },
        }),
        db.post.count({
          where: {
            type: PostType.BOARD,
            status: PostStatus.PUBLISHED,
          },
        }),
        db.post.count({
          where: {
            status: PostStatus.PUBLISHED,
          },
        }),
      ]);

      return { blogCount, boardCount, publishedCount };
    },
    {
      blogCount: 0,
      boardCount: 0,
      publishedCount: 0,
    },
  );

  const [recentBlogResult, recentBoardResult, countResult] = await Promise.all([
    recentBlogPromise,
    recentBoardPromise,
    countPromise,
  ]);

  return {
    recentBlogPosts: recentBlogResult.data,
    recentBoardPosts: recentBoardResult.data,
    counts: countResult.data,
    error: recentBlogResult.error ?? recentBoardResult.error ?? countResult.error,
  };
}

export async function listPublishedPosts(type: PostType, filters?: PostFilterParams) {
  return queryWithFallback(
    async () => {
      const where = buildPublishedPostWhere(type, filters);
      const totalCount = await db.post.count({ where });
      const pagination = createPaginationInfo(totalCount, filters?.page ?? 1, POSTS_PER_PAGE);

      const posts = await db.post.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
        skip: (pagination.currentPage - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: getPostRelationSelect(),
      });

      return {
        items: posts.map(mapPublicPost),
        pagination,
      } satisfies PaginatedPostList;
    },
    {
      items: [],
      pagination: createPaginationInfo(0, 1, POSTS_PER_PAGE),
    } satisfies PaginatedPostList,
  );
}

export async function getCollectionExploreData(type: PostType, filters?: PostFilterParams) {
  return queryWithFallback(
    async () => {
      await ensureDefaultCategories();

      const [categories, tags] = await Promise.all([
        db.category.findMany({
          where: { type },
          orderBy: [{ isDefault: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            isDefault: true,
            posts: {
              where: {
                status: PostStatus.PUBLISHED,
                type,
              },
              select: {
                id: true,
              },
            },
          },
        }),
        db.tag.findMany({
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            posts: {
              where: {
                post: {
                  status: PostStatus.PUBLISHED,
                  type,
                },
              },
              select: {
                postId: true,
              },
            },
          },
        }),
      ]);

      const mappedCategories = categories
        .map((category) => ({
          ...mapCategory(category)!,
          postCount: category.posts.length,
        }))
        .filter((category) => category.postCount > 0 || category.isDefault);

      const mappedTags = tags
        .map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          postCount: tag.posts.length,
        }))
        .filter((tag) => tag.postCount > 0)
        .sort((left, right) =>
          right.postCount === left.postCount
            ? left.name.localeCompare(right.name, "ko")
            : right.postCount - left.postCount,
        )
        .slice(0, 12);

      const activeCategorySlug = normalizeText(filters?.categorySlug);
      const activeTagSlug = normalizeText(filters?.tagSlug);

      return {
        categories: mappedCategories,
        tags: mappedTags,
        activeCategory:
          mappedCategories.find((category) => category.slug === activeCategorySlug) ?? null,
        activeTag: mappedTags.find((tag) => tag.slug === activeTagSlug) ?? null,
      } satisfies CollectionExploreData;
    },
    {
      categories: [],
      tags: [],
      activeCategory: null,
      activeTag: null,
    } satisfies CollectionExploreData,
  );
}

export async function getHomeExploreData() {
  const [blogResult, boardResult] = await Promise.all([
    getCollectionExploreData(PostType.BLOG),
    getCollectionExploreData(PostType.BOARD),
  ]);

  return {
    data: {
      blog: blogResult.data,
      board: boardResult.data,
    } satisfies HomeExploreData,
    error: blogResult.error ?? boardResult.error,
  };
}

async function findPublishedPost(type: PostType, key: string) {
  const include = {
    ...getPostRelationSelect(),
    ...getAttachmentSelect(),
  };

  const byId = await db.post.findUnique({
    where: { id: key },
    include,
  });

  if (byId && byId.type === type && byId.status === PostStatus.PUBLISHED) {
    return byId;
  }

  return db.post.findFirst({
    where: {
      type,
      slug: normalizeText(key),
      status: PostStatus.PUBLISHED,
    },
    include,
  });
}

export async function getPublishedPostBySlug(type: PostType, key: string) {
  return queryWithFallback(
    async () => {
      const post = await findPublishedPost(type, key);

      if (!post) {
        return null;
      }

      await db.post.update({
        where: { id: post.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return {
        ...mapPublicPost({
          ...post,
          viewCount: post.viewCount + 1,
        }),
        content: post.content,
        attachments: mapAttachments(post.attachments),
      } satisfies PostDetail;
    },
    null as PostDetail | null,
  );
}

export async function getPreviewPostById(id: string) {
  return queryWithFallback(
    async () => {
      const post = await db.post.findUnique({
        where: { id },
        include: {
          ...getPostRelationSelect(),
          ...getAttachmentSelect(),
        },
      });

      if (!post) {
        return null;
      }

      return {
        ...mapPublicPost(post),
        status: post.status,
        content: post.content,
        attachments: mapAttachments(post.attachments),
      } satisfies PreviewPostDetail;
    },
    null as PreviewPostDetail | null,
  );
}

export async function getAdminDashboardData(filters?: AdminPostFilterParams) {
  return queryWithFallback(
    async () => {
      const where = buildAdminPostWhere(filters);
      const totalCount = await db.post.count({ where });
      const pagination = createPaginationInfo(totalCount, filters?.page ?? 1, ADMIN_POSTS_PER_PAGE);

      const [posts, stats] = await Promise.all([
        db.post.findMany({
          where,
          orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
          skip: (pagination.currentPage - 1) * pagination.pageSize,
          take: pagination.pageSize,
          include: getPostRelationSelect(),
        }),
        (async () => {
          const [
            total,
            published,
            drafts,
            archived,
            blog,
            board,
            pinned,
            localAttachments,
            supabaseAttachments,
          ] = await Promise.all([
            db.post.count(),
            db.post.count({
              where: { status: PostStatus.PUBLISHED },
            }),
            db.post.count({
              where: { status: PostStatus.DRAFT },
            }),
            db.post.count({
              where: { status: PostStatus.ARCHIVED },
            }),
            db.post.count({
              where: { type: PostType.BLOG },
            }),
            db.post.count({
              where: { type: PostType.BOARD },
            }),
            db.post.count({
              where: { isPinned: true },
            }),
            db.attachment.count({
              where: { storageBucket: "local-public" },
            }),
            db.attachment.count({
              where: { storageBucket: "uploads" },
            }),
          ]);

          return {
            total,
            published,
            drafts,
            archived,
            blog,
            board,
            pinned,
            localAttachments,
            supabaseAttachments,
          };
        })(),
      ]);

      return {
        posts: posts.map(mapAdminPost),
        pagination,
        stats,
      } satisfies PaginatedAdminPostList;
    },
    {
      posts: [],
      pagination: createPaginationInfo(0, 1, ADMIN_POSTS_PER_PAGE),
      stats: {
        total: 0,
        published: 0,
        drafts: 0,
        archived: 0,
        blog: 0,
        board: 0,
        pinned: 0,
        localAttachments: 0,
        supabaseAttachments: 0,
      },
    } satisfies PaginatedAdminPostList,
  );
}

export async function getEditablePostById(id: string) {
  return queryWithFallback(
    async () => {
      const post = await db.post.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          type: true,
          status: true,
          isPinned: true,
          categoryId: true,
          tags: {
            orderBy: { assignedAt: "asc" },
            select: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
          attachments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              kind: true,
              fileName: true,
              originalName: true,
              mimeType: true,
              fileSize: true,
              storageBucket: true,
              storagePath: true,
              publicUrl: true,
              createdAt: true,
            },
          },
        },
      });

      if (!post) {
        return null;
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content,
        type: post.type,
        status: post.status,
        isPinned: post.isPinned,
        categoryId: post.categoryId ?? "",
        tags: post.tags.map(({ tag }) => tag.name).join(", "),
        attachments: mapAttachments(post.attachments),
      } satisfies EditablePost;
    },
    null as EditablePost | null,
  );
}

export async function ensureLocalAdminUser() {
  const adminName = process.env.LOCAL_ADMIN_NAME ?? "로컬 관리자";
  const adminEmail = process.env.LOCAL_ADMIN_EMAIL ?? "admin@cloudboard.local";
  const adminPassword = process.env.LOCAL_ADMIN_PASSWORD ?? "change-me-1234";
  const passwordHash = await hash(adminPassword, 10);

  const existing = await db.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (!existing) {
    return db.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        role: UserRole.ADMIN,
        passwordHash,
      },
    });
  }

  return db.user.update({
    where: {
      id: existing.id,
    },
    data: {
      name: adminName,
      role: UserRole.ADMIN,
      passwordHash,
    },
  });
}
