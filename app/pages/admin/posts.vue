<script setup lang="ts">
import { POST_STATUS_LABELS, POST_STATUSES, type PostStatus } from '#shared/constants/blog';
import { renderMarkdown } from '#shared/markdown';
import type { AdminMediaOption, AdminPost, BlogCategory } from '~/types/blog';

definePageMeta({ layout: 'admin', middleware: 'admin' });

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  coverMediaId: string;
  status: PostStatus;
  markdownBody: string;
  seoTitle: string;
  seoDescription: string;
}

const posts = ref<AdminPost[]>([]);
const categories = ref<BlogCategory[]>([]);
const media = ref<AdminMediaOption[]>([]);
const selectedPostId = ref<string | null>(null);
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');
const form = reactive<PostForm>(createEmptyForm());

const selectedPost = computed(() => posts.value.find((post) => post.id === selectedPostId.value));
const isNewPost = computed(() => selectedPostId.value === null);
const previewHtml = computed(() => renderMarkdown(form.markdownBody));

useSeoMeta({ title: 'Posts — Jov3 Admin', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  try {
    const [postResult, categoryResult, mediaResult] = await Promise.all([
      $fetch<{ data: AdminPost[] }>('/api/v1/admin/posts'),
      $fetch<{ data: BlogCategory[] }>('/api/v1/admin/categories'),
      $fetch<{ data: AdminMediaOption[] }>('/api/v1/admin/media', {
        query: { page: 1, pageSize: 60, q: '' },
      }),
    ]);
    posts.value = postResult.data;
    categories.value = categoryResult.data;
    media.value = mediaResult.data;
    if (selectedPostId.value) {
      const current = posts.value.find((post) => post.id === selectedPostId.value);
      if (current) fillForm(current);
    } else if (posts.value[0]) {
      selectPost(posts.value[0]);
    } else {
      startNewPost();
    }
  } catch {
    errorMessage.value = 'Posts 加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

function selectPost(post: AdminPost) {
  selectedPostId.value = post.id;
  fillForm(post);
  notice.value = '';
  errorMessage.value = '';
}

function startNewPost() {
  selectedPostId.value = null;
  Object.assign(form, createEmptyForm());
  notice.value = '';
  errorMessage.value = '';
}

async function savePost() {
  await runAction('save', async () => {
    const body = formPayload();
    if (selectedPostId.value) {
      const result = await $fetch<{ data: AdminPost }>(
        `/api/v1/admin/posts/${selectedPostId.value}`,
        { method: 'PATCH', body },
      );
      replacePost(result.data);
      fillForm(result.data);
      notice.value = `文章「${result.data.title}」已保存。`;
      return;
    }

    const result = await $fetch<{ data: AdminPost }>('/api/v1/admin/posts', {
      method: 'POST',
      body,
    });
    posts.value = [...posts.value, result.data].sort(comparePosts);
    selectedPostId.value = result.data.id;
    fillForm(result.data);
    notice.value = `文章「${result.data.title}」已创建。`;
  });
}

async function publishPost() {
  if (!selectedPostId.value) return;
  await runAction('publish', async () => {
    const result = await $fetch<{ data: AdminPost }>(
      `/api/v1/admin/posts/${selectedPostId.value}/publish`,
      { method: 'PATCH' },
    );
    replacePost(result.data);
    fillForm(result.data);
    notice.value = '文章已发布。';
  });
}

async function unpublishPost() {
  if (!selectedPostId.value) return;
  await runAction('unpublish', async () => {
    const result = await $fetch<{ data: AdminPost }>(
      `/api/v1/admin/posts/${selectedPostId.value}/unpublish`,
      { method: 'PATCH' },
    );
    replacePost(result.data);
    fillForm(result.data);
    notice.value = '文章已转为草稿。';
  });
}

async function deletePost() {
  const post = selectedPost.value;
  if (!post || !window.confirm(`确定删除「${post.title}」吗？`)) return;

  await runAction('delete', async () => {
    await $fetch(`/api/v1/admin/posts/${post.id}` as string, { method: 'DELETE' });
    posts.value = posts.value.filter((item) => item.id !== post.id);
    if (posts.value[0]) selectPost(posts.value[0]);
    else startNewPost();
    notice.value = '文章已删除。';
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
  form.markdownBody = await file.text();
  notice.value = `已导入 ${file.name}，保存文章后写入数据库。`;
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
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    categoryId: form.categoryId,
    coverMediaId: form.coverMediaId || null,
    status: form.status,
    markdownBody: form.markdownBody,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
  };
}

function fillForm(post: AdminPost) {
  Object.assign(form, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    categoryId: post.category.id,
    coverMediaId: post.cover?.id ?? '',
    status: post.status,
    markdownBody: post.markdownBody,
    seoTitle: post.seoTitle ?? '',
    seoDescription: post.seoDescription ?? '',
  });
}

function replacePost(post: AdminPost) {
  posts.value = posts.value.map((item) => (item.id === post.id ? post : item)).sort(comparePosts);
}

function createEmptyForm(): PostForm {
  return {
    title: '',
    slug: 'new-post',
    excerpt: '',
    categoryId: categories.value[0]?.id ?? '',
    coverMediaId: '',
    status: 'DRAFT',
    markdownBody: '# New post\n\nWrite the article here.',
    seoTitle: '',
    seoDescription: '',
  };
}

function comparePosts(left: AdminPost, right: AdminPost) {
  return (right.publishedAt ?? right.createdAt).localeCompare(left.publishedAt ?? left.createdAt);
}

onMounted(load);
</script>

<template>
  <div class="posts-admin">
    <header class="admin-page-heading">
      <div>
        <p>Content / Posts</p>
        <h1>Posts</h1>
      </div>
      <div class="admin-heading-actions">
        <NuxtLink class="admin-secondary-button" to="/admin/categories">Manage categories</NuxtLink>
        <button class="button" type="button" :disabled="isLoading" @click="startNewPost">
          New post
        </button>
      </div>
    </header>

    <p v-if="isLoading" class="media-empty">Loading posts…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <div class="posts-admin-layout">
        <section class="home-admin-section posts-admin-list-panel">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">Article index</p>
              <h2>Writing, slowly.</h2>
            </div>
            <span>{{ posts.length }} total</span>
          </div>
          <div v-if="!posts.length" class="media-empty">还没有文章，先创建一篇草稿。</div>
          <ol v-else class="posts-admin-list">
            <li v-for="(post, index) in posts" :key="post.id">
              <button
                class="posts-admin-list__item"
                :class="{ 'posts-admin-list__item--active': selectedPostId === post.id }"
                type="button"
                @click="selectPost(post)"
              >
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <strong>{{ post.title }}</strong>
                <small :data-status="post.status.toLowerCase()">
                  {{ POST_STATUS_LABELS[post.status] }} · {{ post.category.name }}
                </small>
              </button>
            </li>
          </ol>
        </section>

        <form class="home-admin-section post-editor" @submit.prevent="savePost">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">{{ isNewPost ? 'New post' : 'Edit post' }}</p>
              <h2>{{ isNewPost ? 'Make space for a clear idea.' : form.title }}</h2>
            </div>
            <span>Markdown is the single source of truth</span>
          </div>

          <div v-if="!categories.length" class="admin-error">
            请先在 <NuxtLink to="/admin/categories">Categories</NuxtLink> 中创建分类。
          </div>
          <div class="post-form-grid">
            <label><span>Title</span><input v-model="form.title" maxlength="220" required /></label>
            <label><span>Slug</span><input v-model="form.slug" maxlength="160" required /></label>
            <label
              ><span>Category</span
              ><select v-model="form.categoryId" required>
                <option disabled value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select></label
            >
            <label
              ><span>Status</span
              ><select v-model="form.status">
                <option v-for="status in POST_STATUSES" :key="status" :value="status">
                  {{ POST_STATUS_LABELS[status] }}
                </option>
              </select></label
            >
            <label class="post-form-grid__wide"
              ><span>Excerpt</span
              ><textarea v-model="form.excerpt" rows="2" maxlength="500" required />
            </label>
            <label class="post-form-grid__wide"
              ><span>Cover media</span
              ><select v-model="form.coverMediaId">
                <option value="">No cover — use the editorial fallback</option>
                <option v-for="item in media" :key="item.id" :value="item.id">
                  {{ item.originalName }}
                </option>
              </select></label
            >
            <label><span>SEO title</span><input v-model="form.seoTitle" maxlength="220" /></label>
            <label
              ><span>SEO description</span><input v-model="form.seoDescription" maxlength="320"
            /></label>
          </div>

          <section class="post-editor__markdown">
            <div class="project-editor__subheading">
              <div>
                <p class="eyebrow">Article Markdown</p>
                <h3>Write once, render safely.</h3>
              </div>
              <label class="admin-secondary-button project-import-button">
                Import .md
                <input
                  class="project-file-input"
                  type="file"
                  accept=".md,text/markdown"
                  @change="importMarkdown"
                />
              </label>
            </div>
            <div class="project-editor__markdown-grid">
              <label class="project-markdown-input"
                ><span>Markdown source</span
                ><textarea
                  v-model="form.markdownBody"
                  rows="22"
                  spellcheck="false"
                  aria-label="Markdown source"
                />
              </label>
              <div class="project-markdown-preview">
                <span>Live preview</span>
                <!-- The shared renderer sanitizes the browser preview and the public API output. -->
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="readme__content" v-html="previewHtml" />
              </div>
            </div>
          </section>

          <div class="project-editor__actions post-editor__actions">
            <button
              class="button"
              type="submit"
              :disabled="busyKey === 'save' || !categories.length"
            >
              {{ isNewPost ? 'Create post' : 'Save post' }}
            </button>
            <button
              v-if="!isNewPost && form.status === 'DRAFT'"
              class="admin-secondary-button"
              type="button"
              :disabled="busyKey === 'publish'"
              @click="publishPost"
            >
              Publish now
            </button>
            <button
              v-if="!isNewPost && form.status === 'PUBLISHED'"
              class="admin-secondary-button"
              type="button"
              :disabled="busyKey === 'unpublish'"
              @click="unpublishPost"
            >
              Move to draft
            </button>
            <button
              v-if="!isNewPost"
              class="admin-danger-button"
              type="button"
              :disabled="busyKey === 'delete'"
              @click="deletePost"
            >
              Delete post
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>
