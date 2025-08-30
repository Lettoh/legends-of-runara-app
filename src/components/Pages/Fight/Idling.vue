<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import axios from 'axios'
import { Loader2, CircleStop, Coins, Star, Clock4 } from 'lucide-vue-next'
import useIdleRun from '@/useIdleRun'
import RecapModal from "@/components/Pages/Fight/RecapModal.vue";

type LootRow = { resource_id:number; name:string; icon_url?:string|null; qty:number }
type EncRow  = { monster_id:number; name:string; image_url?:string|null; count:number }
type Run = {
  id:number; zone_id:number; status:'running'|'finished'|'claimed'|'canceled';
  start_at:string; duration_sec:number; end_at?:string|null;
  encounters_total:number; encounters_done:number; interval_sec:number;
  gold_earned:number; xp_earned:number;
  zone?: { id:number; name:string; image_url?:string|null; min_level:number; max_level:number }
  loot?: LootRow[];
  encounters?: EncRow[];
}

const route = useRoute()
const router = useRouter()
const zoneId = computed(() => Number(route.params.zoneId ?? route.params.id))
const runId  = ref<number | null>(null)

const loading = ref(true)
const error   = ref<string | null>(null)

const run    = ref<Run | null>(null)
const loot   = ref<LootRow[]>([])
const enc    = ref<EncRow[]>([])

const { activeRun, getActiveRun, stopRun, claimRun, clearPendingRecap, setPendingRecap } = useIdleRun()

function secBetween(a:number, b:number) { return Math.max(0, Math.round(a - b)) }
function toTs(s:string){ const t = Date.parse(s); return Number.isFinite(t) ? Math.round(t/1000) : 0 }
function fmtHMS(total:number){
  const h = Math.floor(total/3600)
  const m = Math.floor((total%3600)/60)
  const s = total%60
  return h>0 ? `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`
      : `${m}m ${s.toString().padStart(2,'0')}s`
}

const nowTs = ref(Math.floor(Date.now()/1000))
let tickTimer:number|undefined
let pollTimer:number|undefined

const startedTs = computed(() => run.value ? toTs(run.value.start_at) : 0)
const remain    = computed(() => run.value ? secBetween(startedTs.value + run.value.duration_sec, nowTs.value) : 0)
const pct = computed(() => {
  if (!run.value || run.value.encounters_total <= 0) return 0
  return Math.min(100, Math.round(100 * (run.value.encounters_done/run.value.encounters_total)))
})
const nextEncounterIn = computed(() => {
  if (!run.value || run.value.status !== 'running') return 0
  const n = run.value.encounters_done + 1
  const target = startedTs.value + n * run.value.interval_sec
  return secBetween(target, nowTs.value)
})

async function fetchById(id:number){
  const { data } = await axios.get(`/api/idle/runs/${id}`, { headers:{ Accept:'application/json' } })
  const r = (data?.data ?? data?.run ?? data) as Run
  run.value  = r
  loot.value = (r as any).loot ?? loot.value
  enc.value  = (r as any).encounters ?? enc.value
  return r
}

const showRecap = ref(false)

async function bootstrap() {
  loading.value = true; error.value = null
  try {
    const qRun = Number(route.query.run || 0) || null
    if (qRun) {
      runId.value = qRun
      await fetchById(qRun)
    } else {
      const r = await getActiveRun()
      if (r && r.zone_id === zoneId.value) {
        runId.value = r.id
        await fetchById(r.id)
      } else {
        router.replace({ path:`/fight/zone/${zoneId.value}` })
        return
      }
    }

    tickTimer = window.setInterval(() => { nowTs.value = Math.floor(Date.now()/1000) }, 1000)
    pollTimer = window.setInterval(async () => {
      if (!runId.value) return
      await fetchById(runId.value)
      if (run.value && run.value.status !== 'running') {
        clearInterval(pollTimer); pollTimer = undefined
      }
    }, 5000)

    if ((route.query.recap === '1') || (run.value && run.value.status === 'finished')) {
      showRecap.value = true
      if (run.value) {
        setPendingRecap?.({ id: run.value.id, zone_id: run.value.zone_id })
        if (!setPendingRecap) {
          localStorage.setItem('idle:pending_recap', JSON.stringify({ id: run.value.id, zone_id: run.value.zone_id }))
        }
      }
    }
  } catch (e:any) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur'
  } finally {
    loading.value = false
  }
}

onMounted(bootstrap)
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
  if (pollTimer) clearInterval(pollTimer)
})

// Quand la run passe en fini : ouvre + marque pending
watch(() => run.value?.status, (s) => {
  if (s === 'finished' && run.value) {
    showRecap.value = true
    setPendingRecap?.({ id: run.value.id, zone_id: run.value.zone_id })
    if (!setPendingRecap) {
      localStorage.setItem('idle:pending_recap', JSON.stringify({ id: run.value.id, zone_id: run.value.zone_id }))
    }
  }
})

