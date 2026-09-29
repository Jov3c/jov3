import type { PrismaClient } from '../generated/prisma/client';

import type {
  AdminPostListQuery,
  CategoryCreateInput,
  CategoryUpdateInput,
  PostCreateInput,
} from '../../shared/schemas/blog';

const postInclude = {
  category: true,
  coverMedia: { select: { id: true, publicUrl: true, altText: true } },
} as const;

const postOrderBy = [
  { publishedAt: 'desc' as const },
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
];

const categoryOrderBy = [
  { sortOrder: 'asc' as const },
  { createdAt: 'asc' as const },
  { id: 'asc' as const },
];

type PostPersistenceInput = Omit<PostCreateInput, 'publishedAt'> & {
  publishedAt: Date | null;
  wordCount: number;
};

export class BlogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublicPosts(query: { page: number; pageSize: number; category: string }) {
    const where = {
      status: 'PUBLISHED' as const,
      ...(query.category
        ? { category: { slug: query.category, visible: true } }
        : { category: { visible: true } }),
    };
    const [items, total, aggregate] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: postOrderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
      this.prisma.post.aggregate({ where, _sum: { wordCount: true } }),
    ]);
    return { items, total, totalWords: aggregate._sum.wordCount ?? 0 };
  }

  findPublicPostBySlug(slug: string) {
    return this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED', category: { visible: true } },
      include: postInclude,
    });
  }

  incrementPostViewCount(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: postInclude,
    });
  }

  listPublishedPostsForArchive() {
    return this.prisma.post.findMany({
      where: { status: 'PUBLISHED', category: { visible: true } },
      include: postInclude,
      orderBy: postOrderBy,
    });
  }

  async listPublicCategories() {
    const [categories, counts, aggregate] = await Promise.all([
      this.prisma.postCategory.findMany({ where: { visible: true }, orderBy: categoryOrderBy }),
      this.prisma.post.groupBy({
        by: ['categoryId'],
        where: { status: 'PUBLISHED', category: { visible: true } },
        _count: { _all: true },
      }),
      this.prisma.post.aggregate({
        where: { status: 'PUBLISHED', category: { visible: true } },
        _count: { _all: true },
        _sum: { wordCount: true },
      }),
    ]);
    return {
      categories,
      counts: new Map(counts.map((item) => [item.categoryId, item._count._all])),
      totalPosts: aggregate._count._all,
      totalWords: aggregate._sum.wordCount ?? 0,
    };
  }

  async listAdminPosts(query: AdminPostListQuery) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({ where, include: postInclude, orderBy: postOrderBy }),
      this.prisma.post.count({ where }),
    ]);
    return { items, total };
  }

  findAdminPostById(id: string) {
    return this.prisma.post.findUnique({ where: { id }, include: postInclude });
  }

  findPostBySlug(slug: string) {
    return this.prisma.post.findUnique({ where: { slug } });
  }

  createPost(input: PostPersistenceInput) {
    return this.prisma.post.create({
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        categoryId: input.categoryId,
        coverMediaId: input.coverMediaId,
        markdownBody: input.markdownBody,
        status: input.status,
        publishedAt: input.publishedAt,
        wordCount: input.wordCount,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
      },
      include: postInclude,
    });
  }

  updatePost(id: string, input: Partial<PostPersistenceInput>) {
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(input.slug === undefined ? {} : { slug: input.slug }),
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.excerpt === undefined ? {} : { excerpt: input.excerpt }),
        ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
        ...(input.coverMediaId === undefined ? {} : { coverMediaId: input.coverMediaId }),
        ...(input.markdownBody === undefined ? {} : { markdownBody: input.markdownBody }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.publishedAt === undefined ? {} : { publishedAt: input.publishedAt }),
        ...(input.wordCount === undefined ? {} : { wordCount: input.wordCount }),
        ...(input.seoTitle === undefined ? {} : { seoTitle: input.seoTitle }),
        ...(input.seoDescription === undefined ? {} : { seoDescription: input.seoDescription }),
      },
      include: postInclude,
    });
  }

  deletePost(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async listAdminCategories() {
    const categories = await this.prisma.postCategory.findMany({ orderBy: categoryOrderBy });
    const postCounts = await Promise.all(
      categories.map(
        async (category) =>
          [
            category.id,
            await this.prisma.post.count({ where: { categoryId: category.id } }),
          ] as const,
      ),
    );
    return { categories, postCounts: new Map(postCounts) };
  }

  findCategoryById(id: string) {
    return this.prisma.postCategory.findUnique({ where: { id } });
  }

  findCategoryBySlug(slug: string) {
    return this.prisma.postCategory.findUnique({ where: { slug } });
  }

  createCategory(input: CategoryCreateInput) {
    return this.prisma.postCategory.create({ data: input });
  }

  updateCategory(id: string, input: CategoryUpdateInput) {
    return this.prisma.postCategory.update({ where: { id }, data: input });
  }

  deleteCategory(id: string) {
    return this.prisma.postCategory.delete({ where: { id } });
  }

  countPostsInCategory(id: string) {
    return this.prisma.post.count({ where: { categoryId: id } });
  }

  findMedia(id: string) {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }
}
