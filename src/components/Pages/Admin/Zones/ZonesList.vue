<script setup lang="ts">
import { ref } from 'vue'
import ZoneListModal from "@/components/Modals/ZoneListModal.vue";
import ZoneEditModal from "@/components/Modals/ZoneEditModal.vue";
import {Eye} from "lucide-vue-next";

const listOpen = ref(false)
const editOpen = ref(false)
const selected = ref<any>(null)
const listRef   = ref<InstanceType<typeof ZoneListModal> | null>(null)

function onEdit(zone:any){
  selected.value = zone
  editOpen.value = true
}

function onUpdated(updated:any) {
  if (selected.value) Object.assign(selected.value, updated)
  listRef.value?.applyPatch?.(updated)
}
</script>

<template>
  <button
      type="button"
      @click="listOpen"
      class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-left
           hover:bg-white/10 transition"
  >
    <div class="flex items-center gap-3">
      <Eye class="h-5 w-5 text-indigo-400" />
      <div>
        <p class="font-medium text-white">Liste des Zones</p>
        <p class="text-xs text-white/60">Voir la liste des zones</p>
      </div>
    </div>
  </button>

  <ZoneListModal v-model:open="listOpen" @edit="onEdit" />
  <ZoneEditModal v-model:open="editOpen" :zone="selected" @updated="onUpdated" />
</template>

<style scoped>

</style>