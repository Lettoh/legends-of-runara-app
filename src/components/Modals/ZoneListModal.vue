<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import zones from '@/zones'                  // service API
import useToast from '@/useToast'            // toasts
import { X, Pencil, Trash2, Search } from 'lucide-vue-next'

const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{
  (e:'update:open', v:boolean): void
  (e:'edit', zone:any): void
  (e:'deleted', id:number): void
}>()

const { listZones, deleteZone } = zones()
const { success, error: toastError } = useToast()

// UI state
const q        = ref('')
const items    = ref<any[]>([])
const loading  = ref(false)
const errorMsg = ref<string | null>(null)
const page     = ref(1)
const hasMore  = ref(false)
const count    = computed(() => items.value.length)

function close(){ emit('update:open', false) }

async function fetchList({ reset = false } = {}) {
  if (reset) { page.value = 1; items.value = []; hasMore.value = false }
  loading.value = true
  errorMsg.value = null
  try {
    const data = await listZones({ page: page.value, search: q.value || undefined, per_page: 12, sort:'min_level' })
    const list = Array.isArray(data) ? data : (data.data ?? [])
    items.value = reset ? list : [...items.value, ...list]
    if (!Array.isArray(data)) {
      hasMore.value = Boolean(data.next_page_url)
      page.value = (data.current_page ?? page.value) + 1
    }
  } catch (e:any) {
    errorMsg.value = e?.message ?? 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

watch(() => props.open, v => { if (v) fetchList({ reset:true }) })

let t: number | null = null
watch(q, () => {
  if (t) clearTimeout(t)
  t = window.setTimeout(() => fetchList({ reset:true }), 300)
})

// suppression
const confirming = ref<number | null>(null)
async function removeZone(id:number) {
  try {
    await deleteZone(id)
    items.value = items.value.filter(z => z.id !== id)
    success('Zone supprimée.')
    emit('deleted', id)
  } catch {
    toastError('Échec de la suppression.')
  } finally {
    confirming.value = null
  }
}

function applyPatch(z: any) {
  const i = items.value.findIndex(it => it.id === z.id)
  if (i !== -1) {
    items.value[i] = { ...items.value[i], ...z }
  }
}

function removeById(id: number) {
  items.value = items.value.filter(it => it.id !== id)
}

function refresh() {
  fetchList({ reset: true })
}

defineExpose({ applyPatch, removeById, refresh })
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50" @keydown.esc="close">
      <!-- overlay + blur -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

      <div class="relative z-10 flex min-h-full items-start justify-center p-4">
        <div class="w-full max-w-3xl rounded-xl border border-white/10 bg-neutral-900/90 shadow-xl">
          <!-- header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <h3 class="text-lg font-semibold text-white">Liste des zones</h3>
            <span class="text-xs text-white/60">({{ count }})</span>

            <div class="ml-auto relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"/>
              <input
                  v-model.trim="q"
                  placeholder="Rechercher…"
                  type="search"
                  class="w-64 bg-white/5 border border-white/10 rounded-md pl-9 pr-3 py-1.5 text-sm text-white
                       placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <a href="#" @click.prevent="close"
               class="rounded-md p-1 text-white/70 hover:text-white hover:bg-white/5"
               aria-label="Fermer"><X class="h-5 w-5"/></a>
          </div>

          <!-- body -->
          <!-- body -->
          <div class="max-h-[65vh] overflow-y-auto">
            <div v-if="errorMsg" class="p-5 text-sm text-rose-300">{{ errorMsg }}</div>
            <div v-else-if="loading && items.length===0" class="p-5 text-sm text-white/70">Chargement…</div>
            <div v-else-if="!loading && items.length===0" class="p-5 text-sm text-white/60">Aucune zone.</div>

            <ul v-else class="divide-y divide-white/10">
              <li v-for="z in items" :key="z.id" class="px-5 py-4 hover:bg-white/5 transition">
                <div class="flex gap-4 items-start">
                  <!-- vignette top-aligned, largeur fixe, hauteur auto -->
                  <img
                      v-if="z.image_url"
                      :src="z.image_url"
                      class="w-28 h-auto max-h-28 object-cover rounded-md border border-white/10 shrink-0 self-start"
                      alt=""
                  />

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="font-semibold text-white break-words">{{ z.name }}</p>
                      <span class="text-[11px] rounded-full px-2 py-0.5 border border-white/10 bg-white/5 text-white/70">
                        Niv.{{ z.min_level }} à {{z.max_level}}
                      </span>
                    </div>

                    <!-- ✨ description complète, pas de clamp ; on garde les retours à la ligne -->
                    <p class="mt-1 text-sm text-white/70 whitespace-pre-line break-words">
                      {{ z.description || 'Pas de description disponible.' }}
                    </p>
                  </div>

                  <!-- actions alignées en haut -->
                  <div class="flex items-start gap-1 self-start">
                    <a href="#" @click.prevent="$emit('edit', z)"
                       class="rounded-md p-2 text-white/70 hover:text-white hover:bg-white/5" aria-label="Éditer">
                      <Pencil class="h-4 w-4"/>
                    </a>

                    <template v-if="confirming === z.id">
                      <a href="#" @click.prevent="removeZone(z.id)"
                         class="rounded-md px-2 py-1 text-xs bg-rose-600/80 text-white hover:bg-rose-600">Supprimer ?</a>
                      <a href="#" @click.prevent="confirming=null"
                         class="rounded-md px-2 py-1 text-xs text-white/80 hover:bg-white/5">Annuler</a>
                    </template>
                    <a v-else href="#" @click.prevent="confirming=z.id"
                       class="rounded-md p-2 text-white/70 hover:text-white hover:bg-white/5" aria-label="Supprimer">
                      <Trash2 class="h-4 w-4"/>
                    </a>
                  </div>
                </div>
              </li>
            </ul>

            <div v-if="hasMore" class="p-4 flex justify-center">
              <button
                  @click="fetchList()"
                  class="rounded-md bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5"
                  :disabled="loading">
                {{ loading ? 'Chargement…' : 'Charger plus' }}
              </button>
            </div>
          </div>


          <!-- footer -->
          <div class="px-5 py-3 border-t border-white/10 text-right">
            <button @click="close" class="rounded-md px-3 py-1.5 text-sm text-gray-200 hover:bg-white/5">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
