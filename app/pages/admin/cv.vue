<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface AdminCvProfile {
  id: string;
  isPublic: boolean;
  name: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  statusText: string;
  statement: string;
  portraitMediaId: string | null;
}

interface AdminCvExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  sortOrder: number;
}

interface AdminCvEducation {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string | null;
  description: string;
  sortOrder: number;
}

interface AdminCvSkill {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

interface AdminProject {
  id: string;
  name: string;
  slug: string;
  visible: boolean;
}

interface AdminMedia {
  id: string;
  originalName: string;
  publicUrl: string;
  altText: string | null;
}

interface CvAggregateResponse {
  id: string;
  isPublic: boolean;
  name: string;
  headline: string;
  bio: string;
  location: string;
  website: string | null;
  statusText: string | null;
  statement: string;
  portraitMediaId: string | null;
  experiences: AdminCvExperience[];
  educations: AdminCvEducation[];
  skills: AdminCvSkill[];
  projects: Array<{ id: string }>;
}

interface ExperienceDraft {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  sortOrder: number;
}

interface EducationDraft {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
  sortOrder: number;
}

interface SkillDraft {
  title: string;
  content: string;
  sortOrder: number;
}

const profile = reactive<AdminCvProfile>(createEmptyProfile());
const experiences = ref<AdminCvExperience[]>([]);
const educations = ref<AdminCvEducation[]>([]);
const skills = ref<AdminCvSkill[]>([]);
const projects = ref<AdminProject[]>([]);
const media = ref<AdminMedia[]>([]);
const selectedProjectIds = ref<string[]>([]);
const newExperience = reactive<ExperienceDraft>(createEmptyExperience(10));
const newEducation = reactive<EducationDraft>(createEmptyEducation(10));
const newSkill = reactive<SkillDraft>(createEmptySkill(10));
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');

useSeoMeta({ title: '个人简历 — JOV3 管理后台', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [cvResult, projectResult, mediaResult] = await Promise.all([
      $fetch<{ data: CvAggregateResponse }>('/api/v1/admin/cv/profile'),
      $fetch<{ data: { items: AdminProject[] } }>('/api/v1/admin/projects'),
      $fetch<{ data: AdminMedia[] }>('/api/v1/admin/media', {
        query: { page: 1, pageSize: 100, q: '' },
      }),
    ]);
    applyAggregate(cvResult.data);
    projects.value = projectResult.data.items;
    media.value = mediaResult.data;
  } catch {
    errorMessage.value = 'CV 配置加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

async function saveProfile() {
  await runAction('profile', async () => {
    const result = await $fetch<{ data: CvAggregateResponse }>('/api/v1/admin/cv/profile', {
      method: 'PATCH',
      body: {
        isPublic: profile.isPublic,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        website: profile.website.trim() || null,
        statusText: profile.statusText.trim() || null,
        statement: profile.statement,
        portraitMediaId: profile.portraitMediaId || null,
      },
    });
    applyAggregate(result.data);
    notice.value = '简历资料已保存。';
  });
}

async function saveProjects() {
  await runAction('projects', async () => {
    const result = await $fetch<{ data: CvAggregateResponse }>('/api/v1/admin/cv/projects', {
      method: 'PUT',
      body: { projectIds: selectedProjectIds.value },
    });
    applyAggregate(result.data);
    notice.value = 'CV 项目关联已保存。';
  });
}

async function saveExperience(item: AdminCvExperience) {
  await runAction(`experience-${item.id}`, async () => {
    await $fetch(`/api/v1/admin/cv/experiences/${item.id}`, {
      method: 'PATCH',
      body: experiencePayload(item),
    });
    await load();
    notice.value = `经历「${item.company}」已保存。`;
  });
}

async function addExperience() {
  await runAction('new-experience', async () => {
    await $fetch('/api/v1/admin/cv/experiences', {
      method: 'POST',
      body: experiencePayload(newExperience),
    });
    Object.assign(newExperience, createEmptyExperience((experiences.value.length + 2) * 10));
    await load();
    notice.value = '经历已新增。';
  });
}

async function deleteExperience(item: AdminCvExperience) {
  if (!window.confirm(`确定删除「${item.company}」这段经历吗？`)) return;
  await runAction(`delete-experience-${item.id}`, async () => {
    await $fetch(`/api/v1/admin/cv/experiences/${item.id}`, { method: 'DELETE' });
    await load();
    notice.value = '经历已删除。';
  });
}

async function saveEducation(item: AdminCvEducation) {
  await runAction(`education-${item.id}`, async () => {
    await $fetch(`/api/v1/admin/cv/educations/${item.id}`, {
      method: 'PATCH',
      body: educationPayload(item),
    });
    await load();
    notice.value = `教育经历「${item.school}」已保存。`;
  });
}

async function addEducation() {
  await runAction('new-education', async () => {
    await $fetch('/api/v1/admin/cv/educations', {
      method: 'POST',
      body: educationPayload(newEducation),
    });
    Object.assign(newEducation, createEmptyEducation((educations.value.length + 2) * 10));
    await load();
    notice.value = '教育经历已新增。';
  });
}

async function deleteEducation(item: AdminCvEducation) {
  if (!window.confirm(`确定删除「${item.school}」这段教育经历吗？`)) return;
  await runAction(`delete-education-${item.id}`, async () => {
    await $fetch(`/api/v1/admin/cv/educations/${item.id}`, { method: 'DELETE' });
    await load();
    notice.value = '教育经历已删除。';
  });
}

async function saveSkill(item: AdminCvSkill) {
  await runAction(`skill-${item.id}`, async () => {
    await $fetch(`/api/v1/admin/cv/skills/${item.id}`, {
      method: 'PATCH',
      body: skillPayload(item),
    });
    await load();
    notice.value = `技能组「${item.title}」已保存。`;
  });
}

async function addSkill() {
  await runAction('new-skill', async () => {
    await $fetch('/api/v1/admin/cv/skills', {
      method: 'POST',
      body: skillPayload(newSkill),
    });
    Object.assign(newSkill, createEmptySkill((skills.value.length + 2) * 10));
    await load();
    notice.value = '技能组已新增。';
  });
}

async function deleteSkill(item: AdminCvSkill) {
  if (!window.confirm(`确定删除「${item.title}」这个技能组吗？`)) return;
  await runAction(`delete-skill-${item.id}`, async () => {
    await $fetch(`/api/v1/admin/cv/skills/${item.id}`, { method: 'DELETE' });
    await load();
    notice.value = '技能组已删除。';
  });
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

function applyAggregate(data: CvAggregateResponse) {
  Object.assign(profile, {
    id: data.id,
    isPublic: data.isPublic,
    name: data.name,
    headline: data.headline,
    bio: data.bio,
    location: data.location,
    website: data.website ?? '',
    statusText: data.statusText ?? '',
    statement: data.statement,
    portraitMediaId: data.portraitMediaId,
  });
  experiences.value = data.experiences;
  educations.value = data.educations;
  skills.value = data.skills;
  selectedProjectIds.value = data.projects.map((project) => project.id);
}

function experiencePayload(item: AdminCvExperience | ExperienceDraft) {
  return {
    company: item.company,
    role: item.role,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate || null,
    isCurrent: item.isCurrent,
    description: item.description,
    sortOrder: Number(item.sortOrder),
  };
}

function educationPayload(item: AdminCvEducation | EducationDraft) {
  return {
    school: item.school,
    major: item.major,
    degree: item.degree,
    startDate: item.startDate,
    endDate: item.endDate || null,
    description: item.description,
    sortOrder: Number(item.sortOrder),
  };
}

function skillPayload(item: AdminCvSkill | SkillDraft) {
  return { title: item.title, content: item.content, sortOrder: Number(item.sortOrder) };
}

function createEmptyProfile(): AdminCvProfile {
  return {
    id: '',
    isPublic: true,
    name: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    statusText: '',
    statement: '',
    portraitMediaId: null,
  };
}

function createEmptyExperience(sortOrder: number): ExperienceDraft {
  return {
    company: '',
    role: '',
    location: '',
    startDate: '2026-01-01',
    endDate: '',
    isCurrent: false,
    description: '',
    sortOrder,
  };
}

function createEmptyEducation(sortOrder: number): EducationDraft {
  return {
    school: '',
    major: '',
    degree: '',
    startDate: '2026-01-01',
    endDate: '',
    description: '',
    sortOrder,
  };
}

function createEmptySkill(sortOrder: number): SkillDraft {
  return { title: '', content: '', sortOrder };
}

onMounted(load);
</script>

<template>
  <div class="about-admin">
    <header class="admin-page-heading">
      <div>
        <p>资料管理 / 关于</p>
        <h1>个人简历</h1>
      </div>
      <NuxtLink class="admin-secondary-button" to="/about/cv" target="_blank">
        View public CV ↗
      </NuxtLink>
    </header>

    <p v-if="isLoading" class="media-empty">正在加载简历…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
      <p v-if="!profile.isPublic" class="admin-notice about-admin-private-note">
        设为私密后，前台“关于”菜单将隐藏个人简历
      </p>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">个人资料</p>
            <h2>让关于页面先说清楚你是谁。</h2>
          </div>
          <span>公开状态可随时调整</span>
        </div>
        <form class="about-admin-form-grid" @submit.prevent="saveProfile">
          <label class="home-checkbox about-admin-form-grid__wide"
            ><input v-model="profile.isPublic" type="checkbox" /><span>公开简历</span></label
          >
          <label><span>姓名</span><input v-model="profile.name" required /></label>
          <label><span>个人标题</span><input v-model="profile.headline" required /></label>
          <label><span>所在地</span><input v-model="profile.location" required /></label>
          <label><span>个人网站</span><input v-model="profile.website" type="url" /></label>
          <label><span>状态文字</span><input v-model="profile.statusText" /></label>
          <label
            ><span>个人照片</span
            ><select v-model="profile.portraitMediaId">
              <option :value="null">不使用个人照片</option>
              <option v-for="item in media" :key="item.id" :value="item.id">
                {{ item.originalName }}
              </option>
            </select></label
          >
          <label class="about-admin-form-grid__wide"
            ><span>个人简介</span><textarea v-model="profile.bio" rows="5" required />
          </label>
          <label class="about-admin-form-grid__wide"
            ><span>个人陈述</span><textarea v-model="profile.statement" rows="3" required />
          </label>
          <div class="about-admin-actions about-admin-form-grid__wide">
            <button class="button" type="submit" :disabled="!!busyKey">保存资料</button>
          </div>
        </form>
      </section>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">工作经历</p>
            <h2>记录职业经历与职责</h2>
          </div>
          <span>{{ experiences.length }} entries</span>
        </div>
        <div class="about-admin-collection">
          <article v-for="item in experiences" :key="item.id" class="about-admin-card">
            <div class="about-admin-card__heading">
              <strong>{{ item.company || '未命名工作经历' }}</strong>
              <div>
                <button
                  class="admin-secondary-button"
                  type="button"
                  :disabled="!!busyKey"
                  @click="saveExperience(item)"
                >
                  保存
                </button>
                <button
                  class="admin-danger-button"
                  type="button"
                  :disabled="!!busyKey"
                  @click="deleteExperience(item)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="about-admin-form-grid">
              <label><span>公司</span><input v-model="item.company" required /></label>
              <label><span>职位</span><input v-model="item.role" required /></label>
              <label><span>地点</span><input v-model="item.location" required /></label>
              <label
                ><span>排序</span><input v-model.number="item.sortOrder" type="number" min="0"
              /></label>
              <label
                ><span>开始日期</span><input v-model="item.startDate" type="date" required
              /></label>
              <label
                ><span>结束日期</span
                ><input v-model="item.endDate" type="date" :disabled="item.isCurrent"
              /></label>
              <label class="home-checkbox"
                ><input v-model="item.isCurrent" type="checkbox" /><span>目前任职</span></label
              >
              <label class="about-admin-form-grid__wide"
                ><span>描述</span><textarea v-model="item.description" rows="3" required />
              </label>
            </div>
          </article>
        </div>
        <article class="about-admin-card about-admin-card--new">
          <div class="about-admin-card__heading"><strong>添加工作经历</strong></div>
          <div class="about-admin-form-grid">
            <label><span>公司</span><input v-model="newExperience.company" required /></label>
            <label><span>职位</span><input v-model="newExperience.role" required /></label>
            <label><span>地点</span><input v-model="newExperience.location" required /></label>
            <label
              ><span>排序</span
              ><input v-model.number="newExperience.sortOrder" type="number" min="0"
            /></label>
            <label
              ><span>开始日期</span><input v-model="newExperience.startDate" type="date" required
            /></label>
            <label
              ><span>结束日期</span
              ><input
                v-model="newExperience.endDate"
                type="date"
                :disabled="newExperience.isCurrent"
            /></label>
            <label class="home-checkbox"
              ><input v-model="newExperience.isCurrent" type="checkbox" /><span
                >目前任职</span
              ></label
            >
            <label class="about-admin-form-grid__wide"
              ><span>描述</span><textarea v-model="newExperience.description" rows="3" required />
            </label>
          </div>
          <button class="button" type="button" :disabled="!!busyKey" @click="addExperience">
            添加工作经历
          </button>
        </article>
      </section>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">精选项目</p>
            <h2>选择简历中展示的项目</h2>
          </div>
          <span>{{ selectedProjectIds.length }} selected</span>
        </div>
        <div class="about-admin-project-grid">
          <label v-for="project in projects" :key="project.id" class="about-admin-check">
            <input v-model="selectedProjectIds" type="checkbox" :value="project.id" />
            <span
              ><strong>{{ project.name }}</strong
              ><small>{{ project.slug }}</small></span
            >
          </label>
        </div>
        <div class="about-admin-actions">
          <button class="button" type="button" :disabled="!!busyKey" @click="saveProjects">
            保存项目关联
          </button>
        </div>
      </section>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">专业技能</p>
            <h2>按照实际用途整理技能</h2>
          </div>
          <span>{{ skills.length }} groups</span>
        </div>
        <div class="about-admin-collection">
          <article v-for="item in skills" :key="item.id" class="about-admin-card">
            <div class="about-admin-card__heading">
              <strong>{{ item.title || '未命名技能分组' }}</strong>
              <div>
                <button
                  class="admin-secondary-button"
                  type="button"
                  :disabled="!!busyKey"
                  @click="saveSkill(item)"
                >
                  保存
                </button>
                <button
                  class="admin-danger-button"
                  type="button"
                  :disabled="!!busyKey"
                  @click="deleteSkill(item)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="about-admin-form-grid">
              <label><span>标题</span><input v-model="item.title" required /></label>
              <label
                ><span>排序</span><input v-model.number="item.sortOrder" type="number" min="0"
              /></label>
              <label class="about-admin-form-grid__wide"
                ><span>内容</span><textarea v-model="item.content" rows="3" required />
              </label>
            </div>
          </article>
        </div>
        <article class="about-admin-card about-admin-card--new">
          <div class="about-admin-card__heading"><strong>添加技能分组</strong></div>
          <div class="about-admin-form-grid">
            <label><span>标题</span><input v-model="newSkill.title" required /></label>
            <label
              ><span>排序</span><input v-model.number="newSkill.sortOrder" type="number" min="0"
            /></label>
            <label class="about-admin-form-grid__wide"
              ><span>内容</span><textarea v-model="newSkill.content" rows="3" required />
            </label>
          </div>
          <button class="button" type="button" :disabled="!!busyKey" @click="addSkill">
            添加技能分组
          </button>
        </article>
      </section>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">教育经历</p>
            <h2>记录教育背景</h2>
          </div>
          <span>{{ educations.length }} entries</span>
        </div>
        <div class="about-admin-collection">
          <article v-for="item in educations" :key="item.id" class="about-admin-card">
            <div class="about-admin-card__heading">
              <strong>{{ item.school || '未命名教育经历' }}</strong>
              <div>
                <button
                  class="admin-secondary-button"
                  type="button"
                  :disabled="!!busyKey"
                  @click="saveEducation(item)"
                >
                  保存
                </button>
                <button
                  class="admin-danger-button"
                  type="button"
                  :disabled="!!busyKey"
                  @click="deleteEducation(item)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="about-admin-form-grid">
              <label><span>学校</span><input v-model="item.school" required /></label>
              <label><span>专业</span><input v-model="item.major" required /></label>
              <label><span>学历</span><input v-model="item.degree" required /></label>
              <label
                ><span>排序</span><input v-model.number="item.sortOrder" type="number" min="0"
              /></label>
              <label
                ><span>开始日期</span><input v-model="item.startDate" type="date" required
              /></label>
              <label><span>结束日期</span><input v-model="item.endDate" type="date" /></label>
              <label class="about-admin-form-grid__wide"
                ><span>描述</span><textarea v-model="item.description" rows="3" required />
              </label>
            </div>
          </article>
        </div>
        <article class="about-admin-card about-admin-card--new">
          <div class="about-admin-card__heading"><strong>添加教育经历</strong></div>
          <div class="about-admin-form-grid">
            <label><span>学校</span><input v-model="newEducation.school" required /></label>
            <label><span>专业</span><input v-model="newEducation.major" required /></label>
            <label><span>学历</span><input v-model="newEducation.degree" required /></label>
            <label
              ><span>排序</span
              ><input v-model.number="newEducation.sortOrder" type="number" min="0"
            /></label>
            <label
              ><span>开始日期</span><input v-model="newEducation.startDate" type="date" required
            /></label>
            <label><span>结束日期</span><input v-model="newEducation.endDate" type="date" /></label>
            <label class="about-admin-form-grid__wide"
              ><span>描述</span><textarea v-model="newEducation.description" rows="3" required />
            </label>
          </div>
          <button class="button" type="button" :disabled="!!busyKey" @click="addEducation">
            添加教育经历
          </button>
        </article>
      </section>
    </template>
  </div>
</template>
