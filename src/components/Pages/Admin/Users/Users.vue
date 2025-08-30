<script setup lang="ts">

import UsersList from "@/components/Pages/Admin/Users/UsersList.vue";
import UsersSearch from "@/components/Pages/Admin/Users/UsersSearch.vue";
</script>

<template>
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-200">Gestion des utilisateurs</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
      <UsersList class="self-start" />
      <UsersSearch class="selt-start" />
    </div>
  </div>

</template>

<style scoped>

</style>