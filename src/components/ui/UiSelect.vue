<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

type Opt = { id: number | string; name: string }

const props = defineProps<{
  modelValue: number | string | null
  options: Opt[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | string | null): void
}>()

const open = ref(false)
const anchor = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)

const selected = computed(() =>
    props.options.find(o => o.id === props.modelValue) ?? null
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    const i = props.options.findIndex(o => o.id === props.modelValue)
    activeIndex.value = i >= 0 ? i : 0
  }
}
function close() {
  open.value = false
  activeIndex.value = -1
}
function select(o: Opt) {
  emit('update:modelValue', o.id)
  close()
}

function onDoc(e: MouseEvent) {
  if (!open.value) return
  const t = e.target as Node
  // ferme uniquement si clic en dehors du composant
  if (anchor.value && !anchor.value.contains(t)) close()
}

function onKey(e: KeyboardEvent) {
  if (!open.value) {
    if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); toggle() }
    return
  }
  if (e.key === 'Escape') { e.preventDefault(); close(); return }
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex.value = Math.min(props.options.length - 1, activeIndex.value + 1); return }
  if (e.key === 'ArrowUp')   { e.preventDefault(); activeIndex.value = Math.max(0, activeIndex.value - 1); return }
  if (e.key === 'Enter')     { e.preventDefault(); const o = props.options[activeIndex.value]; if (o) select(o) }
}

onMounted(() => document.addEventListener('mousedown', onDoc))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDoc))
</script>

<template>
  <!-- stoppe la propagation pour ne pas atteindre le backdrop de la modal -->
  <div ref="anchor" class="relative" @mousedown.stop @click.stop>
    <button
        type="button"
        class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-white
             placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400/40
             disabled:opacity-50"
        :aria-expanded="open"
        :disabled="disabled"
        @click.stop="toggle"
        @keydown="onKey"
    >
      <span v-if="selected" class="truncate">{{ selected.name }}</span>
      <span v-else class="text-white/40">{{ placeholder ?? 'Choisir…' }}</span>

      <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 transition"
          :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- menu (pas de voile global) -->
    <ul
        v-if="open"
        role="listbox"
        class="absolute z-[70] mt-1 w-full max-h-60 overflow-auto rounded-lg
             border border-white/10 bg-neutral-900/95 backdrop-blur shadow-xl p-1"
        @mousedown.stop
        @click.stop
    >
      <li
          v-for="(o, idx) in options"
          :key="o.id"
          role="option"
          @mousedown.prevent.stop="select(o)"
          @mouseenter="activeIndex = idx"
          class="flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer text-white"
          :class="idx === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'"
      >
        <Check v-if="o.id === modelValue" class="h-4 w-4 text-indigo-400" />
        <span class="truncate">{{ o.name }}</span>
      </li>
    </ul>
  </div>
</template>
