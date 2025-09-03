<!-- SpellsAndStatistics.vue -->
<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Heart, ShieldHalf, Sword, Flame, Plus, Lock } from 'lucide-vue-next'
import StatTile from '@/components/Pages/Team/StatTile.vue'
import SpellPopover from '@/components/Pages/Team/SpellPopover.vue'

const props = defineProps<{
  spells: Array<any>
  size?: number
  stats: { strength: number; power: number; hp: number; defense: number }
}>()

const totalSlots = computed(() => Math.max(props.size ?? 8, props.spells?.length ?? 0))
const placeholders = computed(() => Math.max(0, totalSlots.value - (props.spells?.length ?? 0)))

/* === Popover téléporté vers <body> === */
const open = ref(false)
const hoveredSpell = ref<any|null>(null)
const anchorEl = ref<HTMLElement|null>(null)
const popEl = ref<HTMLElement|null>(null)
const style = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const hoveringPopover = ref(false)
const margin = 10

let closeTimer: ReturnType<typeof setTimeout> | null = null
const armClose = (delay = 120) => {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    if (!hoveringPopover.value) open.value = false
    closeTimer = null
  }, delay)
}
const cancelClose = () => {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

function clamp(min: number, max: number, v: number) { return Math.min(max, Math.max(min, v)) }

function positionPopover() {
  const a = anchorEl.value?.getBoundingClientRect()
  const p = popEl.value?.getBoundingClientRect()
  if (!a || !p) return

  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = 0, left = 0
  const tryTop = () => {
    top  = a.top - p.height - margin
    left = a.left + a.width/2 - p.width/2
    if (top < margin) return false
    left = clamp(margin, vw - p.width - margin, left)
    return true
  }
  const tryBottom = () => {
    top  = a.bottom + margin
    left = a.left + a.width/2 - p.width/2
    if (top + p.height + margin > vh) return false
    left = clamp(margin, vw - p.width - margin, left)
    return true
  }

  if (!tryTop()) tryBottom()
  if (top < margin) top = margin
  if (top + p.height + margin > vh) top = Math.max(margin, vh - p.height - margin)

  style.value = { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` }
}

async function onEnterTile(e: MouseEvent, spell: any) {
  cancelClose()                       // 👈 empêche la fermeture si on passe à une autre tuile
  hoveredSpell.value = spell
  anchorEl.value = e.currentTarget as HTMLElement
  if (!open.value) open.value = true  // si déjà ouvert, on ne le referme pas
  await nextTick()
  positionPopover()
}
function onLeaveTile() {
  // si on sort de la tuile mais pas vers le popover, on fermera après un court délai
  armClose(120)
}
function onPopEnter() {               // entrer dans le popover
  hoveringPopover.value = true
  cancelClose()
}
function onPopLeave() {               // sortir du popover
  hoveringPopover.value = false
  armClose(80)
}

function onScrollOrResize() { if (open.value) positionPopover() }

onMounted(() => {
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
  cancelClose()
})
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-4">
    <h3 class="text-white font-semibold mb-3">Sorts</h3>

    <div class="grid grid-cols-4 gap-3">
      <!-- cartes de sorts -->
      <template v-for="(spell, i) in spells" :key="spell.id ?? i">
        <div class="relative cursor-pointer">
          <div
              class="aspect-square overflow-hidden rounded-lg border border-white/10 bg-neutral-800/50
                   group focus-within:ring-1 focus-within:ring-white/20"
              tabindex="0"
              @mouseenter="onEnterTile($event, spell)"
              @focusin="onEnterTile($event, spell)"
              @mouseleave="onLeaveTile"
              @focusout="onLeaveTile"
          >
            <img
                v-if="spell?.image_url"
                :src="spell.image_url"
                alt=""
                class="h-full w-full object-cover"
                :class="!spell?.unlocked ? 'grayscale opacity-60' : ''"
            />
            <div v-else class="h-full w-full flex items-center justify-center text-white/40">?</div>

            <div v-if="!spell?.unlocked" class="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
            <Lock v-if="!spell?.unlocked" class="absolute right-1.5 top-1.5 h-4 w-4 text-white/50" />
            <div class="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/0 transition group-hover:ring-white/20" />
          </div>
        </div>
      </template>

      <!-- placeholders -->
      <template v-for="i in placeholders" :key="'ph-'+i">
        <div
            class="aspect-square rounded-lg border border-dashed border-white/10 bg-white/5
                 flex items-center justify-center text-white/30"
        >
          <Plus class="h-5 w-5" />
        </div>
      </template>
    </div>

    <!-- popover téléporté (unique, suit la tuile survolée) -->
    <Teleport to="body" v-if="open && hoveredSpell">
      <div
          ref="popEl"
          class="fixed z-[60]"
          :style="style"
          @mouseenter="onPopEnter"
          @mouseleave="onPopLeave"
      >
        <SpellPopover :spell="hoveredSpell" :stats="{ strength: stats.strength, power: stats.power }" />
      </div>
    </Teleport>

    <h3 class="text-white font-semibold mt-8 mb-3">Statistiques</h3>
    <div class="grid grid-cols-2 gap-3">
      <StatTile class="cursor-pointer" :icon="Sword"      label="Force"     :value="stats.strength" color="amber" />
      <StatTile class="cursor-pointer" :icon="Flame"      label="Puissance" :value="stats.power"    color="purple" />
      <StatTile class="cursor-pointer" :icon="Heart"      label="PV"        :value="stats.hp"       color="rose" />
      <StatTile class="cursor-pointer" :icon="ShieldHalf" label="Défense"   :value="stats.defense"  color="emerald" />
    </div>
  </div>
</template>
