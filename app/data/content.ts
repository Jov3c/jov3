import type {
  ArchiveEntry,
  BlogPost,
  FootprintPlace,
  FriendLink,
  GuestbookMessage,
  Project,
  TimelineChapter,
} from '~/types/content';

export const projects: Project[] = [
  {
    slug: 'signal',
    name: 'Signal Daily',
    index: '01',
    status: 'Building',
    description: '聚焦信息获取与阅读体验的 AI 信息产品，强调清晰、低噪音与持续更新。',
    stack: ['Vue', 'TypeScript', 'MySQL', 'Redis'],
    hasDemo: true,
    repositoryLabel: 'GitHub',
    readme: {
      lead: 'Signal Daily 是一个面向日常信息获取场景的个人项目。项目详情页直接使用 README 作为主体内容。',
      sections: [
        {
          title: 'Why',
          paragraphs: [
            '信息很多，但真正值得留下来的内容并不多。这个项目尝试把聚合、筛选与阅读放在同一条低噪音链路里。',
          ],
        },
        {
          title: 'What it does',
          paragraphs: ['它关注内容的持续获取、结构化处理与轻量阅读，而不是不断增加显眼的功能。'],
          bullets: ['聚合多个来源的信息', '为阅读建立稳定、清晰的节奏', '支持持续迭代的项目结构'],
        },
      ],
    },
  },
  {
    slug: 'nexusflow',
    name: 'NexusFlow',
    index: '02',
    status: 'Active',
    description: '自建 AI API 中转与运营项目，用于统一接入、管理与维护模型服务。',
    stack: ['Docker', 'Nginx', 'API', 'Linux'],
    hasDemo: false,
    repositoryLabel: 'GitHub',
    readme: {
      lead: 'NexusFlow 是一个 AI API 服务与运维相关项目。',
      sections: [
        {
          title: 'Context',
          paragraphs: ['把部署、路由、监控和长期维护整理成一套可持续运行的服务流程。'],
        },
        {
          title: 'Focus',
          paragraphs: ['重点不是再做一层包装，而是让接入和日常运营更稳定、更透明。'],
        },
      ],
    },
  },
  {
    slug: 'wechat-md',
    name: 'WeChat-md',
    index: '03',
    status: 'Building',
    description: '面向公众号内容创作与排版的 Markdown 工作流，让写作和发布更轻。',
    stack: ['Vue', 'Markdown', 'Electron', 'CSS'],
    hasDemo: false,
    repositoryLabel: 'GitHub',
    readme: {
      lead: 'WeChat-md 从写作、预览同步到模板管理，尝试减少公众号内容发布中的重复操作。',
      sections: [
        {
          title: 'Principles',
          paragraphs: ['编辑器应该安静地帮助写作，而不是让排版工具成为新的工作负担。'],
        },
        {
          title: 'Workflow',
          paragraphs: ['Markdown 输入、实时预览和可复用样式共同组成一条更短的发布路径。'],
        },
      ],
    },
  },
  {
    slug: 'bloeco',
    name: 'Bloeco',
    index: '04',
    status: 'Done',
    description: 'Minecraft Paper 经济底座项目，关注稳定的数据结构和服务端性能。',
    stack: ['Java', 'Paper API', 'MySQL', 'Redis'],
    hasDemo: false,
    repositoryLabel: 'GitHub',
    readme: {
      lead: 'Bloeco 是一个 Minecraft Paper 经济底座项目。',
      sections: [
        {
          title: 'Built for servers',
          paragraphs: ['围绕账户、余额与服务端事件组织清晰可靠的经济能力。'],
        },
        { title: 'Status', paragraphs: ['核心目标已经完成，项目进入稳定维护阶段。'] },
      ],
    },
  },
  {
    slug: 'reading',
    name: 'Reading Plugin',
    index: '05',
    status: 'Building',
    description: '把 RSS 与稍后读习惯带进 Obsidian 的轻量阅读插件。',
    stack: ['TypeScript', 'Obsidian', 'RSS'],
    hasDemo: false,
    repositoryLabel: 'GitHub',
    readme: {
      lead: 'Reading Plugin 希望把获取、标记和整理内容放回个人知识库。',
      sections: [
        {
          title: 'Reading first',
          paragraphs: ['先把阅读本身做好，再决定哪些内容值得进入长期笔记。'],
        },
        { title: 'In progress', paragraphs: ['订阅管理、阅读状态和本地存档仍在持续打磨。'] },
      ],
    },
  },
  {
    slug: 'lab',
    name: 'Jov3 Lab',
    index: '06',
    status: 'Active',
    description: '用来验证 Web、AI 与交互想法的小型实验场。',
    stack: ['Web', 'AI', 'Prototype'],
    hasDemo: true,
    repositoryLabel: 'GitHub',
    readme: {
      lead: 'Jov3 Lab 收纳那些还不需要成为完整产品、但值得被做出来验证的想法。',
      sections: [
        {
          title: 'Small bets',
          paragraphs: ['每次只验证一个核心判断，让实验可以快速开始，也能干净结束。'],
        },
        {
          title: 'Open notebook',
          paragraphs: ['成功和失败的实验都留下痕迹，成为下一次判断的上下文。'],
        },
      ],
    },
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'server',
    category: '开发',
    publishedAt: '2026-09-18 16:37',
    title: '博客服务器的自动巡检和基于 Git 的备份',
    summary: '把常见检查、异常提示与内容备份串成一条足够简单、可以长期运行的自动化流程。',
    views: 112,
    comments: 4,
    words: 1963,
    body: [
      '网站上线之后，真正需要时间的往往不是第一次部署，而是长期维护。',
      '我把磁盘、服务状态、证书与备份拆成几个小检查，再用 Git 保留内容变更。流程不复杂，但每一步都能独立确认和恢复。',
    ],
  },
  {
    slug: 'ai',
    category: 'AI',
    publishedAt: '2026-09-12 21:10',
    title: '本地部署大模型之后，我们应该让它做什么？',
    summary: '从“成功跑起来”继续往前，寻找真正值得长期留在本地的工作流。',
    views: 286,
    comments: 9,
    words: 2380,
    body: [
      '部署成功不是终点，而是工作流设计的开始。',
      '更值得长期运行的场景包括知识库、隐私数据处理和自动化工具。',
    ],
  },
  {
    slug: 'product',
    category: '产品',
    publishedAt: '2026-09-04 12:26',
    title: '我为什么越来越少给产品堆功能',
    summary: '功能数量并不会自然变成产品价值，有时真正困难的是判断哪些东西不应该出现。',
    views: 173,
    comments: 6,
    words: 1755,
    body: [
      '一个功能被做出来之后，就会开始占用理解、维护和沟通成本。',
      '我更愿意先问：如果删掉它，产品的核心是否仍然完整？',
    ],
  },
  {
    slug: 'wechat',
    category: '开发',
    publishedAt: '2026-08-28 18:42',
    title: '做一个真正适合公众号写作的 Markdown 编辑器',
    summary: '从编辑、预览同步到模板管理，记录 WeChat-md 这个项目背后的一些设计选择。',
    views: 214,
    comments: 3,
    words: 2214,
    body: [
      '写作工具最重要的能力，是让人把注意力留在内容上。',
      '预览和模板不是额外装饰，它们应该缩短从草稿到发布的距离。',
    ],
  },
  {
    slug: 'signal',
    category: '产品',
    publishedAt: '2026-08-20 10:08',
    title: 'Signal Daily：从信息聚合到低噪音阅读',
    summary: '重新整理信息产品中的获取、筛选和阅读，让每天打开它时都更轻一点。',
    views: 327,
    comments: 11,
    words: 2860,
    body: [
      '聚合只是入口，减少噪音才是 Signal Daily 真正想解决的问题。',
      '当来源不断增加，产品需要替用户保护注意力，而不是展示自己抓到了多少内容。',
    ],
  },
];

