<script setup lang="ts">
import {computed} from "vue";

type Loot = {
  resource_id: number
  name: string
  icon_url?: string | null
  qty?: number        // backend idle
  quantity?: number   // au cas où
  rarity?: number     // 1..5 (optionnel)
}

const props = defineProps<{
  items: Loot[] | null | undefined
  emptyText?: string
}>()

const sorted = computed(() =>
    (props.items ?? [])
        .map(i => ({ ...i, count: i.qty ?? i.quantity ?? 0 }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
)

function rarityRing(r?: number) {
  switch (r ?? 1) {
    case 2: return 'ring-emerald-500/60'
    case 3: return 'ring-blue-500/60'
    case 4: return 'ring-violet-500/60'
    case 5: return 'ring-rose-500/60'
    default: return 'ring-neutral-600/50'
  }
}
</script>

<template>
  <div>
    <ul v-if="sorted.length" class="space-y-2">
      <li
          v-for="l in sorted"
          :key="l.resource_id"
          class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
              class="relative h-10 w-10 rounded-lg border border-white/10 bg-black/40 ring-2"
              :class="rarityRing(l.rarity)"
          >
            <img
                v-if="l.icon_url"
                :src="l.icon_url"
                :alt="l.name"
                class="absolute inset-0 m-auto max-h-[80%] max-w-[80%] object-contain"
                draggable="false"
            />
          </div>

          <div class="min-w-0">
            <p class="text-white truncate">{{ l.name }}</p>
            <p class="text-xs text-white/50" v-if="l.rarity">Rareté {{ l.rarity }}</p>
          </div>
        </div>

        <span
            class="shrink-0 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-sm text-white/90">
          x{{ l.count }}
        </span>
      </li>
    </ul>

    <p v-else class="text-white/60 text-sm">
      {{ emptyText ?? 'Aucun butin.' }}
    </p>
  </div>
</template>
