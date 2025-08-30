<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, computed } from 'vue'

type Item = {
  resource_id?: number
  name: string
  icon_url?: string | null
  quantity: number
  rarity?: number
}

const props = defineProps<{ item: Item }>()

const visible  = ref(false)
const anchorEl = ref<HTMLElement | null>(null)
const popEl    = ref<HTMLElement | null>(null)
const popX     = ref(0)
const popY     = ref(0)

const ringClass = computed(() => {
  const r = props.item.rarity ?? 1
  switch (r) {
    case 2: return 'ring-2 ring-emerald-500/40'
    case 3: return 'ring-2 ring-blue-500/40'
    case 4: return 'ring-2 ring-violet-500/50'
    case 5: return 'ring-2 ring-amber-500/50'
    default: return 'ring-1 ring-white/10'
  }
})
const popBorderClass = computed(() => {
  const r = props.item.rarity ?? 1
  switch (r) {
    case 2: return 'border-emerald-500/30'
    case 3: return 'border-blue-500/30'
    case 4: return 'border-violet-500/40'
    case 5: return 'border-amber-500/40'
    default: return 'border-white/10'
  }
})

function placePopover() {
  const a = anchorEl.value
  const p = popEl.value
  if (!a || !p) return

  const pad = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const r  = a.getBoundingClientRect()
  const w  = p.offsetWidth
  const h  = p.offsetHeight

  // par défaut : au-dessus aligné à gauche
  let x = r.left
  let y = r.top - h - pad
  if (y < pad) y = r.bottom + pad

  // clamps
  if (x + w > vw - pad) x = vw - pad - w
  if (x < pad) x = pad
  if (y + h > vh - pad) y = Math.max(pad, vh - pad - h)
  if (y < pad) y = pad

  popX.value = Math.round(x)
  popY.value = Math.round(y)
}

function open() {
  visible.value = true
  nextTick(() => {
    placePopover()
    // une 2e passe quand le layout est stabilisé (évite les petits décalages)
    requestAnimationFrame(placePopover)
  })
  window.addEventListener('scroll', placePopover, { passive: true })
  window.addEventListener('resize', placePopover)
}
function close() {
  visible.value = false
  window.removeEventListener('scroll', placePopover)
  window.removeEventListener('resize', placePopover)
}
onBeforeUnmount(close)
</script>

<template>
  <div class="relative">
    <!-- Tuile carrée -->
    <button
        ref="anchorEl"
        type="button"
        class="group relative block w-full aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        @mouseenter="open"
        @mouseleave="close"
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <div
            class="h-[72%] w-[72%] rounded-lg border border-white/10 bg-black/40 flex items-center justify-center"
            :class="ringClass"
        >
          <img
              v-if="item.icon_url"
              :src="item.icon_url"
              :alt="item.name"
              class="max-h-full max-w-full object-contain select-none pointer-events-none"
              draggable="false"
          />
        </div>
      </div>

      <!-- quantité -->
      <span
          class="pointer-events-none absolute top-1 right-1 rounded-full border border-white/10 bg-black/80 px-1.5 py-0.5 text-[11px] text-white/90"
      >
        x{{ item.quantity }}
      </span>
    </button>

    <!-- Popover téléporté dans body : plus aucun clipping -->
    <Teleport to="body">
      <transition name="fade">
        <div
            v-if="visible"
            ref="popEl"
            class="pointer-events-none fixed left-0 top-0 z-[9999] w-max max-w-[280px] rounded-lg border bg-neutral-900/95 p-3 text-sm text-white shadow-xl will-change-transform"
            :class="popBorderClass"
            :style="{ transform: `translate3d(${popX}px, ${popY}px, 0)` }"
        >
          <div class="mb-1 flex items-center gap-3">
            <img
                v-if="item.icon_url"
                :src="item.icon_url"
                :alt="item.name"
                class="h-8 w-8 rounded border border-white/10 bg-black/40 object-contain"
            />
            <div class="font-semibold text-white">{{ item.name }}</div>
          </div>
          <div class="text-white/80">
            Qté x{{ item.quantity }} · Rareté {{ item.rarity ?? 1 }}
          </div>
          <div class="mt-2 italic text-white/60">Drops : (à venir)</div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity .12s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
