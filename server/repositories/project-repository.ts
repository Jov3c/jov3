import type { PrismaClient } from '../generated/prisma/client';

import type {
  ProjectCreateInput,
  ProjectReorderInput,
  ProjectUpdateInput,
} from '../../shared/schemas/project';

const projectOrderBy = [
  { sortOrder: 'asc' as const },
  { createdAt: 'asc' as const },
  { id: 'asc' as const },
];

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.project.findMany({ orderBy: projectOrderBy });
  }

  listVisible() {
    return this.prisma.project.findMany({ where: { visible: true }, orderBy: projectOrderBy });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  findVisibleBySlug(slug: string) {
    return this.prisma.project.findFirst({ where: { slug, visible: true } });
  }

  findBySlug(slug: string) {
    return this.prisma.project.findUnique({ where: { slug } });
  }

  create(input: ProjectCreateInput) {
    return this.prisma.project.create({ data: input });
  }

  update(id: string, input: ProjectUpdateInput) {
    return this.prisma.project.update({ where: { id }, data: input });
  }

  delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  reorder(input: ProjectReorderInput['ids']) {
    return this.prisma.$transaction(
      input.map((id, index) =>
        this.prisma.project.update({
          where: { id },
          data: { sortOrder: (index + 1) * 10 },
        }),
      ),
    );
  }
}
