<script setup lang="ts">
/* ------------------------------------------------------------
 * Imports
 * ------------------------------------------------------------ */
import { ref, onMounted, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, Swords, Loader2, Skull, X } from 'lucide-vue-next'
import zones from '@/zones'
import useAuth from '@/useAuth'
import useIdleRun from '@/useIdleRun'   // ← composable idle run

/* ------------------------------------------------------------
 * Types (adaptés à ton service zones.ts)
 * ------------------------------------------------------------ */
type Drop = { id:number; name:string; chance:number; icon_url?: string; min_qty:number; max_qty:number; }
type Monster = {
  id:number; name:string; level:number; hp:number; atk:number; def:number
  image_url?: string; spawn_chance:number; drops?: Drop[]
}

/* ------------------------------------------------------------
 * Props & services
 * ------------------------------------------------------------ */
const props = defineProps<{ id: number }>()
const { getZoneById, getZoneMonsters } = zones()
const { user } = useAuth()
const router = useRouter()

/* ---- idle composable ---- */
const { activeRun, getActiveRun, startRun } = useIdleRun()
// attend des signatures du type :
// async function getActiveRun(): Promise<IdleRun | null>
// async function startRun(zoneId:number, durationMin:number): Promise<IdleRun>

/* ------------------------------------------------------------
 * Joueur & zone
 * ------------------------------------------------------------ */
const playerLevel = computed<number | null>(() => user.value?.level ?? null)

const loading = ref(true)
const error   = ref<string | null>(null)
const zone    = ref<any | null>(null)

/** Charge la zone par id. */
async function loadZone(id: number) {
  loading.value = true
  error.value = null
  try {
    zone.value = await getZoneById(id)
  } catch (e: any) {
    error.value = e?.response?.status === 404 ? 'Zone introuvable.' : (e.message ?? 'Erreur de chargement')
  } finally {
    loading.value = false
  }
}

/* ------------------------------------------------------------
 * Monstres de la zone
 * ------------------------------------------------------------ */
const monsters = ref<Monster[]>([])
const mLoading = ref(false)
const mError   = ref<string | null>(null)

/** Charge les monstres de la zone courante (option : filtre par niveau joueur). */
async function loadMonsters() {
  if (!zone.value) return
  mLoading.value = true
  mError.value = null
  try {
    monsters.value = await getZoneMonsters(zone.value.id, playerLevel.value ?? undefined)
  } catch (e:any) {
    mError.value = e?.message ?? 'Erreur de chargement des monstres'
  } finally {
    mLoading.value = false
  }
}

/* ------------------------------------------------------------
 * Popover flottant au survol d'une tuile monstre
 * ------------------------------------------------------------ */
const wrapRef   = ref<HTMLElement | null>(null)
const hoverId   = ref<number | null>(null)
const pos       = ref({ left: 0, top: 0 })
const hovered   = computed(() => monsters.value.find(m => m.id === hoverId.value) ?? null)

const POPOVER_W = 350
const GAP       = 12
const HIDE_DELAY = 80
let hideTimer: number | null = null

const hoverDrops = computed(() =>
    (hovered.value?.drops ?? []).slice().sort((a, b) => {
      const ac = a.chance <= 1 ? a.chance * 100 : a.chance
      const bc = b.chance <= 1 ? b.chance * 100 : b.chance
      return bc - ac
    })
)

function qtyLabel(d: Drop) {
  return d.min_qty === d.max_qty ? `×${d.min_qty}` : `×${d.min_qty}–${d.max_qty}`
}

function showPopover(ev: MouseEvent, monsterId: number) {
  const tile = ev.currentTarget as HTMLElement
  const wrap = wrapRef.value
  if (!tile || !wrap) return
  const wr = wrap.getBoundingClientRect()
  const tr = tile.getBoundingClientRect()
  const centerX = tr.left - wr.left + tr.width / 2
  let left = centerX - POPOVER_W / 2
  left = Math.max(8, Math.min(left, wr.width - POPOVER_W - 8))
  const top = tr.top - wr.top - GAP
  pos.value = { left, top }
  hoverId.value = monsterId
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}
function scheduleHide() { hideTimer = window.setTimeout(() => { hoverId.value = null }, HIDE_DELAY) }
function cancelHide()   { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null } }
function hideNow()      { hoverId.value = null; if (hideTimer) { clearTimeout(hideTimer); hideTimer = null } }

