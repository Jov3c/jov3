import type { Post } from '../generated/prisma/client';

import type { PostStatus } from '../../shared/constants/blog';
import { renderMarkdown } from '../../shared/markdown';
import { countMarkdownWords } from '../../shared/word-count';
import {
  categoryCreateSchema,
  postCreateSchema,
  type AdminPostListQuery,
  type CategoryCreateInput,
  type CategoryUpdateInput,
  type PostCreateInput,
  type PostListQuery,
  type PostUpdateInput,
} from '../../shared/schemas/blog';
import type { BlogRepository } from '../repositories/blog-repository';

export class BlogError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'BlogError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface BlogPostRecord extends Post {
  category: {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    visible: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  coverMedia: { id: string; publicUrl: string; altText: string | null } | null;
}

export class BlogService {
  constructor(private readonly repository: BlogRepository) {}

  async listPublicPosts(query: PostListQuery) {
    const result = await this.repository.listPublicPosts({
      ...query,
      category: query.category.trim().toLowerCase(),
    });
    return {
      items: result.items.map(toPublicListDto),
      total: result.total,
      stats: { totalPosts: result.total, totalWords: result.totalWords },
    };
  }

  async getPublicPostBySlug(slug: string) {
    const current = await this.repository.findPublicPostBySlug(slug.trim().toLowerCase());
    if (!current) throw new BlogError(404, 'POST_NOT_FOUND', 'Post not found');
    const post = await this.repository.incrementPostViewCount(current.id);
    return toPublicDetailDto(post);
  }

  async listPublicCategories() {
    const result = await this.repository.listPublicCategories();
    return {
      items: result.categories.map((category) => ({
        ...category,
        postCount: result.counts.get(category.id) ?? 0,
      })),
      stats: {
        totalPosts: result.totalPosts,
        totalCategories: result.categories.length,
        totalWords: result.totalWords,
      },
    };
  }

