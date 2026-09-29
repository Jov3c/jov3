<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface MediaItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  publicUrl: string;
  altText: string | null;
  createdAt: string;
  referenceCount: number;
  isReferenced: boolean;
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'avatars', label: 'Avatars' },
  { value: 'blog', label: 'Blog' },
  { value: 'projects', label: 'Projects' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'footprint', label: 'Footprint' },
  { value: 'links', label: 'Links' },
];
const items = ref<MediaItem[]>([]);
const query = ref('');
const selectedCategory = ref('general');
const selectedFile = ref<File | null>(null);
const altText = ref('');
const isLoading = ref(true);
const isUploading = ref(false);
const notice = ref('');
const errorMessage = ref('');
const total = ref(0);

useSeoMeta({ title: 'Media Library — Jov3 Admin', robots: 'noindex, nofollow' });

async function loadMedia() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await $fetch<{ data: MediaItem[]; meta: { total: number } }>(
      '/api/v1/admin/media',
      { query: { page: 1, pageSize: 60, q: query.value } },
    );
    items.value = result.data;
    total.value = result.meta.total;
  } catch {
    errorMessage.value = '媒体列表加载失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
}

function chooseFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function uploadMedia() {
  if (!selectedFile.value) {
    errorMessage.value = '请先选择图片。';
    return;
  }

  isUploading.value = true;
  errorMessage.value = '';
  notice.value = '';
  const body = new FormData();
  body.append('file', selectedFile.value);
  body.append('category', selectedCategory.value);
  body.append('altText', altText.value);

  try {
    await $fetch('/api/v1/admin/media/upload', { method: 'POST', body });
    selectedFile.value = null;
    altText.value = '';
    const input = document.querySelector<HTMLInputElement>('#media-file');
    if (input) input.value = '';
    notice.value = '图片已上传。';
    await loadMedia();
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '上传失败，请检查文件类型和大小。';
  } finally {
    isUploading.value = false;
  }
}

async function updateAltText(item: MediaItem) {
  try {
    await $fetch(`/api/v1/admin/media/${item.id}`, {
      method: 'PATCH',
      body: { altText: item.altText?.trim() || null },
    });
    notice.value = '替代文本已保存。';
  } catch {
    errorMessage.value = '替代文本保存失败。';
  }
}

async function deleteMedia(item: MediaItem) {
  if (item.isReferenced || !window.confirm(`确定删除「${item.originalName}」吗？`)) return;
  try {
    await $fetch(`/api/v1/admin/media/${item.id}`, { method: 'DELETE' });
    items.value = items.value.filter((entry) => entry.id !== item.id);
    total.value -= 1;
    notice.value = '媒体已删除。';
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '媒体删除失败。';
  }
}

async function copyUrl(item: MediaItem) {
  await navigator.clipboard.writeText(new URL(item.publicUrl, window.location.origin).toString());
  notice.value = '媒体 URL 已复制。';
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

onMounted(loadMedia);
</script>

<template>
  <div class="media-library">
    <header class="admin-page-heading">
      <div>
        <p>System / Media</p>
        <h1>Media Library</h1>
      </div>
      <span>{{ total }} assets · stored outside the build</span>
    </header>

    <section class="media-upload-panel">
      <div>
        <p class="eyebrow">Persistent server storage</p>
        <h2>Bring an image into the library.</h2>
        <p>JPEG、PNG、WebP 和 GIF，单张不超过 10 MB。SVG 默认关闭。</p>
      </div>
      <form class="media-upload-form" @submit.prevent="uploadMedia">
        <label for="media-file">Image file</label>
        <input
          id="media-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          @change="chooseFile"
        />
        <div class="media-upload-form__row">
          <label>
            <span>Folder</span>
            <select v-model="selectedCategory">
              <option v-for="category in categories" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
          </label>
          <label>
            <span>Alt text</span>
            <input v-model="altText" type="text" maxlength="300" placeholder="Describe the image" />
          </label>
        </div>
        <button class="button" type="submit" :disabled="isUploading">
          {{ isUploading ? 'Uploading…' : 'Upload image' }}
        </button>
      </form>
    </section>

    <div class="media-toolbar">
      <label class="media-search">
        <span>Search media</span>
        <input
          v-model="query"
          type="search"
          placeholder="filename or alt text"
          @keyup.enter="loadMedia"
        />
      </label>
      <button class="admin-secondary-button" type="button" @click="loadMedia">Refresh</button>
    </div>

    <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
    <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
    <p v-if="isLoading" class="media-empty">Loading media…</p>
    <p v-else-if="items.length === 0" class="media-empty">No media assets yet.</p>
    <section v-else class="media-grid" aria-label="Media assets">
      <article v-for="item in items" :key="item.id" class="media-card">
        <div class="media-card__preview">
          <img :src="item.publicUrl" :alt="item.altText || item.originalName" loading="lazy" />
        </div>
        <div class="media-card__body">
          <strong :title="item.originalName">{{ item.originalName }}</strong>
          <small>{{ item.mimeType }} · {{ formatBytes(item.sizeBytes) }}</small>
          <input
            v-model="item.altText"
            type="text"
            maxlength="300"
            placeholder="Alt text"
            @change="updateAltText(item)"
          />
          <div class="media-card__actions">
            <button type="button" @click="copyUrl(item)">Copy URL</button>
            <button type="button" :disabled="item.isReferenced" @click="deleteMedia(item)">
              {{ item.isReferenced ? `${item.referenceCount} references` : 'Delete' }}
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
