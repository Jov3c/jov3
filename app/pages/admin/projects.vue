<script setup lang="ts">
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  type ProjectStatus,
} from '#shared/constants/project';
import { renderMarkdown } from '#shared/markdown';
import type { PublicProject } from '~/types/project';

definePageMeta({ layout: 'admin', middleware: 'admin' });

interface AdminProject extends PublicProject {
  readmeMarkdown: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectForm {
  name: string;
  slug: string;
  summary: string;
  status: ProjectStatus;
  techStack: string;
  githubUrl: string;
  demoUrl: string;
  readmeMarkdown: string;
  sortOrder: number;
  visible: boolean;
}

const projects = ref<AdminProject[]>([]);
const selectedProjectId = ref<string | null>(null);
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');
const markdownFileInput = ref<HTMLInputElement | null>(null);
const form = reactive<ProjectForm>(createEmptyForm());

useSeoMeta({ title: '项目管理 — JOV3 管理后台', robots: 'noindex, nofollow' });

const selectedProject = computed(() =>
  projects.value.find((project) => project.id === selectedProjectId.value),
);
const isNewProject = computed(() => selectedProjectId.value === null);
const previewHtml = computed(() => renderMarkdown(form.readmeMarkdown));

async function load() {
  isLoading.value = true;
  try {
    const result = await $fetch<{ data: { items: AdminProject[] } }>('/api/v1/admin/projects');
    projects.value = result.data.items;
    if (selectedProjectId.value) {
      const current = projects.value.find((project) => project.id === selectedProjectId.value);
      if (current) fillForm(current);
    } else if (projects.value[0]) {
      selectProject(projects.value[0]);
    }
  } catch {
    errorMessage.value = 'Projects 加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

function selectProject(project: AdminProject) {
  selectedProjectId.value = project.id;
  fillForm(project);
  notice.value = '';
  errorMessage.value = '';
}

function startNewProject() {
  selectedProjectId.value = null;
  Object.assign(form, createEmptyForm());
  notice.value = '';
  errorMessage.value = '';
}

async function saveProject() {
  await runAction('save', async () => {
    const body = formPayload();
    if (selectedProjectId.value) {
      const result = await $fetch<{ data: AdminProject }>(
        `/api/v1/admin/projects/${selectedProjectId.value}`,
        { method: 'PATCH', body },
      );
      replaceProject(result.data);
      fillForm(result.data);
      notice.value = `项目「${result.data.name}」已保存。`;
      return;
    }

    const result = await $fetch<{ data: AdminProject }>('/api/v1/admin/projects', {
      method: 'POST',
      body,
    });
    projects.value = [...projects.value, result.data].sort(compareProjects);
    selectedProjectId.value = result.data.id;
    fillForm(result.data);
    notice.value = `项目「${result.data.name}」已创建。`;
  });
}

async function deleteProject() {
  const project = selectedProject.value;
  if (!project || !window.confirm(`确定删除「${project.name}」吗？`)) return;

  await runAction('delete', async () => {
    await $fetch(`/api/v1/admin/projects/${project.id}` as string, { method: 'DELETE' });
    projects.value = projects.value.filter((item) => item.id !== project.id);
    if (projects.value[0]) selectProject(projects.value[0]);
    else startNewProject();
    notice.value = '项目已删除。';
  });
}

async function moveProject(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= projects.value.length) return;
  const reordered = [...projects.value];
  [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
  projects.value = reordered;

  await runAction('order', async () => {
    const result = await $fetch<{ data: { items: AdminProject[] } }>(
      '/api/v1/admin/projects/reorder',
      { method: 'PATCH', body: { ids: reordered.map((project) => project.id) } },
    );
    projects.value = result.data.items;
    notice.value = '项目顺序已更新。';
  });
}

async function importMarkdown(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.md')) {
    errorMessage.value = '只能导入 .md 文件。';
    return;
  }

  form.readmeMarkdown = await file.text();
  notice.value = `已导入 ${file.name}，保存项目后写入数据库。`;
  errorMessage.value = '';
}

async function runAction(key: string, action: () => Promise<void>) {
  busyKey.value = key;
  errorMessage.value = '';
  try {
    await action();
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '操作失败，请检查字段后重试。';
  } finally {
    busyKey.value = '';
  }
}

function formPayload() {
  return {
    name: form.name,
    slug: form.slug,
    summary: form.summary,
    status: form.status,
    techStack: form.techStack
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    githubUrl: form.githubUrl.trim() || null,
    demoUrl: form.demoUrl.trim() || null,
    readmeMarkdown: form.readmeMarkdown,
    sortOrder: form.sortOrder,
    visible: form.visible,
  };
}

function fillForm(project: AdminProject) {
  Object.assign(form, {
    name: project.name,
    slug: project.slug,
    summary: project.summary,
    status: project.status,
    techStack: project.techStack.join(', '),
    githubUrl: project.githubUrl ?? '',
    demoUrl: project.demoUrl ?? '',
    readmeMarkdown: project.readmeMarkdown,
    sortOrder: project.sortOrder,
    visible: project.visible,
  });
}

function replaceProject(project: AdminProject) {
  projects.value = projects.value
    .map((item) => (item.id === project.id ? project : item))
    .sort(compareProjects);
}

function createEmptyForm(): ProjectForm {
  return {
    name: '',
    slug: 'new-project',
    summary: '',
    status: 'BUILDING',
    techStack: '',
    githubUrl: '',
    demoUrl: '',
    readmeMarkdown: '# 新项目\n\n在这里编写项目介绍。',
    sortOrder: (projects.value.length + 1) * 10,
    visible: true,
  };
}

function compareProjects(left: AdminProject, right: AdminProject) {
  return left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt);
}

onMounted(load);
</script>

<template>
  <div class="projects-admin">
    <header class="admin-page-heading">
      <div>
        <p>内容管理 / 项目</p>
        <h1>项目管理</h1>
      </div>
      <button class="button" type="button" :disabled="isLoading" @click="startNewProject">
        新建项目
      </button>
    </header>

