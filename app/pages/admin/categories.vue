<script setup lang="ts">
import type { BlogCategory } from '~/types/blog';

definePageMeta({ layout: 'admin', middleware: 'admin' });

interface CategoryForm {
  slug: string;
  name: string;
  sortOrder: number;
  visible: boolean;
}

const categories = ref<BlogCategory[]>([]);
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');
const form = reactive<CategoryForm>(createEmptyForm());
const selectedId = ref<string | null>(null);

const selectedCategory = computed(() =>
  categories.value.find((category) => category.id === selectedId.value),
);

useSeoMeta({ title: '分类管理 — JOV3 管理后台', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  try {
    const result = await $fetch<{ data: BlogCategory[] }>('/api/v1/admin/categories');
    categories.value = result.data;
    if (selectedId.value) {
      const current = categories.value.find((category) => category.id === selectedId.value);
      if (current) fillForm(current);
    }
  } catch {
    errorMessage.value = '分类加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

function selectCategory(category: BlogCategory) {
  selectedId.value = category.id;
  fillForm(category);
  notice.value = '';
  errorMessage.value = '';
}

function startNew() {
  selectedId.value = null;
  Object.assign(form, createEmptyForm());
}

async function save() {
  await runAction('save', async () => {
    if (selectedId.value) {
      const result = await $fetch<{ data: BlogCategory }>(
        `/api/v1/admin/categories/${selectedId.value}`,
        { method: 'PATCH', body: formPayload() },
      );
      categories.value = categories.value.map((item) =>
        item.id === result.data.id ? result.data : item,
      );
      fillForm(result.data);
      notice.value = `分类「${result.data.name}」已保存。`;
      return;
    }
    const result = await $fetch<{ data: BlogCategory }>('/api/v1/admin/categories', {
      method: 'POST',
      body: formPayload(),
    });
    categories.value = [...categories.value, result.data].sort(compareCategories);
    selectCategory(result.data);
    notice.value = `分类「${result.data.name}」已创建。`;
  });
}

async function remove() {
  const category = selectedCategory.value;
  if (!category || !window.confirm(`确定删除「${category.name}」吗？`)) return;
  await runAction('delete', async () => {
    await $fetch(`/api/v1/admin/categories/${category.id}`, { method: 'DELETE' });
    categories.value = categories.value.filter((item) => item.id !== category.id);
    startNew();
    notice.value = '分类已删除。';
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

function formPayload() {
  return { ...form };
}

function fillForm(category: BlogCategory) {
  Object.assign(form, {
    slug: category.slug,
    name: category.name,
    sortOrder: category.sortOrder,
    visible: category.visible,
  });
}

function createEmptyForm(): CategoryForm {
  return {
    slug: 'new-category',
    name: '',
    sortOrder: (categories.value.length + 1) * 10,
    visible: true,
  };
}

function compareCategories(left: BlogCategory, right: BlogCategory) {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

onMounted(load);
</script>

<template>
  <div class="categories-admin">
    <header class="admin-page-heading">
      <div>
        <p>内容管理 / 分类</p>
        <h1>分类管理</h1>
      </div>
      <button class="button" type="button" :disabled="isLoading" @click="startNew">新建分类</button>
    </header>

    <p v-if="isLoading" class="media-empty">正在加载分类…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
      <div class="categories-admin-layout">
        <section class="home-admin-section">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">分类列表</p>
              <h2>保持内容结构清晰。</h2>
            </div>
            <span>共 {{ categories.length }} 个分类</span>
          </div>
          <ol class="categories-admin-list">
            <li v-for="category in categories" :key="category.id">
              <button
                class="posts-admin-list__item"
                :class="{ 'posts-admin-list__item--active': selectedId === category.id }"
                type="button"
                @click="selectCategory(category)"
              >
                <strong>{{ category.name }}</strong>
                <small>{{ category.slug }} · {{ category.postCount }} 篇文章</small>
              </button>
            </li>
          </ol>
        </section>

        <form class="home-admin-section category-editor" @submit.prevent="save">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">{{ selectedId ? '编辑分类' : '新建分类' }}</p>
              <h2>{{ form.name || '为分类命名' }}</h2>
            </div>
            <span>分类用于整理文章和归档</span>
          </div>
          <div class="category-form-grid">
            <label><span>名称</span><input v-model="form.name" maxlength="80" required /></label>
            <label
              ><span>路径标识</span><input v-model="form.slug" maxlength="80" required
            /></label>
            <label
              ><span>排序</span><input v-model.number="form.sortOrder" type="number" min="0"
            /></label>
            <label class="home-checkbox"
              ><input v-model="form.visible" type="checkbox" /><span>公开显示</span></label
            >
          </div>
          <div class="project-editor__actions">
            <button class="button" type="submit" :disabled="busyKey === 'save'">
              {{ selectedId ? '保存分类' : '创建分类' }}
            </button>
            <button
              v-if="selectedId"
              class="admin-danger-button"
              type="button"
              :disabled="busyKey === 'delete' || Boolean(selectedCategory?.postCount)"
              :title="selectedCategory?.postCount ? '有文章引用此分类，不能删除' : undefined"
              @click="remove"
            >
              {{ selectedCategory?.postCount ? '分类正在使用' : '删除分类' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>
