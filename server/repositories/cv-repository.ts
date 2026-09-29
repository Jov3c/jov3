import type { PrismaClient } from '../generated/prisma/client';

import type {
  CvEducationInput,
  CvEducationUpdateInput,
  CvExperienceInput,
  CvExperienceUpdateInput,
  CvProfileUpdateInput,
  CvSkillGroupInput,
  CvSkillGroupUpdateInput,
} from '../../shared/schemas/cv-timeline';

const mediaSelect = { id: true, publicUrl: true, altText: true } as const;
const projectSelect = {
  id: true,
  slug: true,
  name: true,
  summary: true,
  status: true,
  visible: true,
} as const;

const aggregateInclude = {
  portraitMedia: { select: mediaSelect },
  experiences: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  educations: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  skillGroups: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  projectRefs: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    include: { project: { select: projectSelect } },
  },
};

export class CvRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAggregate() {
    return this.prisma.cvProfile.findFirst({ include: aggregateInclude });
  }

  updateProfile(id: string, input: CvProfileUpdateInput) {
    return this.prisma.cvProfile.update({
      where: { id },
      data: toProfileData(input),
      include: aggregateInclude,
    });
  }

  findMedia(id: string) {
    return this.prisma.mediaAsset.findUnique({ where: { id }, select: mediaSelect });
  }

  findProjectsByIds(ids: string[]) {
    return this.prisma.project.findMany({ where: { id: { in: ids } }, select: projectSelect });
  }

  createExperience(profileId: string, input: CvExperienceInput) {
    return this.prisma.cvExperience.create({
      data: { profileId, ...toExperienceCreateData(input) },
    });
  }

  updateExperience(id: string, input: CvExperienceUpdateInput) {
    return this.prisma.cvExperience.update({ where: { id }, data: toExperienceData(input) });
  }

  findExperience(id: string) {
    return this.prisma.cvExperience.findUnique({ where: { id } });
  }

  deleteExperience(id: string) {
    return this.prisma.cvExperience.delete({ where: { id } });
  }

  createEducation(profileId: string, input: CvEducationInput) {
    return this.prisma.cvEducation.create({ data: { profileId, ...toEducationCreateData(input) } });
  }

  updateEducation(id: string, input: CvEducationUpdateInput) {
    return this.prisma.cvEducation.update({ where: { id }, data: toEducationData(input) });
  }

  findEducation(id: string) {
    return this.prisma.cvEducation.findUnique({ where: { id } });
  }

  deleteEducation(id: string) {
    return this.prisma.cvEducation.delete({ where: { id } });
  }

  createSkillGroup(profileId: string, input: CvSkillGroupInput) {
    return this.prisma.cvSkillGroup.create({ data: { profileId, ...input } });
  }

  updateSkillGroup(id: string, input: CvSkillGroupUpdateInput) {
    return this.prisma.cvSkillGroup.update({ where: { id }, data: input });
  }

  findSkillGroup(id: string) {
    return this.prisma.cvSkillGroup.findUnique({ where: { id } });
  }

  deleteSkillGroup(id: string) {
    return this.prisma.cvSkillGroup.delete({ where: { id } });
  }

  async replaceProjects(profileId: string, projectIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.cvProjectRef.deleteMany({ where: { profileId } });
      if (projectIds.length) {
        await tx.cvProjectRef.createMany({
          data: projectIds.map((projectId, index) => ({
            profileId,
            projectId,
            sortOrder: (index + 1) * 10,
          })),
        });
      }
    });
    return this.getAggregate();
  }
}

function toProfileData(input: CvProfileUpdateInput) {
  return {
    ...(input.isPublic === undefined ? {} : { isPublic: input.isPublic }),
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.headline === undefined ? {} : { headline: input.headline }),
    ...(input.bio === undefined ? {} : { bio: input.bio }),
    ...(input.location === undefined ? {} : { location: input.location }),
    ...(input.website === undefined ? {} : { website: input.website }),
    ...(input.statusText === undefined ? {} : { statusText: input.statusText }),
    ...(input.statement === undefined ? {} : { statement: input.statement }),
    ...(input.portraitMediaId === undefined ? {} : { portraitMediaId: input.portraitMediaId }),
  };
}

function toExperienceData<T extends Partial<CvExperienceInput>>(input: T) {
  return {
    ...(input.company === undefined ? {} : { company: input.company }),
    ...(input.role === undefined ? {} : { role: input.role }),
    ...(input.location === undefined ? {} : { location: input.location }),
    ...(input.startDate === undefined ? {} : { startDate: toDate(input.startDate) }),
    ...(input.endDate === undefined
      ? {}
      : { endDate: input.endDate === null ? null : toDate(input.endDate) }),
    ...(input.isCurrent === undefined ? {} : { isCurrent: input.isCurrent }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
  };
}

function toExperienceCreateData(input: CvExperienceInput) {
  return {
    company: input.company,
    role: input.role,
    location: input.location,
    startDate: toDate(input.startDate),
    endDate: input.endDate === null ? null : toDate(input.endDate),
    isCurrent: input.isCurrent,
    description: input.description,
    sortOrder: input.sortOrder,
  };
}

function toEducationData<T extends Partial<CvEducationInput>>(input: T) {
  return {
    ...(input.school === undefined ? {} : { school: input.school }),
    ...(input.major === undefined ? {} : { major: input.major }),
    ...(input.degree === undefined ? {} : { degree: input.degree }),
    ...(input.startDate === undefined ? {} : { startDate: toDate(input.startDate) }),
    ...(input.endDate === undefined
      ? {}
      : { endDate: input.endDate === null ? null : toDate(input.endDate) }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
  };
}

function toEducationCreateData(input: CvEducationInput) {
  return {
    school: input.school,
    major: input.major,
    degree: input.degree,
    startDate: toDate(input.startDate),
    endDate: input.endDate === null ? null : toDate(input.endDate),
    description: input.description,
    sortOrder: input.sortOrder,
  };
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
