<script setup lang="ts">
import { ref, watch } from 'vue'
import users from "@/users.ts";

const { searchUsers } = users();

const q = ref('')
const results = ref<Array<{ id:number; name:string; email:string }>>([])
const loading = ref(false)
const error = ref<string | null>(null)

let abortController: AbortController | null = null
let timer: number | null = null

const inputEl = ref<HTMLInputElement | null>(null)
const clearQuery = () => {
  q.value = ''
  results.value = []
  error.value = null
  requestAnimationFrame(() => inputEl.value?.focus())
}

watch(q, (val) => {
  // debounce 300ms
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => search(val), 300)
})

async function search(term: string) {
  results.value = []
  error.value = null

  if (!term) {
    loading.value = false
    return
  }

  // annule la requête précédente
  abortController?.abort()
  abortController = new AbortController()

  loading.value = true
  try {
    const data = await searchUsers(term) // <-- data déjà parsée

    results.value = Array.isArray(data)
        ? data
        : (data.data ?? []) // si ton API renvoie une pagination Laravel
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      error.value = e.message ?? 'Erreur inconnue'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-2 self-start w-full">
    <!-- input style "bouton" -->
    <div
        class="relative rounded-lg border border-white/10 bg-white/5 transition
             hover:bg-white/10 focus-within:bg-white/10 focus-within:border-indigo-400/40"
    >
      <!-- icône loupe -->
      <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50"
           viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd"
              d="M10.5 3.75a6.75 6.75 0 1 0 4.245 12.02l3.242 3.243a.75.75 0 1 0 1.06-1.061l-3.242-3.243A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
              clip-rule="evenodd"/>
      </svg>

      <input
          ref="inputEl"
          v-model.trim="q"
          type="search"
          placeholder="Rechercher un utilisateur (nom, email)…"
          class="w-full bg-transparent px-10 pr-14 py-3.5 text-sm text-gray-100
         placeholder-white/40 outline-none ring-0 border-0 appearance-none"
      />

      <!-- bouton clear -->

      <a
          v-if="q"
          href="#"
          @click.prevent="clearQuery()"
          class="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 p-0 m-0 grid place-items-center
         text-white/60 hover:text-white no-underline bg-transparent"
          aria-label="Effacer la recherche"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 pointer-events-none">
          <path fill-rule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 0 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"/>
        </svg>
      </a>

      <!-- badge compteur -->
      <span
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full
               border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] leading-none text-white/70"
      >
        {{ loading ? '…' : results.length }}
      </span>
    </div>

    <!-- états -->
    <p v-if="!q" class="text-xs text-white/50">Tapez pour lancer une recherche.</p>
    <p v-else-if="loading" class="text-xs text-white/60">Recherche…</p>
    <p v-else-if="error" class="text-xs text-rose-300">Erreur: {{ error }}</p>
    <p v-else-if="results.length === 0" class="text-xs text-white/60">Aucun résultat pour « {{ q }} ».</p>

    <!-- liste résultats : chaque ligne cliquable -->
    <ul
        v-else
        class="rounded-lg border border-white/10 bg-white/5 divide-y divide-white/10
             max-h-72 overflow-y-auto"
    >
      <li v-for="u in results" :key="u.id">
        <RouterLink
            :to="{ name: 'team.user', params: { id: u.id } }"
            class="group block px-4 py-3 hover:bg-white/10 transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-100">{{ u.name }}</p>
              <p class="text-xs text-white/60">{{ u.email }}</p>
            </div>

            <div class="flex items-center gap-1 text-xs text-white/60">
              <span class="opacity-0 group-hover:opacity-100 transition">Voir</span>
              <svg viewBox="0 0 24 24" fill="currentColor"
                   class="h-4 w-4 transform transition-transform group-hover:translate-x-0.5">
                <path fill-rule="evenodd"
                      d="M9.22 4.22a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06L14.94 12 9.22 6.28a.75.75 0 0 1 0-1.06Z"
                      clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>