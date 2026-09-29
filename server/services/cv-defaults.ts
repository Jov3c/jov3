import type { PrismaClient } from '../generated/prisma/client';

const DEFAULT_PROFILE = {
  isPublic: true,
  name: '朱鹏 / Jov3',
  headline: 'AI Application · Solutions · Forward Deployed',
  bio: '喜欢把 AI、产品和工程真正落到可用的东西上。关注部署、集成、工作流和长期维护，而不是只停留在 Demo。',
  location: 'Chengdu, China',
  website: 'https://jov3.cloud',
  statusText: 'Open to AI roles',
  statement: 'I like turning vague ideas into systems people can actually use.',
};

const DEFAULT_EXPERIENCES = [
  {
    company: '天立泰科技股份有限公司',
    role: '运维工程师',
    location: 'Chengdu',
    startDate: '2025-06-01',
    endDate: null,
    isCurrent: true,
    description:
      '负责日常运维与基础设施相关工作，同时持续把自动化、AI 工具和更高效的工作流引入实际环境。',
    sortOrder: 10,
  },
  {
    company: '四川昊明远创科技有限公司',
    role: 'Technical / Operations',
    location: 'Sichuan',
    startDate: '2021-04-01',
    endDate: '2025-04-30',
    isCurrent: false,
    description:
      '参与技术支持、系统维护与业务侧问题处理，积累一线环境中的问题定位、沟通与落地经验。',
    sortOrder: 20,
  },
];

const DEFAULT_EDUCATIONS = [
  {
    school: '成都航空职业技术学院',
    major: '软件技术',
    degree: '大专',
    startDate: '2019-09-01',
    endDate: '2022-06-30',
    description: '软件与计算机基础学习，同时逐步把兴趣转向 Web、工程实践和独立项目。',
    sortOrder: 10,
  },
];

const DEFAULT_SKILLS = [
  {
    title: 'AI',
    content: 'GPT · Claude · DeepSeek · OpenClaw · Prompt / Agent workflow',
    sortOrder: 10,
  },
  {
    title: 'Engineering',
    content: 'Python · Web · API · MySQL · Redis · Docker · Linux',
    sortOrder: 20,
  },
  {
    title: 'Product',
    content: 'PRD · Information Architecture · Prototyping · UX iteration',
    sortOrder: 30,
  },
];

export async function seedCvDefaults(prisma: PrismaClient) {
  if (await prisma.cvProfile.count()) return false;

  const profile = await prisma.cvProfile.create({
    data: {
      ...DEFAULT_PROFILE,
      experiences: { create: DEFAULT_EXPERIENCES.map((item) => toExperienceData(item)) },
      educations: { create: DEFAULT_EDUCATIONS.map((item) => toEducationData(item)) },
      skillGroups: { create: DEFAULT_SKILLS },
    },
  });

  const projects = await prisma.project.findMany({
    where: { slug: { in: ['nexusflow', 'wechat-md', 'bloeco', 'jov3-lab'] } },
    select: { id: true, slug: true },
  });
  const projectIds = new Map(projects.map((project) => [project.slug, project.id]));
  await prisma.cvProjectRef.createMany({
    data: ['nexusflow', 'wechat-md', 'bloeco', 'jov3-lab']
      .map((slug, index) => {
        const projectId = projectIds.get(slug);
        return projectId ? { profileId: profile.id, projectId, sortOrder: (index + 1) * 10 } : null;
      })
      .filter(
        (item): item is { profileId: string; projectId: string; sortOrder: number } =>
          item !== null,
      ),
  });

  return true;
}

function toExperienceData(item: (typeof DEFAULT_EXPERIENCES)[number]) {
  return {
    ...item,
    startDate: toDate(item.startDate),
    endDate: item.endDate ? toDate(item.endDate) : null,
  };
}

function toEducationData(item: (typeof DEFAULT_EDUCATIONS)[number]) {
  return {
    ...item,
    startDate: toDate(item.startDate),
    endDate: item.endDate ? toDate(item.endDate) : null,
  };
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
