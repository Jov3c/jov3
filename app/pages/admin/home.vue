<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface SiteProfile {
  id: string;
  siteTitle: string;
  siteDescription: string;
  foundedAt: string;
  publicContactEmail: string | null;
}
interface HomeProfile {
  id: string;
  nickname: string;
  role: string;
  intro: string;
  avatarMediaId: string | null;
  statusText: string | null;
  statusVisible: boolean;
}
interface HomeEntry {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  url: string;
  targetType: 'INTERNAL' | 'EXTERNAL';
  openNewTab: boolean;
  sortOrder: number;
  visible: boolean;
}
interface SocialLink {
  id: string;
  name: string;
  icon: string | null;
  url: string;
  sortOrder: number;
  visible: boolean;
}
interface MediaItem {
  id: string;
  originalName: string;
}

const site = reactive<SiteProfile>({
  id: '',
  siteTitle: '',
  siteDescription: '',
  foundedAt: '',
  publicContactEmail: '',
});
const identity = reactive<HomeProfile>({
  id: '',
  nickname: '',
  role: '',
  intro: '',
  avatarMediaId: null,
  statusText: '',
  statusVisible: true,
});
const entries = ref<HomeEntry[]>([]);
const socialLinks = ref<SocialLink[]>([]);
const mediaItems = ref<MediaItem[]>([]);
const newEntry = reactive({
  title: '',
  description: '',
  icon: '↗',
  url: '/',
  targetType: 'INTERNAL' as 'INTERNAL' | 'EXTERNAL',
  openNewTab: false,
  sortOrder: 50,
  visible: true,
});
const newSocial = reactive({ name: '', icon: '', url: 'https://', sortOrder: 30, visible: true });
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');

