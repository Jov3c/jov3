<script setup lang="ts">
interface HomeEntry {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  url: string;
  targetType: 'INTERNAL' | 'EXTERNAL';
  openNewTab: boolean;
}

interface HomeData {
  siteProfile: {
    siteTitle: string;
    siteDescription: string;
    foundedAt: string;
  };
  homeProfile: {
    nickname: string;
    role: string;
    intro: string;
    avatar: { url: string; altText: string | null } | null;
    statusText: string | null;
    statusVisible: boolean;
  };
  entries: HomeEntry[];
  socialLinks: Array<{ id: string; name: string; icon: string | null; url: string }>;
}

const { data: response, error } = await useFetch<{ data: HomeData }>('/api/v1/public/home');
if (error.value || !response.value?.data) {
  throw createError({ statusCode: 503, statusMessage: 'Homepage is temporarily unavailable' });
}

const home = response.value.data;

usePageSeo(() => ({
  title: `${home.homeProfile.nickname} — ${home.homeProfile.role}`,
  description: home.siteProfile.siteDescription,
}));

function isExternalSocialUrl(url: string) {
  return /^(https?:|mailto:)/i.test(url);
}
</script>

<template>
  <div class="home-page page-container">
    <section class="home-card" aria-label="Jov3 personal homepage">
      <header class="home-card__top">
        <span class="home-card__brand"><i /> JOV3</span>
        <span
          v-if="home.homeProfile.statusVisible && home.homeProfile.statusText"
          class="build-status"
        >
          <i /> {{ home.homeProfile.statusText }}
        </span>
      </header>

      <div class="home-card__body">
        <div v-if="home.homeProfile.avatar" class="avatar avatar--image">
          <img
            :src="home.homeProfile.avatar.url"
            :alt="home.homeProfile.avatar.altText || home.homeProfile.nickname"
          />
        </div>
        <div v-else class="avatar" :aria-label="`${home.homeProfile.nickname} avatar placeholder`">
          {{ home.homeProfile.nickname.slice(0, 2).toUpperCase() }}
        </div>
        <h1>{{ home.homeProfile.nickname }}</h1>
        <p class="home-role">{{ home.homeProfile.role }}</p>
        <p class="home-intro">{{ home.homeProfile.intro }}</p>

        <nav class="entry-grid" aria-label="站点入口">
          <template v-for="item in home.entries" :key="item.id">
            <NuxtLink
              v-if="item.targetType === 'INTERNAL'"
              :to="item.url"
              class="entry-card"
              :target="item.openNewTab ? '_blank' : undefined"
              :rel="item.openNewTab ? 'noreferrer' : undefined"
            >
              <span class="entry-card__title"
                >{{ item.title }} <b aria-hidden="true">{{ item.icon || '↗' }}</b></span
              >
              <span>{{ item.description }}</span>
            </NuxtLink>
            <a
              v-else
              :href="item.url"
              class="entry-card"
              :target="item.openNewTab ? '_blank' : undefined"
              :rel="item.openNewTab ? 'noreferrer' : undefined"
            >
              <span class="entry-card__title"
                >{{ item.title }} <b aria-hidden="true">{{ item.icon || '↗' }}</b></span
              >
              <span>{{ item.description }}</span>
            </a>
          </template>
        </nav>

        <div class="home-socials" aria-label="外部链接">
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
        </div>
      </div>

      <footer class="home-card__footer">
        <span
          >© {{ new Date().getFullYear() }} {{ home.homeProfile.nickname }}. Built with
          curiosity.</span
        >
        <span>System theme</span>
      </footer>
    </section>
  </div>
</template>
