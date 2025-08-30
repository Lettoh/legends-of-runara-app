<script setup lang="ts">
import { Shield, Sword, Shirt, Footprints, Crown, Hand, Gem, GemIcon, Wind } from 'lucide-vue-next'

type SlotKey =
    | 'weapon' | 'helmet' | 'chest' | 'gloves' | 'legs' | 'boots'
    | 'ring' | 'amulet' | 'belt' | 'cape'

const SLOT_DEFS: Record<SlotKey, { label:string; icon:any }> = {
  weapon: { label:'Arme',    icon: Sword },
  helmet: { label:'Casque',  icon: Crown },
  chest:  { label:'Torse',   icon: Shirt },
  gloves: { label:'Gants',   icon: Hand },
  legs:   { label:'Jambes',  icon: Shield },
  boots:  { label:'Bottes',  icon: Footprints },
  ring:   { label:'Anneau',  icon: Gem },
  amulet: { label:'Amulette',icon: GemIcon },
  // belt:   { label:'Ceinture',icon: Belt },
  cape:   { label:'Cape',    icon: Wind },
}

const props = defineProps<{
  // futur: { [slotKey]: { id, name, icon_url } | null }
  equipment?: Partial<Record<SlotKey, any>>
}>()

function entries() {
  return Object.entries(SLOT_DEFS) as Array<[SlotKey, {label:string; icon:any}]>
}
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-4">
    <h3 class="text-white font-semibold mb-3">Équipements</h3>

    <div class="grid grid-cols-2 gap-3">
      <button
          v-for="[key, def] in entries()"
          :key="key"
          type="button"
          class="group flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-800/50
               px-3 py-2 text-left hover:bg-neutral-800/70 transition"
      >
        <div class="h-9 w-9 rounded-md bg-black/30 border border-white/10 flex items-center justify-center">
          <component :is="def.icon" class="h-4 w-4 text-white/60" />
        </div>
        <div class="min-w-0">
          <p class="text-sm text-white truncate">{{ def.label }}</p>
          <p class="text-xs text-white/50 truncate">
            {{ props.equipment?.[key]?.name ?? '— vide —' }}
          </p>
        </div>
      </button>
    </div>

    <p class="mt-3 text-xs text-white/50">
      Clique sur un slot pour équiper/déséquiper quand on branchera la logique.
    </p>
  </div>
</template>
