import { renderMarkdown } from '../../shared/markdown';
import {
  timelineEntrySchema,
  timelineEntryUpdateSchema,
  type TimelineEntryInput,
  type TimelineEntryUpdateInput,
} from '../../shared/schemas/cv-timeline';
import type { TimelineRepository } from '../repositories/timeline-repository';

export class TimelineError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'TimelineError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type TimelineRecord = NonNullable<Awaited<ReturnType<TimelineRepository['findById']>>>;

export class TimelineService {
  constructor(private readonly repository: TimelineRepository) {}

  async listPublic() {
    return (await this.repository.listPublic()).map(toPublicDto);
  }

  async listAdmin() {
    return (await this.repository.listAdmin()).map(toAdminDto);
  }

  async create(input: TimelineEntryInput) {
    const parsed = timelineEntrySchema.safeParse(input);
    if (!parsed.success) throw invalidTimelineError();
    await this.ensureRelations(parsed.data);
    const created = await this.repository.create(parsed.data);
    if (!created)
      throw new TimelineError(503, 'TIMELINE_NOT_CONFIGURED', 'Timeline entry was not created');
    return toAdminDto(created);
  }

  async update(id: string, input: TimelineEntryUpdateInput) {
    const current = await this.requireEntry(id);
    const parsed = timelineEntrySchema.safeParse({
      eventDate: formatDate(current.eventDate),
      datePrecision: current.datePrecision,
      title: current.title,
      bodyMarkdown: current.bodyMarkdown,
      sortOrder: current.sortOrder,
      visible: current.visible,
      mediaIds: current.media.map((item) => item.media.id),
      links: current.links.map(({ label, url, sortOrder }) => ({ label, url, sortOrder })),
      projectIds: current.projectRefs.map((item) => item.projectId),
      ...input,
    });
    if (!parsed.success) throw invalidTimelineError();
    await this.ensureRelations(parsed.data);
    const updated = await this.repository.update(id, parsed.data);
    if (!updated)
      throw new TimelineError(404, 'TIMELINE_ENTRY_NOT_FOUND', 'Timeline entry not found');
    return toAdminDto(updated);
  }

  async delete(id: string) {
    await this.requireEntry(id);
    await this.repository.delete(id);
    return { deleted: true };
  }

  private async requireEntry(id: string) {
    const entry = await this.repository.findById(id);
    if (!entry)
      throw new TimelineError(404, 'TIMELINE_ENTRY_NOT_FOUND', 'Timeline entry not found');
    return entry;
  }

  private async ensureRelations(input: TimelineEntryInput) {
    const [media, projects] = await Promise.all([
      this.repository.findMediaByIds(input.mediaIds),
      this.repository.findProjectsByIds(input.projectIds),
    ]);
    if (media.length !== input.mediaIds.length) {
      throw new TimelineError(
        400,
        'MEDIA_NOT_FOUND',
        'One or more timeline media assets were not found',
      );
    }
    if (projects.length !== input.projectIds.length) {
      throw new TimelineError(
        400,
        'PROJECT_NOT_FOUND',
        'One or more timeline projects were not found',
      );
    }
  }
}

export function timelineApiError(error: unknown) {
  if (error instanceof TimelineError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function toPublicDto(entry: TimelineRecord) {
  return {
    id: entry.id,
    eventDate: formatDate(entry.eventDate),
    datePrecision: entry.datePrecision,
    dateLabel: formatDateLabel(entry.eventDate, entry.datePrecision),
    title: entry.title,
    bodyHtml: renderMarkdown(entry.bodyMarkdown),
    media: entry.media.map((item) => ({
      id: item.media.id,
      publicUrl: item.media.publicUrl,
      altText: item.media.altText,
      sortOrder: item.sortOrder,
    })),
    links: entry.links.map(({ label, url, sortOrder }) => ({ label, url, sortOrder })),
    projects: entry.projectRefs
      .filter((ref) => ref.project.visible)
      .map((ref) => ({
        id: ref.project.id,
        slug: ref.project.slug,
        name: ref.project.name,
        summary: ref.project.summary,
        status: ref.project.status,
      })),
  };
}

function toAdminDto(entry: TimelineRecord) {
  return {
    ...toPublicDto(entry),
    bodyMarkdown: entry.bodyMarkdown,
    sortOrder: entry.sortOrder,
    visible: entry.visible,
    mediaIds: entry.media.map((item) => item.media.id),
    projectIds: entry.projectRefs.map((ref) => ref.projectId),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateLabel(value: Date, precision: TimelineRecord['datePrecision']) {
  const date = formatDate(value);
  if (precision === 'YEAR') return date.slice(0, 4);
  if (precision === 'MONTH') return date.slice(0, 7).replace('-', '.');
  return date.replaceAll('-', '.');
}

function invalidTimelineError() {
  return new TimelineError(400, 'INVALID_TIMELINE_ENTRY', 'Timeline entry fields are invalid');
}
