import { computed, toValue, type MaybeRefOrGetter } from 'vue';

import { buildPageSeoMeta, type PageSeoInput } from '~/utils/seo';

export function usePageSeo(input: MaybeRefOrGetter<PageSeoInput>) {
  const route = useRoute();
  const runtimeConfig = useRuntimeConfig();
  const meta = computed(() =>
    buildPageSeoMeta(toValue(input), String(runtimeConfig.public.siteUrl || ''), route.path),
  );

  useSeoMeta({
    title: () => meta.value.title,
    description: () => meta.value.description,
    ogTitle: () => meta.value.ogTitle,
    ogDescription: () => meta.value.ogDescription,
    ogType: () => meta.value.ogType,
    ogUrl: () => meta.value.ogUrl,
    ogImage: () => meta.value.ogImage,
    articlePublishedTime: () => meta.value.articlePublishedTime,
    twitterCard: () => meta.value.twitterCard,
  });

  useHead(() => ({
    link: [{ rel: 'canonical', href: meta.value.canonical }],
  }));
}
