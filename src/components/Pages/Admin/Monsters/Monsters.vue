<script setup lang="ts">

import MonstersAddModal from "@/components/Pages/Admin/Monsters/MonstersAddModal.vue";
import MonstersListModal from "@/components/Pages/Admin/Monsters/MonstersListModal.vue";
</script>

<template>
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-200">Monstres</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
      <MonstersListModal />
      <MonstersAddModal />
    </div>
  </div>

</template>

<style scoped>

</style>