export const archiveEntries: ArchiveEntry[] = [
  {
    year: 2026,
    month: '09',
    items: blogPosts
      .slice(0, 3)
      .map((post) => ({
        date: post.publishedAt.slice(5, 10),
        title: post.title,
        category: post.category,
        slug: post.slug,
      })),
  },
  {
    year: 2026,
    month: '08',
    items: [
      ...blogPosts
        .slice(3)
        .map((post) => ({
          date: post.publishedAt.slice(5, 10),
          title: post.title,
          category: post.category,
          slug: post.slug,
        })),
      { date: '08-11', title: '一些关于长期做项目的想法', category: '随笔' },
    ],
  },
  {
    year: 2026,
    month: '07',
    items: [{ date: '07-09', title: '关于本地模型工作流的一次整理', category: 'AI' }],
  },
  {
    year: 2025,
    month: '12',
    items: [{ date: '12-05', title: '把重复的工作交给自动化', category: '开发' }],
  },
  {
    year: 2025,
    month: '11',
    items: [{ date: '11-17', title: '个人网站重新开始', category: '随笔' }],
  },
];

export const friendLinks: FriendLink[] = [
  {
    name: 'FeiTwnd',
    initials: 'FT',
    description: '设计、开发与持续创造的个人空间。',
    url: 'https://feitwnd.cc',
  },
  { name: 'Mori', initials: 'MO', description: '写代码，也记录沿途的想法。' },
  { name: 'Northwind', initials: 'NW', description: '关于技术、旅行与慢生活。' },
  { name: 'Aster', initials: 'AS', description: '独立开发和产品观察。' },
  { name: 'Haru', initials: 'HA', description: '影像、设计与日常灵感。' },
  { name: 'Sora', initials: 'SO', description: '开放网络中的一小块自留地。' },
];

