import type { PrismaClient } from '../generated/prisma/client';

export const DEFAULT_PROJECTS = [
  {
    slug: 'signal-daily',
    name: 'Signal Daily',
    summary: '聚焦信息获取与阅读体验的 AI 信息产品，强调清晰、低噪音与持续更新。',
    status: 'BUILDING' as const,
    techStack: ['Vue', 'TypeScript', 'MySQL', 'Redis'],
    githubUrl: 'https://github.com/Jov3c',
    demoUrl: null,
    readmeMarkdown: `# Signal Daily

Signal Daily 是一个面向日常信息获取场景的个人项目。项目详情页直接使用 README 作为主体内容。

## Features

- 聚合与组织信息
- 清晰的阅读层级
- 支持持续迭代的项目结构

## Preview

README 中可以自由插入图片、GIF、链接、代码块等内容。

## Tech Stack

\`Vue\` · \`TypeScript\` · \`MySQL\` · \`Redis\`
`,
    sortOrder: 10,
    visible: true,
  },
  {
    slug: 'nexusflow',
    name: 'NexusFlow',
    summary: '自建 AI API 中转与运营项目，用于统一接入、管理与维护模型服务。',
    status: 'ACTIVE' as const,
    techStack: ['Docker', 'Nginx', 'API', 'Linux'],
    githubUrl: 'https://github.com/Jov3c',
    demoUrl: null,
    readmeMarkdown: `# NexusFlow

NexusFlow 是一个 AI API 服务与运维相关项目。

## What it does

统一接入不同模型服务，并围绕部署、运行维护和服务管理形成完整流程。
`,
    sortOrder: 20,
    visible: true,
  },
  {
    slug: 'wechat-md',
    name: 'WeChat-md',
    summary: '面向微信公众号排版与内容发布流程的 Markdown 本地编辑器。',
    status: 'BUILDING' as const,
    techStack: ['Vue', 'Markdown', 'Electron', 'CSS'],
    githubUrl: 'https://github.com/Jov3c',
    demoUrl: null,
    readmeMarkdown: `# WeChat-md

一个聚焦微信公众号写作、预览与样式管理的本地编辑器。

## Goals

- 编辑与预览同步
- 模板与风格管理
- 输出效果尽量接近公众号最终排版
`,
    sortOrder: 30,
    visible: true,
  },
  {
    slug: 'bloeco',
    name: 'Bloeco',
    summary: 'Minecraft Paper 服务端经济系统，负责账户、记账、税收等核心经济能力。',
    status: 'DONE' as const,
    techStack: ['Java', 'Paper API', 'MySQL', 'Redis'],
    githubUrl: 'https://github.com/Jov3c',
    demoUrl: null,
    readmeMarkdown: `# Bloeco

Bloeco 是一个 Minecraft Paper 经济底座项目。

## Core

- 玩家账户
- 货币记账
- 税收与经济调节
- 为银行等后续模块提供底层能力
`,
    sortOrder: 40,
    visible: true,
  },
  {
    slug: 'reading-plugin',
    name: 'Reading Plugin',
    summary: '为 Obsidian 提供 RSS 与公众号文章阅读能力。',
    status: 'BUILDING' as const,
    techStack: ['TypeScript', 'Obsidian', 'RSS'],
    githubUrl: 'https://github.com/Jov3c',
    demoUrl: null,
    readmeMarkdown: `# Reading Plugin

为 Obsidian 提供 RSS 与公众号文章阅读能力。
`,
    sortOrder: 50,
    visible: true,
  },
  {
    slug: 'jov3-lab',
    name: 'Jov3 Lab',
    summary: '个人实验空间，用来放还没有成长为独立产品的小东西。',
    status: 'ACTIVE' as const,
    techStack: ['Web', 'AI', 'Prototype'],
    githubUrl: 'https://github.com/Jov3c',
    demoUrl: null,
    readmeMarkdown: `# Jov3 Lab

个人实验空间，用来放还没有成长为独立产品的小东西。
`,
    sortOrder: 60,
    visible: true,
  },
] satisfies Parameters<PrismaClient['project']['createMany']>[0]['data'];

export async function seedProjectDefaults(prisma: PrismaClient) {
  if ((await prisma.project.count()) > 0) return false;
  await prisma.project.createMany({ data: DEFAULT_PROJECTS });
  return true;
}
