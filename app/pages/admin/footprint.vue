<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface AdminMedia {
  id: string;
  originalName: string;
  publicUrl: string;
  altText: string | null;
}

interface AdminMemory {
  id: string;
  cityId: string;
  title: string;
  body: string;
  occurredOn: string | null;
  sortOrder: number;
  visible: boolean;
  mediaIds: string[];
  media: AdminMedia[];
  createdAt: string;
  updatedAt: string;
}

interface AdminCity {
  id: string;
  slug: string;
  countryCode: string;
  countryName: string;
  cityName: string;
  regionName: string | null;
  geoProvider: string;
  geoCode: string | null;
  localGeoJsonPath: string | null;
  sortOrder: number;
  memoryCount: number;
  visibleMemoryCount: number;
  visited: boolean;
  memories: AdminMemory[];
  createdAt: string;
  updatedAt: string;
}

interface CityDraft {
  slug: string;
  countryCode: string;
  countryName: string;
  cityName: string;
  regionName: string;
  geoProvider: string;
  geoCode: string;
  localGeoJsonPath: string;
  sortOrder: number;
}

interface MemoryDraft {
  title: string;
  body: string;
  occurredOn: string;
  sortOrder: number;
  visible: boolean;
  mediaIds: string[];
}

const cities = ref<AdminCity[]>([]);
const media = ref<AdminMedia[]>([]);
const selectedCityId = ref<string | null>(null);
const selectedMemoryId = ref<string | null>(null);
const selectedCity = computed(() => cities.value.find((city) => city.id === selectedCityId.value));
const selectedMemory = computed(() =>
  selectedCity.value?.memories.find((memory) => memory.id === selectedMemoryId.value),
);
const cityForm = reactive<CityDraft>(createEmptyCity());
const memoryForm = reactive<MemoryDraft>(createEmptyMemory());
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');

const isNewCity = computed(() => selectedCityId.value === null);
const isNewMemory = computed(() => selectedMemoryId.value === null);

