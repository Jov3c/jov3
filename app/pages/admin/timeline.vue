<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

type DatePrecision = 'YEAR' | 'MONTH' | 'DAY';

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

interface TimelineLink {
  label: string;
  url: string;
  sortOrder: number;
}

interface AdminTimelineEntry {
  id: string;
  eventDate: string;
  datePrecision: DatePrecision;
  dateLabel: string;
  title: string;
  bodyHtml: string;
  bodyMarkdown: string;
  sortOrder: number;
  visible: boolean;
  mediaIds: string[];
  links: TimelineLink[];
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface TimelineDraft {
  eventDate: string;
  datePrecision: DatePrecision;
  title: string;
  bodyMarkdown: string;
  sortOrder: number;
  visible: boolean;
  mediaIds: string[];
  projectIds: string[];
  links: TimelineLink[];
}

const entries = ref<AdminTimelineEntry[]>([]);
const projects = ref<AdminProject[]>([]);
const media = ref<AdminMedia[]>([]);
const selectedEntryId = ref<string | null>(null);
const form = reactive<TimelineDraft>(createEmptyForm());
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');

const selectedEntry = computed(() =>
  entries.value.find((entry) => entry.id === selectedEntryId.value),
);
const isNewEntry = computed(() => selectedEntryId.value === null);

useSeoMeta({ title: 'Timeline — Jov3 Admin', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [timelineResult, projectResult, mediaResult] = await Promise.all([
      $fetch<{ data: AdminTimelineEntry[] }>('/api/v1/admin/timeline'),
      $fetch<{ data: { items: AdminProject[] } }>('/api/v1/admin/projects'),
      $fetch<{ data: AdminMedia[] }>('/api/v1/admin/media', {
        query: { page: 1, pageSize: 100, q: '' },
      }),
    ]);
    entries.value = timelineResult.data;
    projects.value = projectResult.data.items;
    media.value = mediaResult.data;

    if (selectedEntryId.value) {
      const current = entries.value.find((entry) => entry.id === selectedEntryId.value);
      if (current) fillForm(current);
      else startNewEntry();
    } else if (!entries.value.length) {
      startNewEntry();
    }
  } catch {
    errorMessage.value = 'Timeline 加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

function selectEntry(entry: AdminTimelineEntry) {
  selectedEntryId.value = entry.id;
  fillForm(entry);
  notice.value = '';
  errorMessage.value = '';
}

function startNewEntry() {
  selectedEntryId.value = null;
  Object.assign(form, createEmptyForm());
  notice.value = '';
  errorMessage.value = '';
}

async function saveEntry() {
  await runAction('save', async () => {
    const body = formPayload();
    if (selectedEntryId.value) {
      const result = await $fetch<{ data: AdminTimelineEntry }>(
        `/api/v1/admin/timeline/${selectedEntryId.value}`,
        { method: 'PATCH', body },
      );
      replaceEntry(result.data);
      fillForm(result.data);
      notice.value = `Timeline「${result.data.title}」已保存。`;
      return;
    }

    const result = await $fetch<{ data: AdminTimelineEntry }>('/api/v1/admin/timeline', {
      method: 'POST',
      body,
    });
    entries.value = [...entries.value, result.data].sort(compareEntries);
    selectedEntryId.value = result.data.id;
    fillForm(result.data);
    notice.value = `Timeline「${result.data.title}」已创建。`;
  });
}

async function deleteEntry() {
  const entry = selectedEntry.value;
  if (!entry || !window.confirm(`确定删除「${entry.title}」吗？`)) return;
  await runAction('delete', async () => {
    await $fetch(`/api/v1/admin/timeline/${entry.id}`, { method: 'DELETE' });
    entries.value = entries.value.filter((item) => item.id !== entry.id);
    if (entries.value[0]) selectEntry(entries.value[0]);
    else startNewEntry();
    notice.value = 'Timeline entry 已删除。';
  });
}

function addLink() {
  form.links.push({ label: '', url: 'https://', sortOrder: (form.links.length + 1) * 10 });
}

function removeLink(index: number) {
  form.links.splice(index, 1);
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
    eventDate: form.eventDate,
    datePrecision: form.datePrecision,
    title: form.title,
    bodyMarkdown: form.bodyMarkdown,
    sortOrder: Number(form.sortOrder),
    visible: form.visible,
    mediaIds: form.mediaIds,
    links: form.links.map((link) => ({
      label: link.label,
      url: link.url,
      sortOrder: Number(link.sortOrder),
    })),
    projectIds: form.projectIds,
  };
}

function fillForm(entry: AdminTimelineEntry) {
  Object.assign(form, {
    eventDate: entry.eventDate,
    datePrecision: entry.datePrecision,
    title: entry.title,
    bodyMarkdown: entry.bodyMarkdown,
    sortOrder: entry.sortOrder,
    visible: entry.visible,
    mediaIds: [...entry.mediaIds],
    projectIds: [...entry.projectIds],
    links: entry.links.map((link) => ({ ...link })),
  });
}

function replaceEntry(entry: AdminTimelineEntry) {
  entries.value = entries.value
    .map((item) => (item.id === entry.id ? entry : item))
    .sort(compareEntries);
}

function createEmptyForm(): TimelineDraft {
  return {
    eventDate: '2026-01-01',
    datePrecision: 'DAY',
    title: '',
    bodyMarkdown: '',
    sortOrder: (entries.value.length + 1) * 10,
    visible: true,
    mediaIds: [],
    projectIds: [],
    links: [],
  };
}

function compareEntries(left: AdminTimelineEntry, right: AdminTimelineEntry) {
  return (
    left.eventDate.localeCompare(right.eventDate) ||
    left.sortOrder - right.sortOrder ||
    left.id.localeCompare(right.id)
  );
}

onMounted(load);
</script>

<template>
  <div class="timeline-admin">
    <header class="admin-page-heading">
      <div>
        <p>Content / Timeline</p>
        <h1>Timeline</h1>
      </div>
      <button class="button" type="button" :disabled="isLoading" @click="startNewEntry">
        New entry
      </button>
    </header>

    <p v-if="isLoading" class="media-empty">Loading timeline…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <div class="timeline-admin-layout">
        <section class="home-admin-section timeline-admin-list-panel">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">Life / Work / Notes</p>
              <h2>Story index.</h2>
            </div>
            <span>{{ entries.length }} entries</span>
          </div>
          <div v-if="!entries.length" class="media-empty">还没有 Timeline entry，先创建一个。</div>
          <ol v-else class="timeline-admin-list">
            <li v-for="entry in entries" :key="entry.id">
              <button
                class="timeline-admin-list__item"
                :class="{ 'timeline-admin-list__item--active': selectedEntryId === entry.id }"
                type="button"
                @click="selectEntry(entry)"
              >
                <span>{{ entry.dateLabel }}</span>
                <strong>{{ entry.title }}</strong>
                <small>{{ entry.visible ? 'Visible' : 'Hidden' }}</small>
              </button>
            </li>
          </ol>
        </section>

        <section class="home-admin-section timeline-admin-editor">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">{{ isNewEntry ? 'New entry' : 'Edit entry' }}</p>
              <h2>{{ isNewEntry ? 'Add the next marker.' : form.title }}</h2>
            </div>
            <span>Public page renders Markdown safely</span>
          </div>
          <form class="about-admin-form-grid" @submit.prevent="saveEntry">
            <label><span>Date</span><input v-model="form.eventDate" type="date" required /></label>
            <label
              ><span>Precision</span
              ><select v-model="form.datePrecision">
                <option value="YEAR">Year</option>
                <option value="MONTH">Month</option>
                <option value="DAY">Day</option>
              </select></label
            >
            <label><span>Title</span><input v-model="form.title" required maxlength="180" /></label>
            <label
              ><span>Sort</span><input v-model.number="form.sortOrder" type="number" min="0"
            /></label>
            <label class="home-checkbox about-admin-form-grid__wide"
              ><input v-model="form.visible" type="checkbox" /><span
                >Visible on public Timeline</span
              ></label
            >
            <label class="about-admin-form-grid__wide"
              ><span>Body</span
              ><textarea v-model="form.bodyMarkdown" rows="14" placeholder="Markdown body" />
            </label>

            <div class="timeline-admin-relations about-admin-form-grid__wide">
              <div class="timeline-admin-relation-group">
                <strong>Media</strong>
                <select v-model="form.mediaIds" multiple size="5" aria-label="Timeline media">
                  <option v-for="item in media" :key="item.id" :value="item.id">
                    {{ item.originalName }}
                  </option>
                </select>
              </div>
              <div class="timeline-admin-relation-group">
                <strong>Projects</strong>
                <select v-model="form.projectIds" multiple size="5" aria-label="Timeline projects">
                  <option v-for="project in projects" :key="project.id" :value="project.id">
                    {{ project.name }}{{ project.visible ? '' : ' · hidden' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="timeline-admin-links about-admin-form-grid__wide">
              <div class="about-admin-card__heading">
                <strong>External links</strong>
                <button class="admin-secondary-button" type="button" @click="addLink">
                  Add link
                </button>
              </div>
              <div v-if="!form.links.length" class="media-empty">No external links.</div>
              <div v-for="(link, index) in form.links" :key="index" class="timeline-admin-link-row">
                <label><span>Label</span><input v-model="link.label" required /></label>
                <label><span>URL</span><input v-model="link.url" type="url" required /></label>
                <button class="admin-danger-button" type="button" @click="removeLink(index)">
                  Remove
                </button>
              </div>
            </div>

            <div class="about-admin-actions about-admin-form-grid__wide">
              <button class="button" type="submit" :disabled="!!busyKey">
                {{ isNewEntry ? 'Create entry' : 'Save entry' }}
              </button>
              <button
                v-if="!isNewEntry"
                class="admin-danger-button"
                type="button"
                :disabled="!!busyKey"
                @click="deleteEntry"
              >
                Delete entry
              </button>
            </div>
          </form>
        </section>
      </div>
    </template>
  </div>
</template>