export const guestbookMessages: GuestbookMessage[] = [
  {
    name: 'Mori',
    date: '2026-09-22 18:42',
    content: '这个站的整体节奏很舒服，项目页也很好逛。',
    reply: {
      name: 'Jov3',
      date: '2026-09-22 22:10',
      content: '谢谢喜欢，也希望后面能把更多项目过程慢慢补完整。',
    },
  },
  {
    name: 'Northwind',
    date: '2026-09-18 12:16',
    content: '从博客逛到了足迹页，期待看到更多旅途记录。',
  },
  { name: 'Aster', date: '2026-09-11 09:35', content: '很喜欢这种克制又有细节的个人站。' },
];

export const footprintPlaces: FootprintPlace[] = [
  {
    id: 'chengdu',
    country: 'China',
    city: '成都',
    coordinates: [72, 58],
    date: '日常驻点',
    title: '生活发生的地方',
    memory: '熟悉的街道、持续推进的项目，以及很多普通但重要的日常。',
  },
  {
    id: 'chongqing',
    country: 'China',
    city: '重庆',
    coordinates: [75, 61],
    date: '2025 · 夏',
    title: '在坡与桥之间',
    memory: '城市有强烈的方向感，也总能在下一个转角打破方向感。',
  },
  {
    id: 'shanghai',
    country: 'China',
    city: '上海',
    coordinates: [82, 54],
    date: '2024 · 秋',
    title: '短暂停留',
    memory: '密集的信息、快速的节奏，还有夜里安静下来的街区。',
  },
  {
    id: 'tokyo',
    country: 'Japan',
    city: '东京',
    coordinates: [89, 55],
    date: '2026 · 春',
    title: '秩序里的细节',
    memory: '第一次如此集中地观察公共空间如何照顾人的移动和停留。',
  },
  {
    id: 'osaka',
    country: 'Japan',
    city: '大阪',
    coordinates: [86, 58],
    date: '2026 · 春',
    title: '更松弛的一站',
    memory: '从热闹的街区走到河边，城市的表情会在很短的距离里变化。',
  },
  {
    id: 'kyoto',
    country: 'Japan',
    city: '京都',
    coordinates: [87, 57],
    date: '2026 · 春',
    title: '慢一点看',
    memory: '清晨的街道和傍晚的屋檐，让“慢”有了非常具体的形状。',
  },
  {
    id: 'oslo',
    country: 'Norway',
    city: '奥斯陆',
    coordinates: [51, 30],
    date: '想去的地方',
    title: '留给未来的一枚标记',
    memory: '有些坐标来自记忆，有些坐标则先来自期待。',
  },
];

