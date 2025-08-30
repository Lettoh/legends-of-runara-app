<script setup lang="ts">

import ZonesAdd from "@/components/Pages/Admin/Zones/ZonesAdd.vue";
import ZonesList from "@/components/Pages/Admin/Zones/ZonesList.vue";
</script>

<template>
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-200">Gestion des zones</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <ZonesList />
      <ZonesAdd />
    </div>
  </div>
</template>

<style scoped>

</style>