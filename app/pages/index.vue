<script setup lang="ts">
import type { PublicHomeResponse } from '~/types/home';

const { data: response, error } = await useFetch<PublicHomeResponse>('/api/v1/public/home', {
  key: 'public-home-meta',
});
if (error.value || !response.value?.data) {
  throw createError({ statusCode: 503, statusMessage: 'Homepage is temporarily unavailable' });
}

const home = response.value.data;

definePageMeta({ layout: false });

usePageSeo(() => ({
  title: `${home.homeProfile.nickname} — ${home.homeProfile.role}`,
  description: home.siteProfile.siteDescription,
}));

function isExternalSocialUrl(url: string) {
  return /^(https?:|mailto:)/i.test(url);
}
</script>

<template>
  <div class="home-prototype">
    <section class="home-prototype__card" aria-label="Jov3 个人主页">
      <div class="home-prototype__grain" />
      <header class="home-prototype__topbar">
        <span class="home-prototype__brand"><i /> JOV3</span>
        <span
          v-if="home.homeProfile.statusVisible && home.homeProfile.statusText"
          class="home-prototype__status"
        >
          <i /> {{ home.homeProfile.statusText }}
        </span>
      </header>

      <main class="home-prototype__body">
        <div
          v-if="home.homeProfile.avatar"
          class="home-prototype__avatar home-prototype__avatar--image"
        >
          <img
            :src="home.homeProfile.avatar.url"
            :alt="home.homeProfile.avatar.altText || home.homeProfile.nickname"
          />
        </div>
        <div
          v-else
          class="home-prototype__avatar"
          :aria-label="`${home.homeProfile.nickname} 头像`"
        >
          J3
        </div>
        <h1>{{ home.homeProfile.nickname }}</h1>
        <p class="home-prototype__role">{{ home.homeProfile.role }}</p>
        <p class="home-prototype__intro">{{ home.homeProfile.intro }}</p>

        <nav class="home-prototype__grid" aria-label="站点入口">
          <template v-for="item in home.entries" :key="item.id">
            <NuxtLink
              v-if="item.targetType === 'INTERNAL'"
              :to="item.url"
              class="home-prototype__entry"
              :target="item.openNewTab ? '_blank' : undefined"
              :rel="item.openNewTab ? 'noreferrer' : undefined"
            >
              <span class="home-prototype__entry-top">
                {{ item.title }}
                <b aria-hidden="true">{{ item.icon || '↗' }}</b>
              </span>
              <span>{{ item.description }}</span>
            </NuxtLink>
            <a
              v-else
              :href="item.url"
              class="home-prototype__entry"
              :target="item.openNewTab ? '_blank' : undefined"
              :rel="item.openNewTab ? 'noreferrer' : undefined"
            >
              <span class="home-prototype__entry-top">
                {{ item.title }}
                <b aria-hidden="true">{{ item.icon || '↗' }}</b>
              </span>
              <span>{{ item.description }}</span>
            </a>
          </template>
        </nav>

        <div class="home-prototype__links" aria-label="外部链接">
          <template v-for="link in home.socialLinks" :key="link.id">
            <a
              v-if="isExternalSocialUrl(link.url)"
              :href="link.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ link.name }}
            </a>
            <NuxtLink v-else :to="link.url">{{ link.name }}</NuxtLink>
          </template>
          <a
            v-if="home.siteProfile.publicContactEmail"
            :href="`mailto:${home.siteProfile.publicContactEmail}`"
            >Email</a
          >
          <NuxtLink to="/rss.xml">RSS</NuxtLink>
        </div>
      </main>

      <footer class="home-prototype__footer">
        <span
          >© {{ new Date().getFullYear() }} {{ home.homeProfile.nickname }}. Built with
          curiosity.</span
        >
        <span><b class="home-prototype__kbd">System</b> theme</span>
      </footer>
    </section>
  </div>
</template>

<style src="~/assets/css/public.css"></style>
