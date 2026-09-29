<script setup lang="ts">
import type { Map as MapLibreMap } from 'maplibre-gl';

import BlogChrome from '~/components/blog/BlogChrome.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import type {
  FootprintBoundary,
  FootprintBoundaryResponse,
  PublicFootprintCity,
  PublicFootprintCityDetail,
  PublicFootprintCitiesResponse,
} from '~/types/footprint';

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<MapLibreMap | null>(null);
const cities = ref<PublicFootprintCity[]>([]);
const selectedCity = ref<PublicFootprintCityDetail | null>(null);
const isLoading = ref(true);
const isLoadingMemories = ref(false);
const mapError = ref('');
const memoryError = ref('');
const hoveredCityName = ref('');

const visitedCities = computed(() => cities.value.filter((city) => city.visited));
const selectedSlug = computed(() => selectedCity.value?.slug ?? '');

useSeoMeta({
  title: 'Footprint — Blog — Jov3',
  description: '记录我去过的地方。地图只负责展示足迹，点击已经点亮的区域，就能看到留在那里的记忆。',
});

const { data, error } = await useFetch<PublicFootprintCitiesResponse>(
  '/api/v1/public/footprint/cities',
  { key: 'public-footprint-cities' },
);

if (data.value?.data) cities.value = data.value.data;
if (error.value) mapError.value = '足迹数据加载失败，请稍后重试。';
isLoading.value = false;

async function selectCity(city: PublicFootprintCity) {
  if (!city.visited) return;
  isLoadingMemories.value = true;
  memoryError.value = '';
  try {
    const result = await $fetch<{ data: PublicFootprintCityDetail }>(
      `/api/v1/public/footprint/cities/${city.slug}`,
    );
    selectedCity.value = result.data;
  } catch {
    memoryError.value = '这座城市的记忆暂时无法加载，请稍后重试。';
  } finally {
    isLoadingMemories.value = false;
  }
}

function formatMemoryDate(value: string | null) {
  if (!value) return 'A memory without a date';
  return value.replaceAll('-', '.');
}

async function loadMap() {
  if (!mapContainer.value) return;
  try {
    const { Map } = await import('maplibre-gl');
    const instance = new Map({
      container: mapContainer.value,
      attributionControl: false,
      center: [115, 32],
      zoom: 2.4,
      minZoom: 1.5,
      maxZoom: 8,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'footprint-background',
            type: 'background',
            paint: { 'background-color': '#eef1ed' },
          },
        ],
      },
    });
    map.value = instance;
    instance.on('click', 'footprint-boundaries-fill', (event) => {
      const feature = event.features?.[0];
      const slug = feature?.properties?.slug;
      const city = cities.value.find((item) => item.slug === slug);
      if (city) void selectCity(city);
    });
    instance.on('mouseenter', 'footprint-boundaries-fill', (event) => {
      const feature = event.features?.[0];
      const city = cities.value.find((item) => item.slug === feature?.properties?.slug);
      hoveredCityName.value = city?.cityName ?? '';
      instance.getCanvas().style.cursor = 'pointer';
    });
    instance.on('mouseleave', 'footprint-boundaries-fill', () => {
      hoveredCityName.value = '';
      instance.getCanvas().style.cursor = '';
    });
    instance.once('load', () => {
      void loadBoundaries(instance).catch(() => {
        mapError.value = '地图初始化失败，请刷新重试。';
      });
    });
  } catch {
    mapError.value = '地图初始化失败，请刷新重试。';
  }
}

