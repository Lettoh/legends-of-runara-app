<!-- components/ui/UiSwitch.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean | null | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const isOn = computed(() => !!props.modelValue)

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !isOn.value)
}
</script>

<template>
  <div class="inline-flex items-center gap-3 select-none">
    <!-- Le switch -->
    <button
        type="button"
        role="switch"
        :aria-checked="isOn"
        :disabled="disabled"
        @click="toggle"
        @keydown.space.prevent="toggle"
        @keydown.enter.prevent="toggle"
        class="relative inline-flex h-6 w-11 items-center rounded-full border transition
             focus:outline-none focus:ring-2 focus:ring-indigo-400/40
             disabled:opacity-50 disabled:cursor-not-allowed"
        :class="isOn
        ? 'bg-emerald-500/25 border-emerald-400/30'
        : 'bg-white/5 border-white/10'"
    >
      <span
          class="absolute h-5 w-5 rounded-full bg-white/80 shadow transition-transform will-change-transform"
          :class="isOn ? 'translate-x-[22px]' : 'translate-x-[2px]'"
          style="left:0px"
      />
    </button>

    <!-- Texte à droite du switch -->
    <span class="text-sm text-white/80">
      <slot />
    </span>
  </div>
</template>
