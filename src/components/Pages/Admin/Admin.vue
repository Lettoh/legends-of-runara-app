<script setup lang="ts">

import Zones from "@/components/Pages/Admin/Zones/Zones.vue";
import Users from "@/components/Pages/Admin/Users/Users.vue";
import Monsters from "@/components/Pages/Admin/Monsters/Monsters.vue";
import Resources from "@/components/Pages/Admin/Resources/Resources.vue";

import Spells from "@/components/Pages/Admin/Spells/Spells.vue";
</script>


<template>
  <div class="p-6 space-y-8">
    <!-- Section Zones -->
    <Spells />\n    <Zones />

    <!-- Section Utilisateurs -->
    <Users />

    <!-- Section Monstres -->
    <Monsters />

    <!-- Section ressources -->
    <Resources />

    <!-- Section Hôtel des ventes -->
    <div>
      <h2 class="mb-4 text-lg font-semibold text-gray-200">Hôtel des ventes</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>