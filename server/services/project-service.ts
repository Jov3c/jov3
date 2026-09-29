import type { Project } from '../generated/prisma/client';

import { PROJECT_STATUSES, type ProjectStatus } from '../../shared/constants/project';
import type { ProjectCreateInput, ProjectUpdateInput } from '../../shared/schemas/project';
import { renderMarkdown } from '../../shared/markdown';
import type { ProjectRepository } from '../repositories/project-repository';

export class ProjectError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'ProjectError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  async listPublic() {
    const projects = await this.repository.listVisible();
    return { items: projects.map(toPublicListDto) };
  }

  async getPublicBySlug(slug: string) {
    const project = await this.repository.findVisibleBySlug(slug);
    if (!project) throw new ProjectError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    return toPublicDetailDto(project);
  }

  async listAdmin() {
    const projects = await this.repository.listAll();
    return { items: projects.map(toAdminDto) };
  }

  async getAdminById(id: string) {
    const project = await this.repository.findById(id);
    if (!project) throw new ProjectError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    return toAdminDto(project);
  }

  async create(input: ProjectCreateInput) {
    validateProjectInput(input);
    try {
      return toAdminDto(await this.repository.create(normalizeCreateInput(input)));
    } catch (error) {
      throw mapProjectPersistenceError(error);
    }
  }

  async update(id: string, input: ProjectUpdateInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new ProjectError(404, 'PROJECT_NOT_FOUND', 'Project not found');

    const next = { ...toProjectInput(current), ...input };
    validateProjectInput(next);
    try {
      return toAdminDto(await this.repository.update(id, normalizeUpdateInput(input)));
    } catch (error) {
      throw mapProjectPersistenceError(error);
    }
  }

  async delete(id: string) {
    const current = await this.repository.findById(id);
    if (!current) throw new ProjectError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    await this.repository.delete(id);
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    const projects = await this.repository.listAll();
    const existingIds = new Set(projects.map((project) => project.id));
    const requestedIds = new Set(ids);
    if (
      ids.length !== projects.length ||
      requestedIds.size !== ids.length ||
      ids.some((id) => !existingIds.has(id))
    ) {
      throw new ProjectError(
        400,
        'INVALID_PROJECT_ORDER',
        'Project order must contain every project exactly once',
      );
    }

    await this.repository.reorder(ids);
    return this.listAdmin();
  }
}

export function projectApiError(error: unknown) {
  if (error instanceof ProjectError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function toProjectInput(project: Project): ProjectCreateInput {
  return {
    slug: project.slug,
    name: project.name,
    summary: project.summary,
    status: project.status as ProjectStatus,
    techStack: project.techStack,
    githubUrl: project.githubUrl,
    demoUrl: project.demoUrl,
    readmeMarkdown: project.readmeMarkdown,
    sortOrder: project.sortOrder,
    visible: project.visible,
  };
}

function normalizeCreateInput(input: ProjectCreateInput) {
  return {
    ...input,
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    summary: input.summary.trim(),
    techStack: normalizeTechStack(input.techStack),
    githubUrl: normalizeOptionalUrl(input.githubUrl),
    demoUrl: normalizeOptionalUrl(input.demoUrl),
    readmeMarkdown: input.readmeMarkdown.trim(),
  };
}

function normalizeUpdateInput(input: ProjectUpdateInput) {
  return {
    ...(input.slug === undefined ? {} : { slug: input.slug.trim().toLowerCase() }),
    ...(input.name === undefined ? {} : { name: input.name.trim() }),
    ...(input.summary === undefined ? {} : { summary: input.summary.trim() }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.techStack === undefined ? {} : { techStack: normalizeTechStack(input.techStack) }),
    ...(input.githubUrl === undefined ? {} : { githubUrl: normalizeOptionalUrl(input.githubUrl) }),
    ...(input.demoUrl === undefined ? {} : { demoUrl: normalizeOptionalUrl(input.demoUrl) }),
    ...(input.readmeMarkdown === undefined ? {} : { readmeMarkdown: input.readmeMarkdown.trim() }),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
    ...(input.visible === undefined ? {} : { visible: input.visible }),
  };
}

function validateProjectInput(input: ProjectCreateInput) {
  if (!PROJECT_STATUSES.includes(input.status)) {
    throw new ProjectError(400, 'INVALID_PROJECT_STATUS', 'Project status is invalid');
  }
  validateGithubUrl(input.githubUrl);
  validateDemoUrl(input.demoUrl);
}

function validateGithubUrl(value: string | null) {
  if (value === null) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname)) {
      throw new Error('github-host');
    }
  } catch {
    throw new ProjectError(400, 'INVALID_GITHUB_URL', 'GitHub URL must use github.com over HTTPS');
  }
}

function validateDemoUrl(value: string | null) {
  if (value === null) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('demo-protocol');
  } catch {
    throw new ProjectError(400, 'INVALID_DEMO_URL', 'Demo URL must use HTTP or HTTPS');
  }
}

function normalizeOptionalUrl(value: string | null) {
  return value?.trim() || null;
}

function normalizeTechStack(techStack: string[]) {
  return [...new Set(techStack.map((item) => item.trim()).filter(Boolean))];
}

function mapProjectPersistenceError(error: unknown) {
  if (error instanceof Error && 'code' in error && error.code === 'P2002') {
    return new ProjectError(409, 'PROJECT_SLUG_CONFLICT', 'Project slug is already in use');
  }
  return error;
}

function toPublicListDto(project: Project) {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    summary: project.summary,
    status: project.status,
    techStack: project.techStack,
    githubUrl: project.githubUrl,
    demoUrl: project.demoUrl,
    sortOrder: project.sortOrder,
  };
}

function toPublicDetailDto(project: Project) {
  return {
    ...toPublicListDto(project),
    readmeHtml: renderMarkdown(project.readmeMarkdown),
  };
}

function toAdminDto(project: Project) {
  return {
    ...toPublicListDto(project),
    readmeMarkdown: project.readmeMarkdown,
    visible: project.visible,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