  async listArchive() {
    const posts = await this.repository.listPublishedPostsForArchive();
    const years = new Map<
      number,
      Map<
        string,
        { id: string; title: string; slug: string; category: string; publishedAt: string }[]
      >
    >();
    for (const post of posts) {
      const publishedAt = post.publishedAt ?? post.createdAt;
      const isoDate = publishedAt.toISOString();
      const year = Number(isoDate.slice(0, 4));
      const month = isoDate.slice(5, 7);
      const yearMonths = years.get(year) ?? new Map();
      const items = yearMonths.get(month) ?? [];
      items.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category.name,
        publishedAt: isoDate,
      });
      yearMonths.set(month, items);
      years.set(year, yearMonths);
    }

    return {
      years: [...years.entries()].map(([year, months]) => ({
        year,
        articleCount: [...months.values()].reduce((sum, items) => sum + items.length, 0),
        months: [...months.entries()].map(([month, items]) => ({ month, items })),
      })),
      total: posts.length,
    };
  }

  async listAdminPosts(query: AdminPostListQuery) {
    const result = await this.repository.listAdminPosts(query);
    return { items: result.items.map(toAdminDto), total: result.total };
  }

  async getAdminPost(id: string) {
    const post = await this.repository.findAdminPostById(id);
    if (!post) throw new BlogError(404, 'POST_NOT_FOUND', 'Post not found');
    return toAdminDto(post);
  }

  async createPost(input: PostCreateInput) {
    validatePostInput(input);
    await this.ensureReferences(input.categoryId, input.coverMediaId);
    try {
      return toAdminDto(
        await this.repository.createPost({
          ...normalizePostCreateInput(input),
          publishedAt: normalizePublishedAt(input.status, input.publishedAt),
          wordCount: countMarkdownWords(input.markdownBody),
        }),
      );
    } catch (error) {
      throw mapPersistenceError(error);
    }
  }

  async updatePost(id: string, input: PostUpdateInput) {
    const current = await this.repository.findAdminPostById(id);
    if (!current) throw new BlogError(404, 'POST_NOT_FOUND', 'Post not found');
    const next = { ...toPostInput(current), ...input };
    validatePostInput(next);
    await this.ensureReferences(next.categoryId, next.coverMediaId);
    const normalized = normalizePostUpdateInput(input);
    try {
      return toAdminDto(
        await this.repository.updatePost(id, {
          ...normalized,
          ...(input.markdownBody === undefined
            ? {}
            : { wordCount: countMarkdownWords(input.markdownBody) }),
          ...(input.status === undefined && input.publishedAt === undefined
            ? {}
            : {
                publishedAt: normalizePublishedAt(
                  next.status,
                  input.publishedAt ?? current.publishedAt?.toISOString() ?? null,
                  current.publishedAt,
                ),
              }),
        }),
      );
    } catch (error) {
      throw mapPersistenceError(error);
    }
  }

  async publishPost(id: string) {
    const current = await this.repository.findAdminPostById(id);
    if (!current) throw new BlogError(404, 'POST_NOT_FOUND', 'Post not found');
    return toAdminDto(
      await this.repository.updatePost(id, {
        status: 'PUBLISHED',
        publishedAt: current.publishedAt ?? new Date(),
        wordCount: countMarkdownWords(current.markdownBody),
      }),
    );
  }

  async unpublishPost(id: string) {
    const current = await this.repository.findAdminPostById(id);
    if (!current) throw new BlogError(404, 'POST_NOT_FOUND', 'Post not found');
    return toAdminDto(await this.repository.updatePost(id, { status: 'DRAFT', publishedAt: null }));
  }

  async deletePost(id: string) {
    const current = await this.repository.findAdminPostById(id);
    if (!current) throw new BlogError(404, 'POST_NOT_FOUND', 'Post not found');
    await this.repository.deletePost(id);
    return { deleted: true };
  }

  async listAdminCategories() {
    const result = await this.repository.listAdminCategories();
    return {
      items: result.categories.map((category) => ({
        ...category,
        postCount: result.postCounts.get(category.id) ?? 0,
      })),
    };
  }

  async createCategory(input: CategoryCreateInput) {
    const parsed = categoryCreateSchema.safeParse(input);
    if (!parsed.success)
      throw new BlogError(400, 'INVALID_CATEGORY', 'Category fields are invalid');
    try {
      return toCategoryDto(
        await this.repository.createCategory(normalizeCategoryCreateInput(parsed.data)),
        0,
      );
    } catch (error) {
      throw mapPersistenceError(error, 'CATEGORY_SLUG_CONFLICT', 'Category slug is already in use');
    }
  }

  async updateCategory(id: string, input: CategoryUpdateInput) {
    const current = await this.repository.findCategoryById(id);
    if (!current) throw new BlogError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    const parsed = categoryCreateSchema.safeParse({ ...current, ...input });
    if (!parsed.success)
      throw new BlogError(400, 'INVALID_CATEGORY', 'Category fields are invalid');
    try {
      const category = await this.repository.updateCategory(
        id,
        normalizeCategoryUpdateInput(input),
      );
      return toCategoryDto(category, await this.repository.countPostsInCategory(id));
    } catch (error) {
      throw mapPersistenceError(error, 'CATEGORY_SLUG_CONFLICT', 'Category slug is already in use');
    }
  }

  async deleteCategory(id: string) {
    const current = await this.repository.findCategoryById(id);
    if (!current) throw new BlogError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    if ((await this.repository.countPostsInCategory(id)) > 0) {
      throw new BlogError(
        409,
        'CATEGORY_IN_USE',
        'Move or delete posts before deleting this category',
      );
    }
    await this.repository.deleteCategory(id);
    return { deleted: true };
  }

  private async ensureReferences(categoryId: string, coverMediaId: string | null) {
    if (!(await this.repository.findCategoryById(categoryId))) {
      throw new BlogError(400, 'CATEGORY_NOT_FOUND', 'Post category not found');
    }
    if (coverMediaId && !(await this.repository.findMedia(coverMediaId))) {
      throw new BlogError(400, 'COVER_MEDIA_NOT_FOUND', 'Cover media asset not found');
    }
  }
}