    <p v-if="isLoading" class="media-empty">正在加载项目…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <div class="projects-admin-layout">
        <section class="home-admin-section projects-admin-list-panel">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">项目列表</p>
              <h2>精选项目与作品。</h2>
            </div>
            <span>共 {{ projects.length }} 个项目</span>
          </div>

          <div v-if="!projects.length" class="media-empty">还没有项目，先创建一个。</div>
          <ol v-else class="projects-admin-list">
            <li v-for="(project, index) in projects" :key="project.id">
              <button
                class="projects-admin-list__item"
                :class="{ 'projects-admin-list__item--active': selectedProjectId === project.id }"
                type="button"
                @click="selectProject(project)"
              >
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <strong>{{ project.name }}</strong>
                <small :data-status="project.status.toLowerCase()">
                  {{ PROJECT_STATUS_LABELS[project.status] }} ·
                  {{ project.visible ? '已显示' : '已隐藏' }}
                </small>
              </button>
              <div class="projects-admin-list__order">
                <button
                  type="button"
                  :aria-label="`上移 ${project.name}`"
                  :disabled="index === 0 || busyKey === 'order'"
                  @click="moveProject(index, -1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  :aria-label="`下移 ${project.name}`"
                  :disabled="index === projects.length - 1 || busyKey === 'order'"
                  @click="moveProject(index, 1)"
                >
                  ↓
                </button>
              </div>
            </li>
          </ol>
        </section>

        <form class="home-admin-section project-editor" @submit.prevent="saveProject">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">{{ isNewProject ? '新建项目' : '编辑项目' }}</p>
              <h2>{{ isNewProject ? '为作品建立清晰的展示页' : form.name }}</h2>
            </div>
            <span>README 是项目详情的唯一来源</span>
          </div>

          <div class="project-form-grid">
            <label><span>名称</span><input v-model="form.name" maxlength="120" required /></label>
            <label
              ><span>路径标识</span><input v-model="form.slug" maxlength="120" required
            /></label>
            <label
              ><span>状态</span
              ><select v-model="form.status">
                <option v-for="status in PROJECT_STATUSES" :key="status" :value="status">
                  {{ PROJECT_STATUS_LABELS[status] }}
                </option>
              </select></label
            >
            <label
              ><span>排序</span><input v-model.number="form.sortOrder" type="number" min="0"
            /></label>
            <label class="project-form-grid__wide"
              ><span>摘要</span
              ><textarea v-model="form.summary" rows="3" maxlength="400" required />
            </label>
            <label class="project-form-grid__wide"
              ><span>技术栈（使用英文逗号分隔）</span
              ><input v-model="form.techStack" placeholder="Vue, TypeScript, PostgreSQL"
            /></label>
            <label
              ><span>GitHub 地址</span
              ><input v-model="form.githubUrl" type="url" placeholder="https://github.com/…"
            /></label>
            <label
              ><span>演示地址</span><input v-model="form.demoUrl" type="url" placeholder="选填"
            /></label>
            <label class="home-checkbox project-form-grid__wide"
              ><input v-model="form.visible" type="checkbox" /><span>公开显示此项目</span></label
            >
          </div>

          <section class="project-editor__readme">
            <div class="project-editor__subheading">
              <div>
                <p class="eyebrow">README.md</p>
                <h3>一次编写，多处展示。</h3>
              </div>
              <label class="admin-secondary-button project-import-button">
                导入 .md
                <input
                  ref="markdownFileInput"
                  class="project-file-input"
                  type="file"
                  accept=".md,text/markdown"
                  @change="importMarkdown"
                />
              </label>
            </div>
            <div class="project-editor__markdown-grid">
              <label class="project-markdown-input"
                ><span>Markdown 源码</span
                ><textarea
                  v-model="form.readmeMarkdown"
                  rows="22"
                  spellcheck="false"
                  aria-label="README Markdown 源码"
                />
              </label>
              <div class="project-markdown-preview">
                <span>实时预览</span>
                <!-- The shared renderer sanitizes the browser preview and the public API output. -->
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="readme__content" v-html="previewHtml" />
              </div>
            </div>
          </section>

          <div class="project-editor__actions">
            <button class="button" type="submit" :disabled="busyKey === 'save'">
              {{ isNewProject ? '创建项目' : '保存项目' }}
            </button>
            <button
              v-if="!isNewProject"
              class="admin-danger-button"
              type="button"
              :disabled="busyKey === 'delete'"
              @click="deleteProject"
            >
              删除项目
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>
