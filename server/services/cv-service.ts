import {
  cvEducationSchema,
  cvEducationUpdateSchema,
  cvExperienceSchema,
  cvExperienceUpdateSchema,
  cvProfileUpdateSchema,
  cvProjectRefsSchema,
  cvSkillGroupSchema,
  cvSkillGroupUpdateSchema,
  type CvEducationInput,
  type CvEducationUpdateInput,
  type CvExperienceInput,
  type CvExperienceUpdateInput,
  type CvProfileUpdateInput,
  type CvSkillGroupInput,
  type CvSkillGroupUpdateInput,
} from '../../shared/schemas/cv-timeline';
import type { CvRepository } from '../repositories/cv-repository';

export class CvError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'CvError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type CvAggregate = NonNullable<Awaited<ReturnType<CvRepository['getAggregate']>>>;

export class CvService {
  constructor(private readonly repository: CvRepository) {}

  async getPublic() {
    const aggregate = await this.requireAggregate();
    if (!aggregate.isPublic) throw new CvError(404, 'CV_NOT_PUBLIC', 'CV is not public');
    return toPublicDto(aggregate);
  }

  async getAdmin() {
    return toAdminDto(await this.requireAggregate());
  }

  async updateProfile(input: CvProfileUpdateInput) {
    const parsed = cvProfileUpdateSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    const current = await this.requireAggregate();
    await this.ensurePortrait(parsed.data.portraitMediaId);
    return toAdminDto(await this.repository.updateProfile(current.id, parsed.data));
  }

  async createExperience(input: CvExperienceInput) {
    const parsed = cvExperienceSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    const profile = await this.requireAggregate();
    await this.repository.createExperience(profile.id, parsed.data);
    return this.getAdmin();
  }

  async updateExperience(id: string, input: CvExperienceUpdateInput) {
    const parsed = cvExperienceUpdateSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    await this.requireItem(this.repository.findExperience(id), 'CV_EXPERIENCE_NOT_FOUND');
    await this.repository.updateExperience(id, parsed.data);
    return this.getAdmin();
  }

  async deleteExperience(id: string) {
    await this.requireItem(this.repository.findExperience(id), 'CV_EXPERIENCE_NOT_FOUND');
    await this.repository.deleteExperience(id);
    return { deleted: true };
  }

  async createEducation(input: CvEducationInput) {
    const parsed = cvEducationSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    const profile = await this.requireAggregate();
    await this.repository.createEducation(profile.id, parsed.data);
    return this.getAdmin();
  }

  async updateEducation(id: string, input: CvEducationUpdateInput) {
    const parsed = cvEducationUpdateSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    await this.requireItem(this.repository.findEducation(id), 'CV_EDUCATION_NOT_FOUND');
    await this.repository.updateEducation(id, parsed.data);
    return this.getAdmin();
  }

  async deleteEducation(id: string) {
    await this.requireItem(this.repository.findEducation(id), 'CV_EDUCATION_NOT_FOUND');
    await this.repository.deleteEducation(id);
    return { deleted: true };
  }

  async createSkillGroup(input: CvSkillGroupInput) {
    const parsed = cvSkillGroupSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    const profile = await this.requireAggregate();
    await this.repository.createSkillGroup(profile.id, parsed.data);
    return this.getAdmin();
  }

  async updateSkillGroup(id: string, input: CvSkillGroupUpdateInput) {
    const parsed = cvSkillGroupUpdateSchema.safeParse(input);
    if (!parsed.success) throw invalidCvError();
    await this.requireItem(this.repository.findSkillGroup(id), 'CV_SKILL_GROUP_NOT_FOUND');
    await this.repository.updateSkillGroup(id, parsed.data);
    return this.getAdmin();
  }

  async deleteSkillGroup(id: string) {
    await this.requireItem(this.repository.findSkillGroup(id), 'CV_SKILL_GROUP_NOT_FOUND');
    await this.repository.deleteSkillGroup(id);
    return { deleted: true };
  }

