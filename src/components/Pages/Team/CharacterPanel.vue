<script setup lang="ts">
import { computed } from 'vue'

// optionnel : un placeholder si rien ne matche
import placeholder from '@/assets/runara_logo.png'

const props = defineProps<{
  name: string
  className?: string | null
  level: number
  portrait?: string | null
  typeId?: number | null
}>()

// src finale : portrait_url > image par type_id > placeholder
const pictureSrc = computed(() =>
    props.portrait || placeholder
)
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
    <div class="flex items-end justify-center bg-black/30 rounded-xl">
      <img
          :src="pictureSrc"
          :alt="name"
          class="max-h-full w-auto object-contain select-none pointer-events-none"
      />
    </div>

    <h3 class="text-lg font-semibold truncate">{{ name }}</h3>
    <p class="text-white/70">
      {{ className || '—' }} — <span class="text-white">Niv. {{ level }}</span>
    </p>
  </div>
</template>
