<script setup lang="ts">
import SpellsListModal from '@/components/Modals/SpellsListModal.vue'
import SpellsAddModal from '@/components/Modals/SpellsAddModal.vue'
</script>
<template>
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-200">Gestion des sorts</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
      <SpellsListModal />
      <SpellsAddModal />
    </div>
  </div>
</template>
