<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Eye, X, Pencil, Link2, Loader2 } from 'lucide-vue-next'
import resources, { type ResourceRow } from "@/resource.ts";
import useToast from '@/useToast'
import ResourcesAttachToMonsterModal from '@/components/Modals/ResourcesAttachToMonsterModal.vue'
import ResourcesEditModal from '@/components/Modals/ResourcesEditModal.vue'

const toast = useToast()
const rsvc = resources()

const open = ref(false)
const loading = ref(false)
const items = ref<ResourceRow[]>([])
const q = ref('')

// upload icône
const fileInput = ref<HTMLInputElement|null>(null)
const current = ref<ResourceRow | null>(null)
const uploading = ref<Set<number>>(new Set())
function changeIcon(r: ResourceRow){ current.value = r; fileInput.value?.click() }
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file || !current.value) return
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
    toast.error('Formats acceptés: PNG, JPG, WEBP.'); return
  }
  const id = current.value.id
  uploading.value.add(id)
  try {
    const updated = await rsvc.updateResourceIcon(id, file)
    const row = items.value.find(x => x.id === id)
    if (row) {
      const url = updated.icon_url ?? row.icon_url
      row.icon_url = url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url
    }
    toast.success('Icône mise à jour.')
  } catch (e:any) {
    toast.error('Échec de la mise à jour de l’icône.')
  } finally {
    uploading.value.delete(id); current.value=null
  }
}

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return items.value
  return items.value.filter(r =>
      r.name.toLowerCase().includes(s) || (r.description ?? '').toLowerCase().includes(s)
  )
})

function openModal(){ open.value = true; load() }
function closeModal(){ open.value = false }

async function load(){
  loading.value = true
  try {
    items.value = await rsvc.listResources()
  } catch (e:any) {
    toast.error(e?.message ?? 'Erreur de chargement')
  } finally { loading.value = false }
}

// attach submodal
const attachOpen = ref(false)
const attachTarget = ref<ResourceRow | null>(null)
function openAttach(r: ResourceRow){ attachTarget.value = r; attachOpen.value = true }

// edit submodal
const editOpen = ref(false)
const editTarget = ref<ResourceRow | null>(null)
function openEdit(r: ResourceRow){ editTarget.value = r; editOpen.value = true }
function onEdited(r: ResourceRow){ const row = items.value.find(x => x.id === r.id); if (row) Object.assign(row, r); editOpen.value=false }

// ESC close
function onKey(e: KeyboardEvent){ if (e.key==='Escape' && open.value && !attachOpen.value && !editOpen.value) closeModal() }
onMounted(()=>window.addEventListener('keydown', onKey))
onBeforeUnmount(()=>window.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- bouton carte -->
  <button type="button" @click="openModal"
          class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-left hover:bg-white/10 transition">
    <div class="flex items-center gap-3">
      <Eye class="h-5 w-5 text-indigo-400"/>
      <div><p class="font-medium text-white">Liste des Ressources</p>
        <p class="text-xs text-white/60">Voir/éditer les ressources & les attacher aux monstres</p></div>
    </div>
  </button>

  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeModal">
    <div class="w-full max-w-5xl rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Ressources</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="closeModal"><X class="h-4 w-4"/></button>
      </div>

      <div class="px-4 py-3 flex items-center gap-2 border-b border-white/10">
        <div class="relative flex-1 max-w-sm">
          <input v-model.trim="q" type="search" placeholder="Rechercher une ressource…"
                 class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400/40"/>
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60">{{ loading ? '…' : filtered.length }}</span>
        </div>
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="load">Recharger</button>
      </div>

      <div class="p-4">
        <div v-if="loading" class="text-white/70 text-sm">Chargement…</div>
        <div v-else class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-white/60">
            <tr class="text-left">
              <th class="px-3 py-2 font-medium">Ressource</th>
              <th class="px-3 py-2 font-medium">Rareté / Trade</th>
              <th class="px-3 py-2 font-medium">Description</th>
              <th class="px-3 py-2 font-medium w-40">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
            <tr v-for="r in filtered" :key="r.id" class="hover:bg-white/5">
              <td class="px-3 py-2">
                <div class="flex items-center gap-3">
                  <div class="relative h-10 w-10 rounded-md overflow-hidden border border-white/10 bg-white/5 cursor-pointer" @click="changeIcon(r)">
                    <img v-if="r.icon_url" :src="r.icon_url" :alt="r.name" class="h-full w-full object-cover" />
                    <div v-if="uploading.has(r.id)" class="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 class="h-4 w-4 animate-spin text-white/90"/>
                    </div>
                  </div>
                  <div>
                    <p class="text-white font-medium leading-tight">{{ r.name }}</p>
                    <p class="text-xs text-white/60">ID {{ r.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 text-white/80">
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                      <span class="text-xs text-white/70 mr-1">Rang</span><span class="text-white font-medium">{{ r.rarity }}</span>
                    </span>
                  <span class="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5"
                        :class="r.tradeable ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/70'">
                      {{ r.tradeable ? 'Échangeable' : 'Non échangeable' }}
                    </span>
                </div>
              </td>
              <td class="px-3 py-2 text-white/80">
                <div class="max-w-md truncate" :title="r.description || '—'">{{ r.description || '—' }}</div>
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <button class="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-1.5 text-white hover:bg-white/10" @click="openEdit(r)" aria-label="Modifier">
                    <Pencil class="h-4 w-4"/>
                  </button>
                  <button class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10" @click="openAttach(r)">
                    <Link2 class="h-4 w-4"/> Attacher
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-white/10 flex justify-end">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="closeModal">Fermer</button>
      </div>
    </div>

    <ResourcesAttachToMonsterModal :open="attachOpen" :resource="attachTarget" @close="attachOpen=false" />
    <ResourcesEditModal :open="editOpen" :resource="editTarget" @close="editOpen=false" @updated="onEdited" />
  </div>

  <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFile"/>
</template>
