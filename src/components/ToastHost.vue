<script setup lang="ts">
import useToast from '@/useToast'
import { X } from 'lucide-vue-next'  // ← icône close

const { toasts, remove } = useToast()

const typeClasses = (type: string) => {
  switch (type) {
    case 'success': return 'ring-emerald-500/20 border-emerald-500/30'
    case 'error':   return 'ring-rose-500/20 border-rose-500/30'
    case 'warning': return 'ring-amber-500/20 border-amber-500/30'
    default:        return 'ring-white/10 border-white/10'
  }
}
</script>

<template>
  <teleport to="body">
    <div class="fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
            v-for="t in toasts"
            :key="t.id"
            class="pointer-events-auto w-80 rounded-lg bg-neutral-900/90 text-white
                 border p-3 shadow-lg ring-1"
            :class="typeClasses(t.type)"
            role="status" aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <span class="mt-1 inline-block h-2.5 w-2.5 rounded-full"
                  :class="{
                    'bg-emerald-400': t.type==='success',
                    'bg-rose-400': t.type==='error',
                    'bg-amber-400': t.type==='warning',
                    'bg-white/70': t.type==='info'
                  }" />
            <p class="text-sm leading-5 flex-1">{{ t.message }}</p>

            <!-- close: icône lucide, pas de <button> -->
            <a
                href="#"
                @click.prevent="remove(t.id)"
                class="shrink-0 p-1 rounded-md text-white/60 hover:text-white hover:bg-white/5 transition
                     focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Fermer"
            >
              <X class="h-4 w-4" />
            </a>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .18s ease; }
.toast-enter-from,  .toast-leave-to      { opacity: 0; transform: translateY(-6px) scale(.98); }
</style>
