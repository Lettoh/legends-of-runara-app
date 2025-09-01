<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import zones from '@/zones'
import { Swords, Search } from 'lucide-vue-next'

const { listZones } = zones()

const loading = ref(true)
const error   = ref<string | null>(null)
const all     = ref<any[]>([])
const q       = ref('')

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await listZones({ per_page: 60, sort:'min_level' }) // adapte si besoin
    all.value = Array.isArray(data) ? data : (data.data ?? [])
  } catch (e:any) {
    error.value = e?.message ?? 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return all.value
  return all.value.filter((z:any) =>
      [z.name, z.description].join(' ').toLowerCase().includes(t)
  )
})
</script>

<template>
  <section class="min-h-screen pt-5 pl-5 pr-5">
    <h1 class="text-3xl font-bold mb-6 font-display">Choisis ta zone</h1>

    <!-- recherche -->
    <div
        class="relative mb-6 max-w-xl rounded-lg border border-white/10 bg-white/5
             hover:bg-white/10 focus-within:bg-white/10 focus-within:border-indigo-400/40 transition">
      <Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60"/>
      <input
          v-model.trim="q"
          type="search"
          placeholder="Rechercher une zone…"
          class="w-full bg-transparent pl-10 pr-3 py-3 text-sm text-gray-100 placeholder-white/40 outline-none"
      />
    </div>

    <!-- états -->
    <p v-if="loading" class="text-white/70">Chargement…</p>
    <p v-else-if="error" class="text-rose-300">Erreur : {{ error }}</p>
    <p v-else-if="filtered.length === 0" class="text-white/60">Aucune zone.</p>

    <!-- GRID 3 colonnes -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <article
          v-for="z in filtered"
          :key="z.id"
          class="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition
         overflow-hidden flex flex-col h-full"
      >
        <!-- image -->
        <div class="relative">
          <img :src="z.image_url" :alt="z.name" class="w-full aspect-[16/9] object-cover" />
          <span
              class="absolute left-3 top-3 text-[11px] rounded-full px-2 py-0.5
             border border-white/20 bg-black/40 backdrop-blur-sm text-white/90">
            Niv. {{ z.min_level }}–{{ z.max_level }}
          </span>
        </div>

        <!-- contenu = grille: [titre][desc qui pousse][footer bouton] -->
        <div class="p-4 flex-1 grid grid-rows-[auto_1fr_auto] gap-2">
          <h2 class="font-semibold text-white text-base break-words">{{ z.name }}</h2>

          <p class="text-sm text-white/70 line-clamp-3 whitespace-pre-line break-words">
            {{ z.description || '—' }}
          </p>

          <!-- footer bouton calé en bas à droite -->
          <div class="mt-2 flex justify-end">
            <RouterLink
                :to="{ name: 'fight.zone', params: { id: z.id } }"
                custom
                v-slot="{ navigate, href }"
            >
              <button
                  type="button"
                  :disabled="!z.player_can_access"
                  :aria-disabled="!z.player_can_access"
                  class="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-white/10 text-white"
                  :class="!z.player_can_access ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'"
                  @click="z.player_can_access && navigate($event)"
              >
                <Swords class="h-4 w-4" />
                Combattre
              </button>
            </RouterLink>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
