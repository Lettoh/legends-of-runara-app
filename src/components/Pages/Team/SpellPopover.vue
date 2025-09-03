<!-- SpellPopover.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Timer, Crosshair, Lock } from 'lucide-vue-next'

type Effect = {
  kind: 'defense'|'damage'|'elemental_weakness'|'stun'|'shield'|'dot'
  mode?: 'percent'|'flat'
  value?: number|null
  vs?: 'strength'|'power'|null
  duration_turns?: number
  chance?: number
}

const props = defineProps<{
  spell: {
    id?: number
    name?: string
    description?: string|null
    image_url?: string|null
    target?: 'enemy_single'|'enemy_all'|'ally_single'|'ally_all'|'self'
    base_power?: number
    scaling_str?: number
    scaling_pow?: number
    cooldown_turns?: number
    effects?: Effect[]
    unlocked?: boolean
    unlock_level?: number
    required_specialization?: string|null
  }
  stats: { strength: number; power: number }
}>()

const tLabel = (t?: string) => ({
  enemy_single: 'Ennemi (mono)',
  enemy_all:    'Ennemis (AoE)',
  ally_single:  'Allié (mono)',
  ally_all:     'Alliés (AoE)',
  self:         'Soi',
}[t ?? 'enemy_single'])

const isHybrid = computed(() => (props.spell.scaling_str ?? 0) > 0 && (props.spell.scaling_pow ?? 0) > 0)

const estDmg = computed(() => {
  const b = props.spell.base_power ?? 0
  const s = (props.spell.scaling_str ?? 0) * (props.stats?.strength ?? 0)
  const p = (props.spell.scaling_pow ?? 0) * (props.stats?.power ?? 0)
  return Math.round(b + s + p)
})

const fmtScale = (n?: number|null) => {
  if (!n) return '0'
  return `+${(Math.round(n*100)/100).toString()}×`
}

const effectLabel = (e: Effect) => {
  switch (e.kind) {
    case 'defense':
      return `${e.value ?? 0}${e.mode === 'flat' ? '' : '%'} DEF ${e.value && (e.value as number) > 0 ? '↑' : '↓'}${e.duration_turns ? ` • ${e.duration_turns}t` : ''}`
    case 'damage':
      return `${e.value ?? 0}${e.mode === 'flat' ? '' : '%'} DMG ${e.value && (e.value as number) > 0 ? '↑' : '↓'}${e.duration_turns ? ` • ${e.duration_turns}t` : ''}`
    case 'elemental_weakness':
      return `Faiblesse ${e.vs === 'strength' ? 'Strength' : 'Power'}${e.duration_turns ? ` • ${e.duration_turns}t` : ''}`
    case 'stun':
      return `Stun${e.duration_turns ? ` • ${e.duration_turns}t` : ''}${e.chance ? ` • ${e.chance}%` : ''}`
    case 'shield':
      return `Bouclier ${e.value ?? ''}${e.mode === 'percent' ? '%' : ''}${e.duration_turns ? ` • ${e.duration_turns}t` : ''}`
    case 'dot':
      return `DoT ${e.value ?? ''}${e.mode === 'percent' ? '%' : ''}${e.duration_turns ? ` • ${e.duration_turns}t` : ''}`
    default:
      return 'Effet'
  }
}
</script>

<template>
  <div class="w-80 rounded-xl border border-white/10 bg-zinc-900 text-white shadow-2xl">
    <div class="flex items-start gap-3 p-3">
      <img v-if="spell.image_url" :src="spell.image_url" alt="" class="h-12 w-12 rounded-md object-cover"
           :class="!spell.unlocked ? 'grayscale opacity-60' : ''"/>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h4 class="truncate font-semibold">{{ spell.name || 'Sort' }}</h4>
          <Lock v-if="!spell.unlocked" class="h-4 w-4 text-white/80" />
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/80">
            <Crosshair class="h-3.5 w-3.5" /> {{ tLabel(spell.target) }}
          </span>
          <span class="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/80" v-if="(spell.cooldown_turns ?? 0) > 0">
            <Timer class="h-3.5 w-3.5" /> {{ spell.cooldown_turns }} tour(s)
          </span>
          <span v-if="!spell.unlocked" class="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
            Niv. {{ spell.unlock_level ?? 1 }} requis
            <template v-if="spell.required_specialization"> — {{ spell.required_specialization }}</template>
          </span>
        </div>
      </div>
    </div>

    <div class="px-3 pb-3">
      <div class="mb-2">
        <div class="text-xs text-white/60">Dégâts estimés</div>
        <div class="text-lg font-semibold leading-tight">{{ estDmg }}</div>
        <div class="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
          <span class="rounded bg-white/5 px-1.5 py-0.5 text-white/80">Base {{ spell.base_power ?? 0 }}</span>
          <span v-if="(spell.scaling_str ?? 0) > 0" class="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300">STR {{ fmtScale(spell.scaling_str) }}</span>
          <span v-if="(spell.scaling_pow ?? 0) > 0" class="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-300">POW {{ fmtScale(spell.scaling_pow) }}</span>
          <span v-if="isHybrid" class="rounded bg-cyan-500/10 px-1.5 py-0.5 text-cyan-300">HYBRID</span>
        </div>
      </div>

      <p v-if="spell.description" class="mb-2 text-sm text-white/80">{{ spell.description }}</p>

      <div v-if="spell.effects?.length" class="flex flex-wrap gap-1">
        <span v-for="(e, i) in spell.effects" :key="i"
              class="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
          {{ effectLabel(e) }}
        </span>
      </div>
    </div>
  </div>
</template>