async function loadBoundaries(instance: MapLibreMap) {
  const features: FootprintBoundary['features'] = [];
  for (const city of cities.value) {
    try {
      const result = await $fetch<FootprintBoundaryResponse>(city.boundaryUrl);
      features.push(
        ...result.data.features.map((feature) => ({
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            slug: city.slug,
            visited: city.visited,
          },
        })),
      );
    } catch {
      mapError.value = '地图边界加载失败，请检查网络连接或稍后重试。';
    }
  }

  if (!features.length) return;
  const data: FootprintBoundary = { type: 'FeatureCollection', features };
  instance.addSource('footprint-boundaries', {
    type: 'geojson',
    data: data as never,
  });
  instance.addLayer({
    id: 'footprint-boundaries-fill',
    type: 'fill',
    source: 'footprint-boundaries',
    paint: {
      'fill-color': ['case', ['boolean', ['get', 'visited'], false], '#9da99a', '#dfe5de'],
      'fill-opacity': 0.72,
      'fill-outline-color': '#697966',
    },
  });
  instance.addLayer({
    id: 'footprint-boundaries-line',
    type: 'line',
    source: 'footprint-boundaries',
    paint: { 'line-color': '#61725f', 'line-width': 1.2, 'line-opacity': 0.72 },
  });
}

onMounted(() => void loadMap());
onBeforeUnmount(() => {
  map.value?.remove();
  map.value = null;
});
</script>

<template>
  <BlogChrome>
    <template #hero>
      <StandardHero
        eyebrow="Places & memories"
        title="Footprint"
        description="记录我去过的地方。地图只负责展示足迹，点击已经点亮的区域，就能看到留在那里的记忆。"
      />
    </template>

    <section class="footprint-map-card" aria-labelledby="footprint-map-title">
      <header class="footprint-section-heading">
        <div>
          <p class="eyebrow">A quiet atlas</p>
          <h2 id="footprint-map-title">记忆地图</h2>
        </div>
        <span>点击已访问区域查看足迹</span>
      </header>

      <div class="footprint-map-wrap">
        <div ref="mapContainer" class="footprint-map" aria-label="已访问城市地图" />
        <p v-if="hoveredCityName" class="footprint-map-hover" role="status">
          {{ hoveredCityName }}
        </p>
        <p v-if="isLoading" class="footprint-map-state" role="status">正在整理地图……</p>
        <p v-else-if="mapError" class="footprint-map-state footprint-map-state--error" role="alert">
          {{ mapError }}
        </p>
      </div>

      <nav v-if="visitedCities.length" class="footprint-city-index" aria-label="已访问城市">
        <button
          v-for="city in visitedCities"
          :key="city.id"
          type="button"
          :class="{ active: selectedSlug === city.slug }"
          :aria-pressed="selectedSlug === city.slug"
          @click="selectCity(city)"
        >
          <span>{{ city.cityName }}</span>
          <small>{{ city.memoryCount }} memories</small>
        </button>
      </nav>
    </section>

    <section v-if="selectedCity" class="footprint-memories" aria-labelledby="memories-title">
      <header class="footprint-section-heading footprint-section-heading--memories">
        <div>
          <p class="eyebrow">{{ selectedCity.countryName }} · {{ selectedCity.cityName }}</p>
          <h2 id="memories-title">留在这里的记忆</h2>
        </div>
        <span>{{ selectedCity.memories.length }} memories</span>
      </header>
      <p v-if="isLoadingMemories" class="footprint-inline-state" role="status">正在打开记忆……</p>
      <p
        v-else-if="memoryError"
        class="footprint-inline-state footprint-inline-state--error"
        role="alert"
      >
        {{ memoryError }}
      </p>
      <div v-else class="footprint-memory-grid">
        <article
          v-for="(memory, index) in selectedCity.memories"
          :key="memory.id"
          class="footprint-memory-card"
        >
          <div class="footprint-memory-card__meta">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <time>{{ formatMemoryDate(memory.occurredOn) }}</time>
          </div>
          <div v-if="memory.media.length" class="footprint-memory-card__media">
            <img
              v-for="media in memory.media"
              :key="media.id"
              :src="media.publicUrl"
              :alt="media.altText || memory.title"
              loading="lazy"
            />
          </div>
          <h3>{{ memory.title }}</h3>
          <p>{{ memory.body }}</p>
        </article>
      </div>
    </section>
  </BlogChrome>
</template>
