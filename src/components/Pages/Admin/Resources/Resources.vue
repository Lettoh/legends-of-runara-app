<script setup lang="ts">

import ResourcesListModal from "@/components/Modals/ResourcesListModal.vue";
import ResourcesAddModal from "@/components/Modals/ResourcesAddModal.vue";
</script>

<template>
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-200">Gestion des ressources</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
      <ResourcesListModal />
      <ResourcesAddModal />
    </div>
  </div>

</template>

<style scoped>

</style>