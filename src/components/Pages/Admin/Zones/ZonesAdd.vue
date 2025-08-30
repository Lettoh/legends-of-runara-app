<script setup lang="ts">

import { ref } from 'vue'
import ZoneCreateModal from "@/components/Modals/ZoneCreateModal.vue";
import {PlusCircle} from "lucide-vue-next";

const createOpen = ref(false)
const zones = ref<any[]>([]) // si tu affiches une liste

function onCreated(zone:any) {
  zones.value.unshift(zone)     // ou rafraîchis ta liste
}
</script>

<template>
  <button
      type="button"
      @click="createOpen = true"
      class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-left
           hover:bg-white/10 transition"
  >
    <div class="flex items-center gap-3">
      <PlusCircle class="h-5 w-5 text-indigo-400" />
      <div>
        <p class="font-medium text-white">Ajouter une Zone</p>
        <p class="text-xs text-white/60">Créer une nouvelle zone</p>
      </div>
    </div>
  </button>

  <ZoneCreateModal v-model:open="createOpen" @created="onCreated" />
</template>

<style scoped>

</style>