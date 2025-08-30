<script setup lang="ts">
  import SideNav from "./components/SideNav.vue";
  import useAuth from "./useAuth.ts";
  import ToastHost from "@/components/ToastHost.vue";

  const { authenticated } = useAuth()
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-950">
    <SideNav v-if="authenticated" />
    <main :class="authenticated ? 'pl-64' : ''" class="min-h-screen">
      <router-view :key="$route.name + ':' + ($route.params.id ?? '')" />
    </main>
    <ToastHost />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
