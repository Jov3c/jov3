<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import PageHeading from '~/components/ui/PageHeading.vue';
import { footprintPlaces } from '~/data/content';

const selectedId = ref(footprintPlaces[0]!.id);
const selectedPlace = computed(
  () => footprintPlaces.find((place) => place.id === selectedId.value) ?? footprintPlaces[0]!,
);
const countries = [...new Set(footprintPlaces.map((place) => place.country))];

function selectCountry(country: string) {
  const firstPlace = footprintPlaces.find((place) => place.country === country);
  if (firstPlace) selectedId.value = firstPlace.id;
}

function selectPlace(id: string) {
  selectedId.value = id;
}

useSeoMeta({
  title: 'Footprint — Blog — Jov3',
  description: '去过的地方、留下的记忆，以及想去的坐标。',
});
</script>

<template>
  <BlogChrome>
    <PageHeading
      eyebrow="Footprint / 07 places"
      title="Places I remember."
      description="去过的地方、留下的记忆，以及先放在地图上的期待。"
    />

    <div class="country-filters" aria-label="按国家查看足迹">
      <button
        v-for="country in countries"
        :key="country"
        type="button"
        :class="{ active: selectedPlace.country === country }"
        @click="selectCountry(country)"
      >
        {{ country }}
      </button>
    </div>

    <div class="footprint-explorer">
      <div class="memory-map" aria-label="足迹示意地图">
        <div class="map-land map-land--america" />
        <div class="map-land map-land--europe" />
        <div class="map-land map-land--asia" />
        <div class="map-land map-land--africa" />
        <div class="map-land map-land--oceania" />
        <span class="map-line map-line--one" />
        <span class="map-line map-line--two" />
        <button
          v-for="place in footprintPlaces"
          :key="place.id"
          class="map-marker"
          :class="{ active: place.id === selectedId }"
          :style="{ left: `${place.coordinates[0]}%`, top: `${place.coordinates[1]}%` }"
          type="button"
          :aria-label="`查看${place.city}足迹`"
          :aria-pressed="place.id === selectedId"
          @click.stop="selectPlace(place.id)"
        >
          <i /><span>{{ place.city }}</span>
        </button>
      </div>

      <article class="memory-card" aria-live="polite">
        <div class="memory-card__index">
          {{ String(footprintPlaces.indexOf(selectedPlace) + 1).padStart(2, '0') }} /
          {{ String(footprintPlaces.length).padStart(2, '0') }}
        </div>
        <p class="eyebrow">{{ selectedPlace.country }} · {{ selectedPlace.city }}</p>
        <h2>{{ selectedPlace.title }}</h2>
        <p>{{ selectedPlace.memory }}</p>
        <time>{{ selectedPlace.date }}</time>
      </article>
    </div>

    <p class="map-disclaimer">
      这是一张用于浏览个人记忆的示意地图；真实地理底图与数据接口将在后续地图阶段接入。
    </p>
  </BlogChrome>
</template>