useSeoMeta({ title: '足迹数据 — JOV3 管理后台', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [cityResult, mediaResult] = await Promise.all([
      $fetch<{ data: AdminCity[] }>('/api/v1/admin/footprint/cities'),
      $fetch<{ data: AdminMedia[] }>('/api/v1/admin/media', {
        query: { page: 1, pageSize: 100, q: '' },
      }),
    ]);
    cities.value = cityResult.data;
    media.value = mediaResult.data;
    if (selectedCityId.value) {
      const current = cities.value.find((city) => city.id === selectedCityId.value);
      if (current) fillCityForm(current);
      else startNewCity();
    } else if (cities.value[0]) {
      selectCity(cities.value[0]);
    } else {
      startNewCity();
    }
  } catch {
    errorMessage.value = 'Footprint 加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

function selectCity(city: AdminCity) {
  selectedCityId.value = city.id;
  fillCityForm(city);
  selectedMemoryId.value = city.memories[0]?.id ?? null;
  if (city.memories[0]) fillMemoryForm(city.memories[0]);
  else startNewMemory();
  clearFeedback();
}

function startNewCity() {
  selectedCityId.value = null;
  selectedMemoryId.value = null;
  Object.assign(cityForm, createEmptyCity());
  Object.assign(memoryForm, createEmptyMemory());
  clearFeedback();
}

function startNewMemory() {
  selectedMemoryId.value = null;
  Object.assign(memoryForm, createEmptyMemory());
  clearFeedback();
}

async function saveCity() {
  await runAction('save-city', async () => {
    const body = {
      slug: cityForm.slug.trim(),
      countryCode: cityForm.countryCode.trim(),
      countryName: cityForm.countryName.trim(),
      cityName: cityForm.cityName.trim(),
      regionName: cityForm.regionName.trim() || null,
      geoProvider: cityForm.geoProvider.trim(),
      geoCode: cityForm.geoCode.trim() || null,
      localGeoJsonPath: cityForm.localGeoJsonPath.trim() || null,
      sortOrder: Number(cityForm.sortOrder),
    };
    if (selectedCityId.value) {
      const result = await $fetch<{ data: AdminCity }>(
        `/api/v1/admin/footprint/cities/${selectedCityId.value}`,
        { method: 'PATCH', body },
      );
      replaceCity(result.data);
      fillCityForm(result.data);
      notice.value = `城市「${result.data.cityName}」已保存。`;
      return;
    }
    const result = await $fetch<{ data: AdminCity }>('/api/v1/admin/footprint/cities', {
      method: 'POST',
      body,
    });
    cities.value = [...cities.value, normalizeCityStats(result.data)].sort(compareCities);
    selectedCityId.value = result.data.id;
    fillCityForm(result.data);
    startNewMemory();
    notice.value = `城市「${result.data.cityName}」已创建。`;
  });
}

async function deleteCity() {
  const city = selectedCity.value;
  if (!city || !window.confirm(`确定删除「${city.cityName}」及其记忆吗？`)) return;
  await runAction('delete-city', async () => {
    await $fetch(`/api/v1/admin/footprint/cities/${city.id}`, { method: 'DELETE' });
    cities.value = cities.value.filter((item) => item.id !== city.id);
    if (cities.value[0]) selectCity(cities.value[0]);
    else startNewCity();
    notice.value = '城市及其记忆已删除。';
  });
}

async function saveMemory() {
  if (!selectedCityId.value) {
    errorMessage.value = '请先保存城市，再添加记忆。';
    return;
  }
  await runAction('save-memory', async () => {
    const body = {
      cityId: selectedCityId.value,
      title: memoryForm.title.trim(),
      body: memoryForm.body,
      occurredOn: memoryForm.occurredOn || null,
      sortOrder: Number(memoryForm.sortOrder),
      visible: memoryForm.visible,
      mediaIds: memoryForm.mediaIds,
    };
    if (selectedMemoryId.value) {
      const result = await $fetch<{ data: AdminMemory }>(
        `/api/v1/admin/footprint/memories/${selectedMemoryId.value}`,
        { method: 'PATCH', body },
      );
      replaceMemory(result.data);
      fillMemoryForm(result.data);
      notice.value = `记忆「${result.data.title}」已保存。`;
      return;
    }
    const result = await $fetch<{ data: AdminMemory }>('/api/v1/admin/footprint/memories', {
      method: 'POST',
      body,
    });
    const city = selectedCity.value;
    if (!city) return;
    replaceCity({ ...city, memories: [...city.memories, result.data].sort(compareMemories) });
    selectedMemoryId.value = result.data.id;
    fillMemoryForm(result.data);
    notice.value = `记忆「${result.data.title}」已创建。`;
  });
}

async function deleteMemory() {
  const memory = selectedMemory.value;
  if (!memory || !window.confirm(`确定删除「${memory.title}」吗？`)) return;
  await runAction('delete-memory', async () => {
    await $fetch(`/api/v1/admin/footprint/memories/${memory.id}`, { method: 'DELETE' });
    const city = selectedCity.value;
    if (!city) return;
    replaceCity({ ...city, memories: city.memories.filter((item) => item.id !== memory.id) });
    if (city.memories.some((item) => item.id !== memory.id)) {
      const next = city.memories.find((item) => item.id !== memory.id);
      if (next) {
        selectedMemoryId.value = next.id;
        fillMemoryForm(next);
      }
    } else startNewMemory();
    notice.value = '记忆已删除。';
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

function fillCityForm(city: AdminCity) {
  Object.assign(cityForm, {
    slug: city.slug,
    countryCode: city.countryCode,
    countryName: city.countryName,
    cityName: city.cityName,
    regionName: city.regionName ?? '',
    geoProvider: city.geoProvider,
    geoCode: city.geoCode ?? '',
    localGeoJsonPath: city.localGeoJsonPath ?? '',
    sortOrder: city.sortOrder,
  });
}

function fillMemoryForm(memory: AdminMemory) {
  Object.assign(memoryForm, {
    title: memory.title,
    body: memory.body,
    occurredOn: memory.occurredOn ?? '',
    sortOrder: memory.sortOrder,
    visible: memory.visible,
    mediaIds: [...memory.mediaIds],
  });
}

function replaceCity(city: AdminCity) {
  const nextCity = normalizeCityStats(city);
  cities.value = cities.value
    .map((item) => (item.id === nextCity.id ? nextCity : item))
    .sort(compareCities);
}

function normalizeCityStats(city: AdminCity): AdminCity {
  const visibleMemoryCount = city.memories.filter((memory) => memory.visible).length;
  return {
    ...city,
    memoryCount: city.memories.length,
    visibleMemoryCount,
    visited: visibleMemoryCount > 0,
  };
}

function replaceMemory(memory: AdminMemory) {
  const city = selectedCity.value;
  if (!city) return;
  replaceCity({
    ...city,
    memories: city.memories
      .map((item) => (item.id === memory.id ? memory : item))
      .sort(compareMemories),
  });
}

function createEmptyCity(): CityDraft {
  return {
    slug: 'new-city',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '',
    regionName: '',
    geoProvider: 'fixture',
    geoCode: '104.0668,30.5728',
    localGeoJsonPath: '',
    sortOrder: (cities.value.length + 1) * 10,
  };
}

function createEmptyMemory(): MemoryDraft {
  return {
    title: '',
    body: '',
    occurredOn: '',
    sortOrder: (selectedCity.value?.memories.length ?? 0) * 10,
    visible: true,
    mediaIds: [],
  };
}

function compareCities(left: AdminCity, right: AdminCity) {
  return left.sortOrder - right.sortOrder || left.cityName.localeCompare(right.cityName);
}

function compareMemories(left: AdminMemory, right: AdminMemory) {
  return (
    (left.occurredOn ?? '').localeCompare(right.occurredOn ?? '') ||
    left.sortOrder - right.sortOrder
  );
}

function clearFeedback() {
  notice.value = '';
  errorMessage.value = '';
}

onMounted(load);
</script>

<template>
  <div class="footprint-admin">
    <header class="admin-page-heading">
      <div>
        <p>系统管理 / 足迹</p>
        <h1>足迹数据</h1>
      </div>
      <button class="button" type="button" :disabled="isLoading" @click="startNewCity">
        新建城市
      </button>
    </header>

    <p v-if="isLoading" class="media-empty">正在加载足迹数据…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <div class="footprint-admin-layout">
        <section class="home-admin-section footprint-admin-list-panel">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">城市列表</p>
              <h2>记录去过的地方。</h2>
            </div>
            <span>{{ cities.length }} cities</span>
          </div>
          <div v-if="!cities.length" class="media-empty">还没有城市，先添加一个。</div>
          <ol v-else class="footprint-admin-list">
            <li v-for="city in cities" :key="city.id">
              <button
                class="footprint-admin-list__item"
                :class="{ 'footprint-admin-list__item--active': selectedCityId === city.id }"
                type="button"
                @click="selectCity(city)"
              >
                <span>{{ city.countryCode }} · {{ city.slug }}</span>
                <strong>{{ city.cityName }}</strong>
                <small>{{ city.visited ? 'Visited' : 'No visible memories' }}</small>
              </button>
            </li>
          </ol>
        </section>

        <section class="home-admin-section footprint-admin-editor">
          <div class="home-admin-section__heading">
            <div>
              <p class="eyebrow">{{ isNewCity ? '新建城市' : '编辑城市' }}</p>
              <h2>{{ isNewCity ? '添加去过的地方' : cityForm.cityName }}</h2>
            </div>
            <span>仅使用城市边界数据</span>
          </div>
          <form class="about-admin-form-grid" @submit.prevent="saveCity">
            <label
              ><span>城市名称</span><input v-model="cityForm.cityName" required maxlength="120"
            /></label>
            <label
              ><span>路径标识</span><input v-model="cityForm.slug" required maxlength="140"
            /></label>
            <label
              ><span>国家代码</span><input v-model="cityForm.countryCode" required maxlength="2"
            /></label>
            <label
              ><span>国家</span><input v-model="cityForm.countryName" required maxlength="100"
            /></label>
            <label><span>地区</span><input v-model="cityForm.regionName" maxlength="120" /></label>
            <label
              ><span>排序</span><input v-model.number="cityForm.sortOrder" type="number" min="0"
            /></label>
            <label
              ><span>地理数据来源</span
              ><input v-model="cityForm.geoProvider" required maxlength="80"
            /></label>
            <label
              ><span>地理编码 / 测试经纬度</span><input v-model="cityForm.geoCode" maxlength="160"
            /></label>
            <label class="about-admin-form-grid__wide"
              ><span>本地 GeoJSON 路径（选填）</span
              ><input v-model="cityForm.localGeoJsonPath" maxlength="500"
            /></label>
            <div class="about-admin-actions about-admin-form-grid__wide">
              <button class="button" type="submit" :disabled="!!busyKey">
                {{ isNewCity ? '创建城市' : '保存城市' }}
              </button>
              <button
                v-if="!isNewCity"
                class="admin-danger-button"
                type="button"
                :disabled="!!busyKey"
                @click="deleteCity"
              >
                删除城市
              </button>
            </div>
          </form>
        </section>
      </div>

      <section v-if="selectedCity" class="home-admin-section footprint-memory-admin">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">城市记忆 / {{ selectedCity.cityName }}</p>
            <h2>{{ isNewMemory ? '添加一段记忆' : memoryForm.title }}</h2>
          </div>
          <button
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="startNewMemory"
          >
            新建记忆
          </button>
        </div>
        <div class="footprint-memory-admin-layout">
          <div>
            <div v-if="!selectedCity.memories.length" class="media-empty">
              还没有记忆，先添加一条。
            </div>
            <ol v-else class="footprint-admin-list">
              <li v-for="memory in selectedCity.memories" :key="memory.id">
                <button
                  class="footprint-admin-list__item"
                  :class="{ 'footprint-admin-list__item--active': selectedMemoryId === memory.id }"
                  type="button"
                  @click="
                    selectedMemoryId = memory.id;
                    fillMemoryForm(memory);
                  "
                >
                  <span>{{ memory.occurredOn || 'No date' }}</span>
                  <strong>{{ memory.title }}</strong>
                  <small>{{ memory.visible ? '已显示' : '已隐藏' }}</small>
                </button>
              </li>
            </ol>
          </div>
          <form class="about-admin-form-grid" @submit.prevent="saveMemory">
            <label><span>日期</span><input v-model="memoryForm.occurredOn" type="date" /></label>
            <label
              ><span>排序</span><input v-model.number="memoryForm.sortOrder" type="number" min="0"
            /></label>
            <label class="about-admin-form-grid__wide"
              ><span>标题</span><input v-model="memoryForm.title" required maxlength="180"
            /></label>
            <label class="about-admin-form-grid__wide"
              ><span>正文</span
              ><textarea v-model="memoryForm.body" rows="8" required maxlength="200000" />
            </label>
            <label class="home-checkbox about-admin-form-grid__wide"
              ><input v-model="memoryForm.visible" type="checkbox" /><span
                >在公开足迹页面显示</span
              ></label
            >
            <label class="about-admin-form-grid__wide"
              ><span>图片</span
              ><select
                v-model="memoryForm.mediaIds"
                multiple
                size="6"
                aria-label="Footprint memory media"
              >
                <option v-for="item in media" :key="item.id" :value="item.id">
                  {{ item.originalName }}
                </option>
              </select></label
            >
            <div class="about-admin-actions about-admin-form-grid__wide">
              <button class="button" type="submit" :disabled="!!busyKey">
                {{ isNewMemory ? '创建记忆' : '保存记忆' }}
              </button>
              <button
                v-if="!isNewMemory"
                class="admin-danger-button"
                type="button"
                :disabled="!!busyKey"
                @click="deleteMemory"
              >
                删除记忆
              </button>
            </div>
          </form>
        </div>
      </section>
    </template>
  </div>
</template>
