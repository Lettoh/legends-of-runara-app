<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Play, Square, Timer, Coins, Sparkles, Skull } from 'lucide-vue-next'
import useIdleRun from "@/useIdleRun.ts";
import axios from 'axios'

const props = defineProps<{ zoneId: number }>()

// cap durée (non premium = 120)
const isPremium = ref(false)
const maxMinutes = computed(() => (isPremium.value ? 240 : 120))

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/user', { headers:{Accept:'application/json'} })
    isPremium.value = !!data?.is_premium
  } catch {}
})

const minutes = ref(30)
function clamp() {
  if (minutes.value < 0) minutes.value = 0
  if (minutes.value > maxMinutes.value) minutes.value = maxMinutes.value
}

const svc = useIdleRun(props.zoneId)

function fmtTime(s:number) {
  const m = Math.floor(s/60), ss = s%60
  return `${m}m ${ss.toString().padStart(2,'0')}s`
}
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
    <!-- run actif -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Exploration en cours</h3>
        <button
            class="inline-flex items-center gap-2 rounded-lg bg-rose-500/90 hover:bg-rose-500 px-3 py-2"
            :disabled="svc.loading"
            @click="svc.stop"
        >
          <Square class="h-4 w-4" /> Stopper
        </button>
      </div>

      <!-- barre progression -->
      <div>
        <div class="flex items-center justify-between text-sm text-white/70 mb-1">
          <span>Rencontres {{ svc.run.encounters_done }} / {{ svc.run.encounters_total }}</span>
          <span><Timer class="inline h-4 w-4 -mt-1" /> Prochaine : {{ fmtTime(svc.nextEncounterSec) }}</span>
        </div>
        <div class="h-2 w-full rounded bg-white/10 overflow-hidden">
          <div class="h-full bg-indigo-500 transition-all" :style="{ width: svc.progress + '%' }"></div>
        </div>
        <div class="mt-1 text-xs text-white/60">
          Reste ~ {{ fmtTime(svc.remainingSec) }} — intervalle {{ svc.run.interval_sec }}s
        </div>
      </div>

      <!-- résumé -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-lg border border-white/10 bg-white/5 p-3">
          <div class="text-xs text-white/60">Or total</div>
          <div class="mt-1 flex items-center gap-2">
            <Coins class="h-4 w-4 text-amber-400" />
            <span class="font-medium">{{ svc.run.gold_earned }}</span>
          </div>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/5 p-3">
          <div class="text-xs text-white/60">XP total</div>
          <div class="mt-1 flex items-center gap-2">
            <Sparkles class="h-4 w-4 text-cyan-300" />
            <span class="font-medium">{{ svc.run.xp_earned }}</span>
          </div>
        </div>
      </div>

      <!-- compteurs monstres -->
      <section>
        <h4 class="text-sm text-white/70 mb-2">Rencontres</h4>
        <div v-if="svc.monsters.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <div v-for="m in svc.monsters" :key="m.id"
               class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <img v-if="m.image_url" :src="m.image_url" :alt="m.name" class="h-6 w-6 rounded object-cover" />
            <div v-else class="h-6 w-6 rounded bg-white/10 flex items-center justify-center">
              <Skull class="h-4 w-4 text-white/60" />
            </div>
            <span class="truncate">{{ m.name }}</span>
            <span class="ml-auto text-xs rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{{ m.count }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-white/60">Aucune rencontre pour l’instant.</p>
      </section>

      <!-- butin -->
      <section>
        <h4 class="text-sm text-white/70 mb-2">Butin</h4>
        <div v-if="svc.loot.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <div v-for="r in svc.loot" :key="r.id"
               class="relative rounded-lg border border-white/10 bg-white/5 p-2 flex items-center gap-2">
            <img v-if="r.icon_url" :src="r.icon_url" :alt="r.name" class="h-6 w-6 object-contain rounded" />
            <div v-else class="h-6 w-6 rounded bg-white/10" />
            <span class="truncate">{{ r.name }}</span>
            <span class="ml-auto text-xs rounded-full border border-white/10 bg-neutral-900/70 px-2 py-0.5">{{ r.qty }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-white/60">Aucun drop pour l’instant.</p>
      </section>

      <p v-if="svc.error" class="text-rose-300 text-sm">{{ svc.error }}</p>
    </div>
  </div>
</template>