export const timelineChapters: TimelineChapter[] = [
  {
    year: '2023',
    verb: 'START',
    title: '第一次完整做完一个自己的项目',
    description: '从兴趣出发，开始把模糊想法真正做成可以使用的东西。',
    tag: 'LIFE / BUILD',
    story: '不是为了交作业，也不是为了工作任务，而是单纯因为自己觉得这个东西应该存在。',
  },
  {
    year: '2024',
    verb: 'EXPLORE',
    title: '把兴趣变成持续的练习',
    description: '开始更认真地看产品、设计与工程如何一起工作。',
    tag: 'PRODUCT',
    story: '做得更快不再是唯一目标，为什么做、为谁做，逐渐变得更重要。',
  },
  {
    year: '2025',
    verb: 'BUILD',
    title: '学会选择，也学会停止',
    description:
      '一些项目被留下，一些项目被废弃。它们慢慢变成一种判断：什么值得继续，什么应该及时停下来。',
    tag: 'PROJECT',
    story: '持续构建的同时，也开始为维护成本、清晰度和长期价值负责。',
  },
  {
    year: '2026',
    verb: 'NOW',
    title: '让不同方向逐渐汇合',
    description: '工作、独立项目和新的学习方向开始彼此连接。',
    tag: 'PROJECT',
    story: '不同方向的项目，却越来越接近同一件事：减少复杂度，让信息、工具和体验更顺手。',
  },
  {
    year: 'NOW',
    verb: 'CONTINUE',
    title: '故事仍在继续',
    description: '保留好奇，继续构建，也给生活本身留下位置。',
    tag: 'LEARNING',
    story: '下一段还没有标题，但正在发生。',
  },
];

export const cvProfile = {
  name: 'Jov3',
  role: 'Product · AI · Developer',
  location: 'Chengdu, China',
  bio: '喜欢把 AI、产品和工程真正落到可用的东西上。关注部署、集成、工作流和长期维护，而不是只停留在 Demo。',
  experience: [
    {
      period: '2025.06 — PRESENT',
      place: 'Chengdu',
      title: '运维工程师 · 天立泰科技股份有限公司',
      subtitle: 'Infrastructure / Operations',
      description:
        '负责日常运维与基础设施相关工作，同时持续把自动化、AI 工具和更高效的工作流引入实际环境。',
    },
    {
      period: '2021.04 — 2025.04',
      place: 'Sichuan',
      title: '四川昊明远创科技有限公司',
      subtitle: 'Technical / Operations',
      description:
        '参与技术支持、系统维护与业务侧问题处理，积累一线环境中的问题定位、沟通与落地经验。',
    },
  ],
  skills: [
    'Infrastructure',
    'Linux',
    'Docker',
    'TypeScript',
    'Vue',
    'AI Workflow',
    'Product Thinking',
    'Automation',
  ],
  education: {
    period: '2019.09 — 2022.06',
    title: '成都航空职业技术学院',
    subtitle: '软件技术 · 大专',
    description: '软件与计算机基础学习，同时逐步把兴趣转向 Web、工程实践和独立项目。',
  },
  statement: 'I like turning vague ideas into systems people can actually use.',
};
