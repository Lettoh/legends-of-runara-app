<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{
  icon: Component
  label: string
  value: number | string
  /** palette de 20 couleurs */
  color?:
      | 'red' | 'orange' | 'yellow' | 'lime' | 'green' | 'emerald'
      | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet'
      | 'purple' | 'fuchsia' | 'pink' | 'rose' | 'amber'
      | 'slate' | 'zinc' | 'stone'
}>()

const palette = {
  // ——— Primaires/“élémentaires”
  red:     { ring:'ring-red-400/30',     hover:'ring-red-400/40 shadow-[0_0_30px_rgba(239,68,68,0.16)]',       grad:'from-red-500/12' },
  orange:  { ring:'ring-orange-400/30',  hover:'ring-orange-400/40 shadow-[0_0_30px_rgba(249,115,22,0.16)]',   grad:'from-orange-500/12' },
  yellow:  { ring:'ring-yellow-400/30',  hover:'ring-yellow-400/40 shadow-[0_0_30px_rgba(234,179,8,0.16)]',    grad:'from-yellow-500/12' },
  lime:    { ring:'ring-lime-400/30',    hover:'ring-lime-400/40 shadow-[0_0_30px_rgba(132,204,22,0.16)]',     grad:'from-lime-500/12' },
  green:   { ring:'ring-green-400/30',   hover:'ring-green-400/40 shadow-[0_0_30px_rgba(34,197,94,0.16)]',     grad:'from-green-500/12' },
  emerald: { ring:'ring-emerald-400/30', hover:'ring-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]',  grad:'from-emerald-500/12' },
  teal:    { ring:'ring-teal-400/30',    hover:'ring-teal-400/40 shadow-[0_0_30px_rgba(20,184,166,0.16)]',     grad:'from-teal-500/12' },
  cyan:    { ring:'ring-cyan-400/30',    hover:'ring-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.15)]',     grad:'from-cyan-500/12' },
  sky:     { ring:'ring-sky-400/30',     hover:'ring-sky-400/40 shadow-[0_0_30px_rgba(56,189,248,0.16)]',      grad:'from-sky-500/12' },
  blue:    { ring:'ring-blue-400/30',    hover:'ring-blue-400/40 shadow-[0_0_30px_rgba(59,130,246,0.16)]',     grad:'from-blue-500/12' },
  indigo:  { ring:'ring-indigo-400/30',  hover:'ring-indigo-400/40 shadow-[0_0_30px_rgba(99,102,241,0.15)]',   grad:'from-indigo-500/12' },
  violet:  { ring:'ring-violet-400/30',  hover:'ring-violet-400/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]',   grad:'from-violet-500/12' },
  purple:  { ring:'ring-purple-400/30',  hover:'ring-purple-400/40 shadow-[0_0_30px_rgba(168,85,247,0.16)]',   grad:'from-purple-500/12' },
  fuchsia: { ring:'ring-fuchsia-400/30', hover:'ring-fuchsia-400/40 shadow-[0_0_30px_rgba(217,70,239,0.16)]',  grad:'from-fuchsia-500/12' },
  pink:    { ring:'ring-pink-400/30',    hover:'ring-pink-400/40 shadow-[0_0_30px_rgba(236,72,153,0.16)]',     grad:'from-pink-500/12' },
  rose:    { ring:'ring-rose-400/30',    hover:'ring-rose-400/40 shadow-[0_0_30px_rgba(244,63,94,0.15)]',      grad:'from-rose-500/12' },
  amber:   { ring:'ring-amber-400/30',   hover:'ring-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.18)]',    grad:'from-amber-500/12' },

  // ——— Neutres / matos / armures / ombre
  slate:   { ring:'ring-slate-400/30',   hover:'ring-slate-400/40 shadow-[0_0_30px_rgba(100,116,139,0.14)]',   grad:'from-slate-400/10' },
  zinc:    { ring:'ring-zinc-400/30',    hover:'ring-zinc-400/40 shadow-[0_0_30px_rgba(113,113,122,0.14)]',    grad:'from-zinc-400/10' },
  stone:   { ring:'ring-stone-400/30',   hover:'ring-stone-400/40 shadow-[0_0_30px_rgba(120,113,108,0.14)]',   grad:'from-stone-400/10' },
} as const

const p = computed(() => palette[props.color ?? 'indigo'])
</script>

<template>
  <div
      class="group relative rounded-xl border border-white/10 bg-white/5 p-3 overflow-hidden
           transition-shadow duration-200"
  >
    <!-- lueur douce -->
    <div
        class="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full
             bg-gradient-to-br to-transparent blur-xl"
        :class="p.grad"
    />
    <!-- contenu -->
    <div class="relative flex items-center gap-3">
      <div
          class="h-11 w-11 rounded-lg bg-black/40 border border-white/10
               flex items-center justify-center ring-1 transition-all duration-200"
          :class="p.ring + ' group-hover:' + p.hover"
      >
        <component :is="icon" class="h-5 w-5 text-white" />
      </div>

      <div class="min-w-0">
        <div class="text-[11px] uppercase tracking-wide text-white/60">
          {{ label }}
        </div>
        <div class="mt-0.5 text-2xl leading-none font-semibold text-white">
          {{ value }}
        </div>
      </div>
    </div>

    <!-- halo au survol -->
    <div
        class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset opacity-0
             transition-opacity duration-200 group-hover:opacity-100"
        :class="p.ring"
    />
  </div>
</template>
