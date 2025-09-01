<!-- src/components/Idle/RecapModal.vue -->
<script setup lang="ts">
import { X, Coins, Star, Clock4, Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import RecapLootList from "@/components/Pages/Fight/RecapLootList.vue";

type LootRow = { resource_id:number; name:string; icon_url?:string|null; qty:number }
type EncRow  = { monster_id:number; name:string; image_url?:string|null; count:number }
type Zone    = { id:number; name:string; image_url?:string|null }

const props = defineProps<{
  open: boolean
  run: {
    id:number
    zone?: Zone | null
    gold_earned:number
    xp_earned:number
    team_size?: number
    xp_per_member?: number
    encounters_total:number
    /** Optionnels : si dispo on calcule la durée réelle */
    start_at?: string | null
    end_at?: string | null
    duration_sec?: number | null
  } | null
  loot: LootRow[]
  encounters: EncRow[]
}>()

const emit = defineEmits<{
  (e:'close'): void
  (e:'claim'): void
}>()

/** Durée (en secondes) : priorité à run.duration_sec, sinon end_at - start_at */
const durationSec = computed<number>(() => {
  const r = props.run
  if (!r) return 0
  if (typeof r.duration_sec === 'number' && r.duration_sec > 0) {
    return Math.round(r.duration_sec)
  }
  const s = r.start_at ? Date.parse(r.start_at) : NaN
  const e = r.end_at ? Date.parse(r.end_at) : NaN
  if (Number.isFinite(s) && Number.isFinite(e)) {
    return Math.max(0, Math.round((e - s) / 1000))
  }
  return 0
})

function fmtHMS(total:number){
  const h = Math.floor(total/3600)
  const m = Math.floor((total%3600)/60)
  const s = total%60
  return h>0
      ? `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`
      : `${m}m ${s.toString().padStart(2,'0')}s`
}

/* --- état du bouton "Valider" --- */
const isClaiming = ref(false)
function onClaimClick() {
  if (isClaiming.value) return
  isClaiming.value = true
  emit('claim') // le parent fait l’API puis ferme la modal
}
/* reset quand on ferme / rouvre la modal */
watch(() => props.open, (v) => { if (!v) isClaiming.value = false })
</script>

<template>
  <div
      v-if="open"
      class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
  >
    <div class="w-full max-w-3xl rounded-xl border border-white/10 bg-neutral-900/90 shadow-xl overflow-hidden">
      <!-- header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div class="min-w-0">
          <p class="text-white font-semibold">Expédition terminée</p>
          <p class="text-xs text-white/60 truncate" v-if="run?.zone?.name">Zone : {{ run.zone.name }}</p>
        </div>
      </div>

      <!-- body -->
      <div class="p-4 space-y-4">
        <!-- Totaux (ajout d'une 3e carte : Durée) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Coins class="h-4 w-4" /> Or gagné
            </div>
            <p class="text-xl text-white font-semibold">{{ run?.gold_earned ?? 0 }}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Star class="h-4 w-4" /> XP gagné
            </div>
            <p class="text-xl text-white font-semibold">{{ run?.xp_earned ?? 0 }}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Clock4 class="h-4 w-4" /> Durée
            </div>
            <p class="text-xl text-white font-semibold">{{ fmtHMS(durationSec) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Rencontres -->
          <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 class="text-white font-semibold mb-3">Rencontres ({{ run?.encounters_total ?? 0 }})</h3>
            <p v-if="!encounters.length" class="text-sm text-white/60">Aucune.</p>
            <ul v-else class="space-y-2">
              <li v-for="r in encounters" :key="r.monster_id"
                  class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div class="h-8 w-8 rounded overflow-hidden border border-white/10 bg-white/10 shrink-0">
                  <img v-if="r.image_url" :src="r.image_url" alt="" class="h-full w-full object-cover" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-white truncate">{{ r.name }}</p>
                </div>
                <span class="text-white/80 text-sm">×{{ r.count }}</span>
              </li>
            </ul>
          </div>

          <!-- Butin -->
          <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 class="text-white font-semibold mb-3">Butin</h3>
            <RecapLootList :items="loot" />
          </div>
        </div>
      </div>

      <!-- footer -->
      <div class="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        <button
            class="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isClaiming"
            @click="onClaimClick"
        >
          <Loader2 v-if="isClaiming" class="h-4 w-4 animate-spin" />
          <span>{{ isClaiming ? 'Validation…' : 'Valider les récompenses' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
