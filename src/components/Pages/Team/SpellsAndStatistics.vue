<script setup lang="ts">
import {Heart, Plus, ShieldHalf, Sword, Flame} from 'lucide-vue-next'
import StatTile from "@/components/Pages/Team/StatTile.vue";

const props = defineProps<{
  // futur: [{id, name, icon_url, cooldown...}]
  spells: Array<any>
  // nb de slots affichés (remplis par spells || placeholders)
  size?: number
  stats: Array<any>
}>()

const SIZE = 8 // props.spells.length
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-4">
    <h3 class="text-white font-semibold mb-3">Sorts</h3>

    <div class="grid grid-cols-4 gap-3">
      <template v-for="i in SIZE" :key="i">
        <div
            class="aspect-square rounded-lg border border-white/10 bg-neutral-800/50
                 flex items-center justify-center text-white/40 select-none"
            title="À venir"
        >
          <Plus class="h-5 w-5" />
        </div>
      </template>
    </div>

    <h3 class="text-white font-semibold my-3">Statistiques</h3>
    <div class="grid grid-cols-2 gap-3">
      <StatTile class="cursor-pointer" :icon="Sword" label="Force"   :value="stats.strength" color="amber" />
      <StatTile class="cursor-pointer" :icon="Flame"    label="Puissance" :value="stats.power"  color="purple" />
      <StatTile class="cursor-pointer" :icon="Heart"  label="PV"      :value="stats.hp"       color="rose" />
      <StatTile class="cursor-pointer" :icon="ShieldHalf" label="Défense" :value="stats.defense"  color="emerald" />
    </div>
  </div>
</template>