  async replaceProjects(input: unknown) {
    const parsed = cvProjectRefsSchema.safeParse(
      Array.isArray(input) ? { projectIds: input } : input,
    );
    if (!parsed.success) throw invalidCvError();
    const profile = await this.requireAggregate();
    const projects = await this.repository.findProjectsByIds(parsed.data.projectIds);
    if (projects.length !== parsed.data.projectIds.length) {
      throw new CvError(400, 'PROJECT_NOT_FOUND', 'One or more selected projects do not exist');
    }
    const updated = await this.repository.replaceProjects(profile.id, parsed.data.projectIds);
    if (!updated) throw new CvError(503, 'CV_NOT_CONFIGURED', 'CV profile is not available');
    return toAdminDto(updated);
  }

  private async requireAggregate() {
    const aggregate = await this.repository.getAggregate();
    if (!aggregate) throw new CvError(503, 'CV_NOT_CONFIGURED', 'CV profile is not available');
    return aggregate;
  }

  private async ensurePortrait(id: string | null | undefined) {
    if (id === undefined || id === null) return;
    if (!(await this.repository.findMedia(id))) {
      throw new CvError(400, 'MEDIA_NOT_FOUND', 'Portrait media was not found');
    }
  }

  private async requireItem<T>(promise: Promise<T | null>, code: string) {
    if (!(await promise)) throw new CvError(404, code, 'CV item was not found');
  }
}

export function cvApiError(error: unknown) {
  if (error instanceof CvError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function toPublicDto(aggregate: CvAggregate) {
  return {
    profile: {
      name: aggregate.name,
      headline: aggregate.headline,
      bio: aggregate.bio,
      location: aggregate.location,
      website: aggregate.website,
      statusText: aggregate.statusText,
      statement: aggregate.statement,
      portrait: aggregate.portraitMedia
        ? {
            id: aggregate.portraitMedia.id,
            publicUrl: aggregate.portraitMedia.publicUrl,
            altText: aggregate.portraitMedia.altText,
          }
        : null,
    },
    experiences: aggregate.experiences.map(toExperienceDto),
    educations: aggregate.educations.map(toEducationDto),
    skills: aggregate.skillGroups.map(toSkillDto),
    projects: aggregate.projectRefs
      .filter((ref) => ref.project.visible)
      .map((ref) => toProjectDto(ref.project)),
  };
}

function toAdminDto(aggregate: CvAggregate) {
  return {
    id: aggregate.id,
    isPublic: aggregate.isPublic,
    name: aggregate.name,
    headline: aggregate.headline,
    bio: aggregate.bio,
    location: aggregate.location,
    website: aggregate.website,
    statusText: aggregate.statusText,
    statement: aggregate.statement,
    portraitMediaId: aggregate.portraitMediaId,
    portrait: aggregate.portraitMedia,
    updatedAt: aggregate.updatedAt.toISOString(),
    experiences: aggregate.experiences.map(toExperienceDto),
    educations: aggregate.educations.map(toEducationDto),
    skills: aggregate.skillGroups.map(toSkillDto),
    projects: aggregate.projectRefs.map((ref) => ({
      ...toProjectDto(ref.project),
      sortOrder: ref.sortOrder,
    })),
  };
}

function toExperienceDto(item: CvAggregate['experiences'][number]) {
  return {
    id: item.id,
    company: item.company,
    role: item.role,
    location: item.location,
    startDate: item.startDate.toISOString().slice(0, 10),
    endDate: item.endDate?.toISOString().slice(0, 10) ?? null,
    isCurrent: item.isCurrent,
    description: item.description,
    sortOrder: item.sortOrder,
  };
}

function toEducationDto(item: CvAggregate['educations'][number]) {
  return {
    id: item.id,
    school: item.school,
    major: item.major,
    degree: item.degree,
    startDate: item.startDate.toISOString().slice(0, 10),
    endDate: item.endDate?.toISOString().slice(0, 10) ?? null,
    description: item.description,
    sortOrder: item.sortOrder,
  };
}

function toSkillDto(item: CvAggregate['skillGroups'][number]) {
  return { id: item.id, title: item.title, content: item.content, sortOrder: item.sortOrder };
}

function toProjectDto(project: CvAggregate['projectRefs'][number]['project']) {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    summary: project.summary,
    status: project.status,
  };
}

function invalidCvError() {
  return new CvError(400, 'INVALID_CV', 'CV fields are invalid');
}