async function onStop() {
  try {
    await stopRun()
    if (runId.value) await fetchById(runId.value)
  } catch {}
}

async function onClaim() {
  try {
    await claimRun(run.value?.id)
    clearPendingRecap?.()
    localStorage.removeItem('idle:pending_recap')
    showRecap.value = false
    router.replace({ path:`/fight/zone/${run.value?.zone_id}` })
  } catch {}
}
</script>

<template>
  <section class="min-h-screen pt-5 pl-5 pr-5">
    <div class="flex items-center gap-3 mb-5">
      <h1 class="text-3xl font-semibold text-gray-100">Exploration</h1>
      <span v-if="run?.status === 'finished'" class="ml-2 text-sm rounded-full px-2 py-0.5 border border-white/20 bg-white/10 text-white/80">
        Terminée
      </span>
    </div>

    <div v-if="loading" class="text-white/70 flex items-center gap-2">
      <Loader2 class="h-4 w-4 animate-spin" /> Chargement…
    </div>
    <div v-else-if="error" class="text-rose-300">{{ error }}</div>

    <template v-else-if="run">
      <!-- Hero zone -->
      <div class="relative overflow-hidden rounded-xl border border-white/10">
        <img :src="run.zone?.image_url" :alt="run.zone?.name" class="w-full max-h-[300px] object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

        <div class="absolute left-4 bottom-4 right-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold text-white drop-shadow">{{ run.zone?.name }}</h2>
            <p class="text-white/80 text-sm">
              {{ run.encounters_done }} / {{ run.encounters_total }} rencontres —
              reste {{ fmtHMS(remain) }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <!-- On NE propose pas "Retour à la zone" tant que le récap est ouvert -->
            <RouterLink
                v-if="run.status !== 'running' && !showRecap"
                class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
                :to="`/fight/zone/${run.zone_id}`"
            >
              Retour à la zone
            </RouterLink>

            <button
                v-else-if="run.status === 'running'"
                class="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-200 hover:bg-rose-500/20"
                @click="onStop"
            >
              <CircleStop class="h-4 w-4" /> Stopper
            </button>
          </div>
        </div>
      </div>

      <!-- progression -->
      <div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div class="flex items-center justify-between text-sm text-white/80 mb-2">
          <span>Rencontres /</span>
          <span class="inline-flex items-center gap-1 text-white/70" v-if="run.status==='running'">
            <Clock4 class="h-4 w-4" />
            Prochaine : {{ fmtHMS(nextEncounterIn) }}
          </span>
        </div>
        <div class="h-2 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full bg-indigo-500/70" :style="{ width: pct + '%' }"></div>
        </div>
      </div>

      <!-- Totaux -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <div class="flex items-center gap-2 text-white/70 text-sm mb-1">
            <Coins class="h-4 w-4" /> Or total
          </div>
          <p class="text-xl text-white font-semibold">{{ run.gold_earned }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <div class="flex items-center gap-2 text-white/70 text-sm mb-1">
            <Star class="h-4 w-4" /> XP total
          </div>
          <p class="text-xl text-white font-semibold">{{ run.xp_earned }}</p>
        </div>
      </div>

      <!-- récap live -->
      <div class="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="text-white font-semibold mb-3">Rencontres</h3>
          <p v-if="!enc.length" class="text-sm text-white/60">Aucune rencontre pour l’instant.</p>
          <ul v-else class="space-y-2">
            <li v-for="r in enc" :key="r.monster_id"
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

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="text-white font-semibold mb-3">Butin</h3>
          <p v-if="!loot.length" class="text-sm text-white/60">Aucun drop pour l’instant.</p>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div v-for="l in loot" :key="l.resource_id" class="relative rounded-lg border border-white/10 bg-white/5 p-2" :title="l.name">
              <div class="flex items-center gap-2">
                <div class="h-8 w-8 rounded border border-white/10 bg-white/10 overflow-hidden shrink-0">
                  <img v-if="l.icon_url" :src="l.icon_url" alt="" class="h-full w-full object-cover" />
                </div>
                <div class="min-w-0">
                  <p class="text-white/90 text-sm truncate">{{ l.name }}</p>
                </div>
              </div>
              <div class="absolute right-1 top-1 text-[11px] px-1.5 py-0.5 rounded-full border border-white/10 bg-neutral-900/80 text-white">
                {{ l.qty }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal récap PERSISTENTE -->
      <RecapModal
          :open="showRecap"
          :run="run"
          :loot="loot"
          :encounters="enc"
          :force-claim="true"
          @claim="onClaim"
      />
    </template>
  </section>
</template>
