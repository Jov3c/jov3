<script setup lang="ts">
const entryPoints = [
  { title: 'Projects', to: '/projects', description: '正在做和已经完成的产品、工具与实验。' },
  { title: 'Blog', to: '/blog', description: 'AI、产品与开发相关的长内容。' },
  { title: 'Notes', to: '/blog/archive', description: '持续更新的学习笔记和技术知识。' },
  { title: 'About', to: '/about/timeline', description: '关于我、经历，以及我正在关注的事情。' },
];

useSeoMeta({
  title: 'Jov3 — Product · AI · Developer',
  description: 'Building products, tools and ideas on the internet.',
});
</script>

<template>
  <div class="home-page page-container">
    <section class="home-card" aria-label="Jov3 personal homepage">
      <header class="home-card__top">
        <span class="home-card__brand"><i /> JOV3</span>
        <span class="build-status"><i /> currently building</span>
      </header>

      <div class="home-card__body">
        <div class="avatar" aria-label="Jov3 avatar placeholder">J3</div>
        <h1>Jov3</h1>
        <p class="home-role">Product · AI · Developer</p>
        <p class="home-intro">
          Building products, tools and ideas on the internet.<br />
          一个关于项目、技术、学习与创造的个人入口。
        </p>

        <nav class="entry-grid" aria-label="站点入口">
          <NuxtLink v-for="item in entryPoints" :key="item.title" :to="item.to" class="entry-card">
            <span class="entry-card__title">{{ item.title }} <b aria-hidden="true">↗</b></span>
            <span>{{ item.description }}</span>
          </NuxtLink>
        </nav>

        <div class="home-socials" aria-label="外部链接">
          <a href="https://github.com/Jov3c" target="_blank" rel="noreferrer">GitHub</a>
          <a href="mailto:hello@jov3.cloud">Email</a>
          <span title="RSS 将在后续阶段开放">RSS · soon</span>
        </div>
      </div>

      <footer class="home-card__footer">
        <span>© {{ new Date().getFullYear() }} Jov3. Built with curiosity.</span>
        <span>System theme</span>
      </footer>
    </section>
  </div>
</template>