/* ------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------ */
function fmtPct(x: number | string | null | undefined) {
  const n = Number(x)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(n < 10 ? 1 : 0)}%`
}
function pctLabel(x: unknown) {
  if (typeof x !== 'number' || Number.isNaN(x)) return null
  const v = x <= 1 ? x * 100 : x
  return `${v.toFixed(v < 10 ? 1 : 0)}%`
}

/** Droits d'accès basiques : niveau joueur ≥ min de la zone (ou inconnu => autorisé). */
const canFight = computed(() => {
  if (!zone.value) return false
  if (playerLevel.value == null) return true
  return playerLevel.value >= zone.value.min_level
})

/* ------------------------------------------------------------
 * Démarrage IDLE via composable
 * ------------------------------------------------------------ */
const startOpen  = ref(false)
const minutes    = ref(30)
const starting   = ref(false)
const startError = ref<string | null>(null)
const maxMinutes = computed(() => (user.value?.is_premium ? 240 : 120))

function openStart() {
  startError.value = null
  minutes.value = Math.min(Math.max(1, minutes.value || 30), maxMinutes.value)
  startOpen.value = true
}

async function confirmStart() {
  if (!zone.value) return
  starting.value = true
  startError.value = null
  try {
    const dur = Math.max(1, Math.min(maxMinutes.value, Number(minutes.value) || 1))
    const run = await startRun(zone.value.id, dur)   // ← composable
    startOpen.value = false
    router.push({ path: `/fight/zone/${zone.value.id}/idling`, query: { run: String(run.id) } })
  } catch (e:any) {
    startError.value = e?.response?.data?.message ?? 'Impossible de démarrer l’exploration.'
  } finally {
    starting.value = false
  }
}

/* ------------------------------------------------------------
 * Lifecycle & navigation
 * ------------------------------------------------------------ */
onMounted(async () => {
  await loadZone(props.id)
  await loadMonsters()
})

watch(() => props.id, async (id) => {
  await loadZone(id)
  await loadMonsters()
})

</script>

<template>
  <section class="min-h-screen pt-5 pl-5 pr-5">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <h1 class="text-3xl font-semibold text-gray-100">Combattre</h1>
    </div>

    <!-- États globaux -->
    <div v-if="loading" class="flex items-center gap-2 text-white/70">
      <Loader2 class="h-4 w-4 animate-spin" /> Chargement…
    </div>
    <div v-else-if="error" class="text-rose-300">
      {{ error }}
    </div>

    <!-- Contenu -->
    <div v-else-if="zone" class="space-y-6">
      <!-- Hero -->
      <div class="relative overflow-hidden rounded-xl border border-white/10">
        <img :src="zone.image_url" :alt="zone.name" class="w-full max-h-[380px] object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

        <div class="absolute left-4 bottom-4 right-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold text-white drop-shadow">{{ zone.name }}</h2>
            <span class="mt-1 inline-block text-[12px] rounded-full px-2 py-0.5 border border-white/20 bg-black/40 backdrop-blur-sm text-white">
              Niv. {{ zone.min_level }}–{{ zone.max_level }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <RouterLink
                to="/fight"
                class="hidden sm:inline-flex rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
            >
              <ArrowLeft class="h-4 w-4 mr-2" /> Choisir une autre zone
            </RouterLink>
            <button
                class="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-white/10 text-white"
                :class="canFight ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 cursor-not-allowed opacity-60'"
                :disabled="!canFight"
                @click="openStart"
            >
              <Swords class="h-4 w-4" />
              {{ canFight ? 'Lancer le combat' : `Niveau requis : ${zone.min_level}+` }}
            </button>
          </div>
        </div>
      </div>

      <!-- Détails -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="text-white font-semibold mb-2">Description</h3>
          <p class="text-white/80 whitespace-pre-line break-words">
            {{ zone.description || '—' }}
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="text-white font-semibold mb-2">Informations</h3>
          <ul class="text-sm text-white/80 space-y-2">
            <li>
              <span class="text-white/60">Niveau minimum :</span>
              <span class="ml-2 text-white">{{ zone.min_level }}</span>
            </li>
            <li>
              <span class="text-white/60">Niveau maximum :</span>
              <span class="ml-2 text-white">{{ zone.max_level }}</span>
              <span class="text-white/60"> (aucun xp gagné au delà.)</span>
            </li>
            <li v-if="playerLevel != null">
              <span class="text-white/60">Votre niveau :</span>
              <span class="ml-2" :class="(playerLevel as number) >= zone.min_level ? 'text-emerald-400' : 'text-rose-400'">
                {{ playerLevel }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Monstres : grille + popover flottant -->
      <div class="rounded-xl border border-white/10 bg-white/5 p-4 relative w-fit" ref="wrapRef" @pointerleave="hideNow">
        <h3 class="text-white font-semibold mb-3">Monstres</h3>

        <p v-if="mLoading" class="text-sm text-white/70">Chargement…</p>
        <p v-else-if="mError" class="text-sm text-rose-300">{{ mError }}</p>
        <p v-else-if="monsters.length === 0" class="text-sm text-white/60">Aucun monstre pour cette zone.</p>

        <div v-else>
          <div class="flex flex-wrap gap-2">
            <button
                v-for="m in monsters" :key="m.id"
                class="relative size-20 rounded-md overflow-hidden
                     border border-white/10 bg-white/5 hover:bg-white/10
                     transition focus:outline-none focus:ring-1 focus:ring-white/20"
                @pointerenter="(e) => showPopover(e, m.id)"
                @pointerleave="scheduleHide"
                @focus="(e) => showPopover(e as unknown as PointerEvent, m.id)"
                @blur="scheduleHide"
                :title="m.name"
            >
              <img v-if="m.image_url" :src="m.image_url" :alt="m.name" class="absolute inset-0 w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <Skull class="h-7 w-7 text-white/40" />
              </div>
              <span class="sr-only">{{ m.name }} — Niveau {{ m.level }}</span>
            </button>
          </div>
        </div>

        <div
            v-if="hovered"
            class="absolute z-40"
            :style="{ left: pos.left + 'px', top:  pos.top  + 'px', width: POPOVER_W + 'px', transform: 'translateY(-100%)'}"
            @mouseenter="cancelHide"
            @mouseleave="() => { hoverId.value = null }"
        >
          <div class="rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-md shadow-xl p-3">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-md overflow-hidden border border-white/10 bg-white/5">
                <img v-if="hovered.image_url" :src="hovered.image_url" :alt="hovered.name" class="h-full w-full object-cover" />
                <div v-else class="h-full w-full flex items-center justify-center">
                  <Skull class="h-4 w-4 text-white/50" />
                </div>
              </div>
              <div class="min-w-0">
                <p class="text-white font-medium leading-tight truncate">{{ hovered.name }}</p>
                <span class="text-[11px] rounded-full px-2 py-0.5 border border-white/10 bg-white/5 text-white/70">
                  Niveau {{ hovered.level }}
                </span>
              </div>
            </div>

            <ul class="mt-2 text-[13px] text-white/80 space-y-0.5">
              <li>HP  <span class="ml-1 font-medium text-white">{{ hovered.hp }}</span></li>
              <li>ATK <span class="ml-1 font-medium text-white">{{ hovered.atk }}</span></li>
              <li>DEF <span class="ml-1 font-medium text-white">{{ hovered.def }}</span></li>
            </ul>

            <div v-if="hovered.spawn_chance != null" class="mt-3">
              <p class="text-xs text-white/60">
                Taux de rencontre
                <span class="text-sm font-medium text-white">
                  {{ fmtPct(hovered.spawn_chance) }}
                </span>
              </p>
            </div>

            <div class="mt-2">
              <p class="text-xs text-white/60 mb-1">Butin</p>
              <ul v-if="hovered.drops?.length" class="space-y-1">
                <li
                    v-for="d in hovered.drops"
                    :key="d.id"
                    class="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5"
                >
                  <img v-if="d.icon_url" :src="d.icon_url" alt="" class="h-5 w-5 rounded object-cover shrink-0" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-white/90 truncate">{{ d.name }} ({{ d.chance }}%)</p>
                  </div>
                  <span class="text-xs text-white/80 whitespace-nowrap">
                    {{ qtyLabel(d) }}
                  </span>
                </li>
              </ul>
              <p v-else class="text-sm text-white/60">Aucun drop renseigné.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL durée -->
    <teleport to="body">
      <div
          v-if="startOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click.self="startOpen = false"
      >
        <div class="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-4 shadow-xl">
          <div class="flex items-center justify-between">
            <h3 class="text-white font-semibold">Durée d’exploration</h3>
            <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="startOpen = false">
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <div class="flex items-center gap-3">
              <input v-model.number="minutes" type="number" :min="1" :max="maxMinutes"
                     class="w-24 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-white"/>
              <span class="text-white/70 text-sm">minute(s) — max {{ maxMinutes }}</span>
            </div>
            <input v-model.number="minutes" type="range" :min="1" :max="maxMinutes" class="w-full"/>
            <p v-if="startError" class="text-rose-300 text-sm">{{ startError }}</p>
          </div>

          <div class="mt-4 flex justify-end gap-2">
            <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
                    @click="startOpen = false">Annuler</button>
            <button class="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-500/90
                           px-3 py-2 text-white disabled:opacity-60"
                    :disabled="starting"
                    @click="confirmStart">
              <Loader2 v-if="starting" class="h-4 w-4 animate-spin" />
              <Swords v-else class="h-4 w-4" />
              Valider
            </button>
          </div>

          <p class="mt-2 text-xs text-white/50">
            {{ user?.is_premium ? 'Premium : jusqu’à 240 minutes' : 'Limite : 120 minutes (premium pour étendre la durée)' }}
          </p>
        </div>
      </div>
    </teleport>
  </section>
</template>