useSeoMeta({ title: 'Homepage — Jov3 Admin', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  try {
    const [siteResult, identityResult, entriesResult, socialsResult, mediaResult] =
      await Promise.all([
        $fetch<{ data: SiteProfile }>('/api/v1/admin/site-profile'),
        $fetch<{ data: HomeProfile }>('/api/v1/admin/home-profile'),
        $fetch<{ data: HomeEntry[] }>('/api/v1/admin/home-entries'),
        $fetch<{ data: SocialLink[] }>('/api/v1/admin/social-links'),
        $fetch<{ data: MediaItem[] }>('/api/v1/admin/media', { query: { page: 1, pageSize: 100 } }),
      ]);
    Object.assign(site, siteResult.data);
    Object.assign(identity, identityResult.data);
    entries.value = entriesResult.data;
    socialLinks.value = socialsResult.data;
    mediaItems.value = mediaResult.data;
  } catch {
    errorMessage.value = '首页配置加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

async function saveSite() {
  await runAction('site', async () => {
    await $fetch('/api/v1/admin/site-profile', {
      method: 'PATCH',
      body: {
        siteTitle: site.siteTitle,
        siteDescription: site.siteDescription,
        foundedAt: site.foundedAt,
        publicContactEmail: site.publicContactEmail || null,
      },
    });
    notice.value = '站点信息已保存。';
  });
}

async function saveIdentity() {
  await runAction('identity', async () => {
    await $fetch('/api/v1/admin/home-profile', {
      method: 'PATCH',
      body: {
        nickname: identity.nickname,
        role: identity.role,
        intro: identity.intro,
        avatarMediaId: identity.avatarMediaId || null,
        statusText: identity.statusText || null,
        statusVisible: identity.statusVisible,
      },
    });
    notice.value = '首页 Identity 已保存。';
  });
}

async function addEntry() {
  await runAction('new-entry', async () => {
    const result = await $fetch<{ data: HomeEntry }>('/api/v1/admin/home-entries', {
      method: 'POST',
      body: { ...newEntry },
    });
    entries.value = [...entries.value, result.data].sort(compareBySort);
    Object.assign(newEntry, {
      title: '',
      description: '',
      icon: '↗',
      url: '/',
      targetType: 'INTERNAL',
      openNewTab: false,
      sortOrder: (entries.value.length + 1) * 10,
      visible: true,
    });
    notice.value = '首页入口已新增。';
  });
}

async function saveEntry(entry: HomeEntry) {
  await runAction('entry-' + entry.id, async () => {
    await $fetch(entryEndpoint(entry.id), {
      method: 'PATCH',
      body: {
        title: entry.title,
        description: entry.description,
        icon: entry.icon || null,
        url: entry.url,
        targetType: entry.targetType,
        openNewTab: entry.openNewTab,
        sortOrder: entry.sortOrder,
        visible: entry.visible,
      },
    });
    notice.value = '入口「' + entry.title + '」已保存。';
  });
}

async function moveEntry(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= entries.value.length) return;
  const reordered = [...entries.value];
  [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
  await runAction('entry-order', async () => {
    await Promise.all(
      reordered.map((entry, position) =>
        $fetch(entryEndpoint(entry.id), {
          method: 'PATCH',
          body: { sortOrder: (position + 1) * 10 },
        }),
      ),
    );
    entries.value = reordered.map((entry, position) => ({
      ...entry,
      sortOrder: (position + 1) * 10,
    }));
    notice.value = '首页入口顺序已更新。';
  });
}

async function deleteEntry(entry: HomeEntry) {
  if (!window.confirm('确定删除「' + entry.title + '」吗？')) return;
  await runAction('delete-entry-' + entry.id, async () => {
    await $fetch(entryEndpoint(entry.id), { method: 'DELETE' });
    entries.value = entries.value.filter((item) => item.id !== entry.id);
    notice.value = '首页入口已删除。';
  });
}

async function addSocialLink() {
  await runAction('new-social', async () => {
    const result = await $fetch<{ data: SocialLink }>('/api/v1/admin/social-links', {
      method: 'POST',
      body: { ...newSocial, icon: newSocial.icon || null },
    });
    socialLinks.value = [...socialLinks.value, result.data].sort(compareBySort);
    Object.assign(newSocial, {
      name: '',
      icon: '',
      url: 'https://',
      sortOrder: (socialLinks.value.length + 1) * 10,
      visible: true,
    });
    notice.value = 'Social Link 已新增。';
  });
}

async function saveSocialLink(link: SocialLink) {
  await runAction('social-' + link.id, async () => {
    await $fetch(socialEndpoint(link.id), {
      method: 'PATCH',
      body: {
        name: link.name,
        icon: link.icon || null,
        url: link.url,
        sortOrder: link.sortOrder,
        visible: link.visible,
      },
    });
    notice.value = '链接「' + link.name + '」已保存。';
  });
}

async function moveSocial(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= socialLinks.value.length) return;
  const reordered = [...socialLinks.value];
  [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
  await runAction('social-order', async () => {
    await Promise.all(
      reordered.map((link, position) =>
        $fetch(socialEndpoint(link.id), {
          method: 'PATCH',
          body: { sortOrder: (position + 1) * 10 },
        }),
      ),
    );
    socialLinks.value = reordered.map((link, position) => ({
      ...link,
      sortOrder: (position + 1) * 10,
    }));
    notice.value = 'Social Links 顺序已更新。';
  });
}

async function deleteSocialLink(link: SocialLink) {
  if (!window.confirm('确定删除「' + link.name + '」吗？')) return;
  await runAction('delete-social-' + link.id, async () => {
    await $fetch(socialEndpoint(link.id), { method: 'DELETE' });
    socialLinks.value = socialLinks.value.filter((item) => item.id !== link.id);
    notice.value = 'Social Link 已删除。';
  });
}

async function runAction(key: string, action: () => Promise<void>) {
  busyKey.value = key;
  errorMessage.value = '';
  try {
    await action();
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '保存失败，请检查字段后重试。';
  } finally {
    busyKey.value = '';
  }
}

function entryEndpoint(id: string) {
  return '/api/v1/admin/home-entries/' + id;
}
function socialEndpoint(id: string) {
  return '/api/v1/admin/social-links/' + id;
}
function compareBySort(left: { sortOrder: number }, right: { sortOrder: number }) {
  return left.sortOrder - right.sortOrder;
}

onMounted(load);
</script>

<template>
  <div class="home-admin">
    <header class="admin-page-heading">
      <div>
        <p>Profile / Homepage</p>
        <h1>Homepage</h1>
      </div>
      <span>Content is configurable · design stays fixed</span>
    </header>

    <p v-if="isLoading" class="media-empty">Loading homepage configuration…</p>
    <template v-else>
      <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">Site profile</p>
            <h2>What the site says about itself.</h2>
          </div>
          <span>SEO and public contact basics</span>
        </div>
        <form class="home-form-grid" @submit.prevent="saveSite">
          <label
            ><span>Site title</span><input v-model="site.siteTitle" maxlength="120" required
          /></label>
          <label
            ><span>Founded at</span><input v-model="site.foundedAt" type="date" required
          /></label>
          <label class="home-form-grid__wide"
            ><span>Site description</span
            ><textarea v-model="site.siteDescription" rows="2" maxlength="300" required />
          </label>
          <label
            ><span>Public contact email</span
            ><input v-model="site.publicContactEmail" type="email" placeholder="hello@example.com"
          /></label>
          <button class="button" type="submit" :disabled="busyKey === 'site'">
            Save site profile
          </button>
        </form>
      </section>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">Identity</p>
            <h2>The first impression.</h2>
          </div>
          <span>Avatar uses a Media Library asset</span>
        </div>
        <form class="home-form-grid" @submit.prevent="saveIdentity">
          <label
            ><span>Nickname</span><input v-model="identity.nickname" maxlength="80" required
          /></label>
          <label
            ><span>Role / headline</span><input v-model="identity.role" maxlength="160" required
          /></label>
          <label class="home-form-grid__wide"
            ><span>Intro</span
            ><textarea v-model="identity.intro" rows="4" maxlength="2000" required />
          </label>
          <label
            ><span>Avatar</span
            ><select v-model="identity.avatarMediaId">
              <option :value="null">No avatar / initials</option>
              <option v-for="media in mediaItems" :key="media.id" :value="media.id">
                {{ media.originalName }}
              </option>
            </select></label
          >
          <label
            ><span>Status text</span
            ><input v-model="identity.statusText" maxlength="120" placeholder="currently building"
          /></label>
          <label class="home-checkbox"
            ><input v-model="identity.statusVisible" type="checkbox" /><span
              >Show status on the public homepage</span
            ></label
          >
          <button class="button" type="submit" :disabled="busyKey === 'identity'">
            Save identity
          </button>
        </form>
      </section>

      <section class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">Entry cards</p>
            <h2>Make the homepage point somewhere useful.</h2>
          </div>
          <span
            >{{ entries.filter((entry) => entry.visible).length }} visible · maximum 8 public</span
          >
        </div>
        <div class="home-entry-list">
          <article v-for="(entry, index) in entries" :key="entry.id" class="home-entry-editor">
            <div class="home-entry-editor__order">
              <button
                type="button"
                :disabled="index === 0 || busyKey === 'entry-order'"
                @click="moveEntry(index, -1)"
              >
                ↑</button
              ><span>{{ String(index + 1).padStart(2, '0') }}</span
              ><button
                type="button"
                :disabled="index === entries.length - 1 || busyKey === 'entry-order'"
                @click="moveEntry(index, 1)"
              >
                ↓
              </button>
            </div>
            <div class="home-entry-editor__fields">
              <label><span>Title</span><input v-model="entry.title" maxlength="80" /></label>
              <label
                ><span>Description</span><input v-model="entry.description" maxlength="180"
              /></label>
              <label><span>Icon</span><input v-model="entry.icon" maxlength="80" /></label>
              <label><span>URL</span><input v-model="entry.url" maxlength="500" /></label>
              <label
                ><span>Type</span
                ><select v-model="entry.targetType">
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                </select></label
              >
              <label
                ><span>Sort</span><input v-model.number="entry.sortOrder" type="number" min="0"
              /></label>
              <label class="home-checkbox"
                ><input v-model="entry.visible" type="checkbox" /><span>Visible</span></label
              >
              <label class="home-checkbox"
                ><input v-model="entry.openNewTab" type="checkbox" /><span
                  >Open new tab</span
                ></label
              >
            </div>
            <div class="home-entry-editor__actions">
              <button
                class="admin-secondary-button"
                type="button"
                :disabled="busyKey === 'entry-' + entry.id"
                @click="saveEntry(entry)"
              >
                Save</button
              ><button class="admin-danger-button" type="button" @click="deleteEntry(entry)">
                Delete
              </button>
            </div>
          </article>
        </div>
        <form class="home-new-entry" @submit.prevent="addEntry">
          <strong>Add entry</strong>
          <div class="home-entry-editor__fields">
            <label
              ><span>Title</span><input v-model="newEntry.title" maxlength="80" required /></label
            ><label
              ><span>Description</span
              ><input v-model="newEntry.description" maxlength="180" required /></label
            ><label><span>Icon</span><input v-model="newEntry.icon" maxlength="80" /></label
            ><label><span>URL</span><input v-model="newEntry.url" maxlength="500" required /></label
            ><label
              ><span>Type</span
              ><select v-model="newEntry.targetType">
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
              </select></label
            ><label
              ><span>Sort</span><input v-model.number="newEntry.sortOrder" type="number" min="0"
            /></label>
          </div>
          <button class="button" type="submit" :disabled="busyKey === 'new-entry'">
            Add entry
          </button>
        </form>
      </section>

      <section id="social-links" class="home-admin-section">
        <div class="home-admin-section__heading">
          <div>
            <p class="eyebrow">Social links</p>
            <h2>Keep the quiet links current.</h2>
          </div>
          <span>GitHub, Email, RSS, and other destinations</span>
        </div>
        <div class="social-link-list">
          <article v-for="(link, index) in socialLinks" :key="link.id" class="social-link-editor">
            <div class="home-entry-editor__order">
              <button
                type="button"
                :disabled="index === 0 || busyKey === 'social-order'"
                @click="moveSocial(index, -1)"
              >
                ↑</button
              ><span>{{ String(index + 1).padStart(2, '0') }}</span
              ><button
                type="button"
                :disabled="index === socialLinks.length - 1 || busyKey === 'social-order'"
                @click="moveSocial(index, 1)"
              >
                ↓
              </button>
            </div>
            <div class="social-link-editor__fields">
              <label><span>Name</span><input v-model="link.name" maxlength="80" /></label
              ><label><span>Icon</span><input v-model="link.icon" maxlength="80" /></label
              ><label><span>URL</span><input v-model="link.url" maxlength="500" /></label
              ><label
                ><span>Sort</span
                ><input v-model.number="link.sortOrder" type="number" min="0" /></label
              ><label class="home-checkbox"
                ><input v-model="link.visible" type="checkbox" /><span>Visible</span></label
              >
            </div>
            <div class="home-entry-editor__actions">
              <button class="admin-secondary-button" type="button" @click="saveSocialLink(link)">
                Save</button
              ><button class="admin-danger-button" type="button" @click="deleteSocialLink(link)">
                Delete
              </button>
            </div>
          </article>
        </div>
        <form class="home-new-entry" @submit.prevent="addSocialLink">
          <strong>Add social link</strong>
          <div class="social-link-editor__fields">
            <label
              ><span>Name</span><input v-model="newSocial.name" maxlength="80" required /></label
            ><label><span>Icon</span><input v-model="newSocial.icon" maxlength="80" /></label
            ><label
              ><span>URL</span><input v-model="newSocial.url" maxlength="500" required /></label
            ><label
              ><span>Sort</span><input v-model.number="newSocial.sortOrder" type="number" min="0"
            /></label>
          </div>
          <button class="button" type="submit" :disabled="busyKey === 'new-social'">
            Add social link
          </button>
        </form>
      </section>
    </template>
  </div>
</template>
