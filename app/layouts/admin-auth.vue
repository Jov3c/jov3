<template>
  <div class="admin-auth-layout">
    <NuxtLink class="admin-auth-brand" to="/">JOV3<span>.</span></NuxtLink>
    <slot />
    <p class="admin-auth-caption">仅限授权管理员访问</p>
  </div>
</template>

<style src="~/assets/css/admin.css"></style>