export function blogApiError(error: unknown) {
  if (error instanceof BlogError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function validatePostInput(input: PostCreateInput) {
  const parsed = postCreateSchema.safeParse(input);
  if (!parsed.success) throw new BlogError(400, 'INVALID_POST', 'Post fields are invalid');
}

function normalizeCategoryCreateInput(input: CategoryCreateInput): CategoryCreateInput {
  return {
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    sortOrder: input.sortOrder,
    visible: input.visible,
  };
}

function normalizeCategoryUpdateInput(input: CategoryUpdateInput) {
  return {
    ...(input.slug === undefined ? {} : { slug: input.slug.trim().toLowerCase() }),
    ...(input.name === undefined ? {} : { name: input.name.trim() }),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
    ...(input.visible === undefined ? {} : { visible: input.visible }),
  };
}

function normalizePostCreateInput(input: PostCreateInput) {
  return {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    categoryId: input.categoryId,
    coverMediaId: input.coverMediaId,
    markdownBody: input.markdownBody.trim(),
    status: input.status,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
  };
}

function normalizePostUpdateInput(input: PostUpdateInput) {
  return {
    ...(input.slug === undefined ? {} : { slug: input.slug.trim().toLowerCase() }),
    ...(input.title === undefined ? {} : { title: input.title.trim() }),
    ...(input.excerpt === undefined ? {} : { excerpt: input.excerpt.trim() }),
    ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
    ...(input.coverMediaId === undefined ? {} : { coverMediaId: input.coverMediaId }),
    ...(input.markdownBody === undefined ? {} : { markdownBody: input.markdownBody.trim() }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.seoTitle === undefined ? {} : { seoTitle: input.seoTitle?.trim() || null }),
    ...(input.seoDescription === undefined
      ? {}
      : { seoDescription: input.seoDescription?.trim() || null }),
  };
}

function normalizePublishedAt(
  status: PostStatus,
  value: string | null | undefined,
  fallback?: Date | null,
) {
  if (status === 'DRAFT') return null;
  if (value) return new Date(value);
  return fallback ?? new Date();
}

function toPostInput(
  post: Post & { category: { id: string }; coverMediaId: string | null },
): PostCreateInput {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    categoryId: post.categoryId,
    coverMediaId: post.coverMediaId,
    markdownBody: post.markdownBody,
    status: post.status as PostStatus,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  };
}

function toCategoryDto(
  category: {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    visible: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  postCount: number,
) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    sortOrder: category.sortOrder,
    visible: category.visible,
    postCount,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function toMediaDto(media: { id: string; publicUrl: string; altText: string | null } | null) {
  return media ? { id: media.id, publicUrl: media.publicUrl, altText: media.altText } : null;
}

function toPublicListDto(post: BlogPostRecord) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: { id: post.category.id, slug: post.category.slug, name: post.category.name },
    cover: toMediaDto(post.coverMedia),
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    wordCount: post.wordCount,
    viewCount: Number(post.viewCount),
    commentCount: 0,
  };
}

function toPublicDetailDto(post: BlogPostRecord) {
  return {
    ...toPublicListDto(post),
    contentHtml: renderMarkdown(post.markdownBody),
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  };
}

function toAdminDto(post: BlogPostRecord) {
  return {
    ...toPublicListDto(post),
    markdownBody: post.markdownBody,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    visible: post.status === 'PUBLISHED',
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function mapPersistenceError(
  error: unknown,
  code = 'POST_SLUG_CONFLICT',
  message = 'Post slug is already in use',
) {
  if (error instanceof Error && 'code' in error && error.code === 'P2002') {
    return new BlogError(409, code, message);
  }
  return error;
}
