<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import Inventory from "@/components/Pages/Team/Inventory.vue";
import SpellsAndStatistics from "@/components/Pages/Team/SpellsAndStatistics.vue";
import EquipmentSlots from '@/components/Pages/Team/EquipmentSlots.vue'
import CharacterPanel from '@/components/Pages/Team/CharacterPanel.vue'
import axios from 'axios'

type Character = {
  id:number
  name:string
  class_name?:string | null
  level:number
  portrait_url?:string | null
  // futur:
  equipment?: Record<string, any>
  spells?: Array<any>
  type_id?: number | null
}

const route = useRoute()
const viewedUserId = computed(() => {
  const n = Number(route.params.id)
  return Number.isFinite(n) && n > 0 ? n : null
})

const characters = ref<Character[]>([])
const i = ref(0)
const current = computed(() => characters.value[i.value] ?? null)

async function loadTeam(userId: number) {
  try {
    const { data } = await axios.get(`/api/team/${userId}`, {
      headers: { Accept: 'application/json' }
    })
    characters.value = (data?.data ?? data ?? []) as Character[]
    i.value = 0
  } catch {
    characters.value = []
  }
}

onMounted(() => {
  if (viewedUserId.value) loadTeam(viewedUserId.value)
})

watch(() => route.params.id, (val) => {
  const uid = Number(val)
  if (Number.isFinite(uid) && uid > 0) loadTeam(uid)
})

function nextChar() {
  if (characters.value.length === 0) return
  i.value = (i.value + 1) % characters.value.length
}
</script>

<template>
  <!-- réserve l’espace à droite pour l’inventaire fixe -->
  <section class="min-h-screen pr-80 pt-6 px-5">
    <!-- infos perso -->
    <div class="mb-4">
      <h1 class="text-3xl font-semibold text-white">Équipe</h1>
      <p class="text-white/60 text-sm">Gère tes personnages, sorts et équipements.</p>
      <button @click="console.log(current)">Trigger</button>
    </div>

    <!-- grille centrale -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Sorts -->
      <SpellsAndStatistics v-if="current" :spells="current?.spells" :stats="current?.stats" />

      <!-- Portrait + infos -->
      <CharacterPanel
          v-if="current"
          :name="current.name"
          :class-name="current.class_name"
          :level="current.level"
          :portrait="current.portrait_url ?? null"
          :type-id="current.type_id ?? null"
      />
      <div v-else class="rounded-xl border border-white/10 bg-white/5 p-4 text-white/60">
        Aucun personnage.
      </div>

      <!-- Équipements -->
      <EquipmentSlots class="mr-5" :equipment="current?.equipment" />
    </div>

    <!-- flèche pour passer au perso suivant -->
    <div class="mt-8 flex justify-center">
      <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5
               px-4 py-2 text-white hover:bg-white/10"
          @click="nextChar"
      >
        Personnage suivant
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </section>

  <!-- INVENTAIRE FIXE À DROITE -->
  <aside class="fixed right-0 top-0 bottom-0 w-80 border-l border-white/10 bg-neutral-900/80 backdrop-blur-sm p-4 overflow-y-auto">
    <h3 class="text-white font-semibold mb-3">Inventaire</h3>
    <!-- seul changement : on passe l'id de l'utilisateur vu -->
    <Inventory :user-id="viewedUserId ?? undefined" />
  </aside>
</template>
