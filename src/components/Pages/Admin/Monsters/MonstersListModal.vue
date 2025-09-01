<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Eye, X, Link2, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import monsters, { type MonsterRow } from '@/monsters'
import useToast from '@/useToast'
import MonstersAttachToZoneModal from "@/components/Modals/MonstersAttachToZoneModal.vue";
import MonstersEditModal from "@/components/Modals/MonstersEditModal.vue";

const toast = useToast()
const { listMonsters, detachMonsterFromZone, updateMonsterImage, deleteMonster } = monsters()

// --- État upload image ---
const fileInput = ref<HTMLInputElement | null>(null)   // input caché
const currentForUpload = ref<MonsterRow | null>(null)  // ligne courante
const uploadingIds = ref<Set<number>>(new Set())       // ids en cours d’upload

function pickImage(m: MonsterRow) {
  currentForUpload.value = m
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file || !currentForUpload.value) return

  const okTypes = ['image/png','image/jpeg','image/webp']
  if (!okTypes.includes(file.type)) {
    toast.error('Format non supporté. Utilise PNG, JPG ou WEBP.')
    return
  }

  const m = currentForUpload.value
  uploadingIds.value.add(m.id)
  try {
    const updated = await updateMonsterImage(m.id, file)
    const url = (updated.image_url || m.image_url) as string
    m.image_url = url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url // cache-bust
    toast.success(`Image de « ${m.name} » mise à jour.`)
  } catch (err:any) {
    toast.error('Échec de la mise à jour de l’image.')
  } finally {
    uploadingIds.value.delete(m.id)
    currentForUpload.value = null
  }
}

function isUploading(id:number) {
  return uploadingIds.value.has(id)
}

const open = ref(false)
const loading = ref(false)
const items = ref<MonsterRow[]>([])
const q = ref('')

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return items.value
  return items.value.filter(m =>
      m.name.toLowerCase().includes(s) ||
      String(m.level).includes(s)
  )
})

  function openModal() { open.value = true; load() }
  function closeModal() { open.value = false }

  async function load() {
    loading.value = true
    try {
      items.value = await listMonsters()
    } catch (e:any) {
      toast.error(e?.message ?? 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  /** Detach chip */
  async function detach(monster: MonsterRow, zoneId: number) {
    try {
      await detachMonsterFromZone(monster.id, zoneId)
      monster.zones = (monster.zones ?? []).filter(z => z.id !== zoneId)
      toast.info(`Monstre « ${monster.name} » détaché de la zone.`)
    } catch (e:any) {
      toast.error('Impossible de détacher le monstre de la zone.')
    }
  }

  /* ----- Attach sub-modal ----- */
  const attachOpen = ref(false)
  const attachTarget = ref<MonsterRow | null>(null)

  function openAttach(m: MonsterRow) {
    attachTarget.value = m
    attachOpen.value = true
  }
function onAttached(zone: { id:number; name:string }) {
  if (!attachTarget.value) return
  const zlist = attachTarget.value.zones ?? []
  if (!zlist.find(z => z.id === zone.id)) {
    zlist.push({ ...zone, spawn_chance: 100 })
  }

  // réassignation pour bien notifier Vue si nécessaire
  attachTarget.value.zones = [...zlist]
  toast.success(`« ${attachTarget.value.name} » attaché à ${zone.name}.`)
  attachOpen.value = false
}

/* ----- Edit modal ----- */
  const editOpen = ref(false)
  const editTarget = ref<MonsterRow | null>(null)
  function openEdit(m: MonsterRow) {
    editTarget.value = m
    editOpen.value = true
  }
  function onEdited(updated: MonsterRow) {
    const row = items.value.find(x => x.id === updated.id)
    if (row) Object.assign(row, updated) // MAJ en place
    editOpen.value = false
  }

  const deletingIds = ref<Set<number>>(new Set())
  async function del(m: MonsterRow) {
    const ok = confirm(`Supprimer « ${m.name} » ?`)
    if (!ok) return
    deletingIds.value.add(m.id)
    try {
      await deleteMonster(m.id)
      // retire la ligne localement
      items.value = items.value.filter(x => x.id !== m.id)
      toast.success('Monstre supprimé.')
    } catch (e:any) {
      toast.error(e?.response?.data?.message ?? 'Échec de la suppression.')
    } finally {
      deletingIds.value.delete(m.id)
    }
  }

  /* ESC to close parent modal */
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open.value && !attachOpen.value) closeModal()
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- Bouton carte pour ouvrir -->
  <button
      type="button"
      @click="openModal"
      class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-left hover:bg-white/10 transition"
  >
    <div class="flex items-center gap-3">
      <Eye class="h-5 w-5 text-indigo-400" />
      <div>
        <p class="font-medium text-white">Liste des Monstres</p>
        <p class="text-xs text-white/60">Voir la liste des monstres et leurs zones</p>
      </div>
    </div>
  </button>

  <!-- Modal liste -->
  <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="closeModal"
  >
    <div class="w-full max-w-7xl rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <!-- header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Monstres</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="closeModal" aria-label="Fermer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- barre outils -->
      <div class="px-4 py-3 flex items-center gap-2 border-b border-white/10">
        <div class="relative flex-1 max-w-sm">
          <input
              v-model.trim="q"
              type="search"
              placeholder="Rechercher un monstre…"
              class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white
                   placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400/40"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60">
            {{ loading ? '…' : filtered.length }}
          </span>
        </div>
        <button
            class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
            @click="load"
        >
          Recharger
        </button>
      </div>

      <!-- contenu -->
      <div class="p-4">
        <div v-if="loading" class="text-white/70 text-sm">Chargement…</div>
        <div v-else class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-white/60">
            <tr class="text-left">
              <th class="px-3 py-2 font-medium">Monstre</th>
              <th class="px-3 py-2 font-medium">Stats</th>
              <th class="px-3 py-2 font-medium">Butin</th>
              <th class="px-3 py-2 font-medium">Zones</th>
              <th class="px-3 py-2 font-medium w-36">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
            <tr v-for="m in filtered" :key="m.id" class="hover:bg-white/5">
              <!-- monstre -->
              <td class="px-3 py-2">
                <div class="flex items-center gap-3">
                  <img
                      :src="m.image_url || '/storage/monsters/default-monster.png'"
                      :alt="m.name"
                      @click="pickImage(m)"
                      class="h-10 w-10 rounded-md object-cover border border-white/10 cursor-pointer"
                  />
                  <div>
                    <p class="text-white font-medium leading-tight">{{ m.name }}</p>
                    <p class="text-xs text-white/60">Niveau {{ m.level }}</p>
                  </div>
                </div>
              </td>

              <!-- stats -->
              <td class="px-3 py-2 text-white/80">
                <div class="gap-x-4 gap-y-1">
                  <span>HP <span class="text-white">{{ m.hp }}</span><br></span>
                  <span>ATK <span class="text-white">{{ m.atk }}</span><br></span>
                  <span>DEF <span class="text-white">{{ m.def }}</span><br></span>
                </div>
              </td>

              <!-- butin -->
              <td class="px-3 py-2 align-top">
                <div v-if="m.drops?.length" class="space-y-1">
                  <div
                      v-for="d in m.drops"
                      :key="d.id"
                      class="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5"
                  >
                    <img v-if="d.icon_url" :src="d.icon_url" alt="" class="h-4 w-4 object-contain rounded" />
                    <span class="min-w-0 truncate text-white">{{ d.name }}</span>
                    <span class="ml-auto text-xs text-white/70">
                      ({{ d.chance }}%) ×{{ d.min_qty }}–{{ d.max_qty }}
                    </span>
                  </div>
                </div>
                <span v-else class="text-xs text-white/50">—</span>
              </td>

              <!-- zones (chips détachables) -->
              <td class="px-3 py-2">
                <div class="flex flex-wrap gap-2">
                  <template v-if="m.zones?.length">
                      <span
                          v-for="z in m.zones"
                          :key="z.id"
                          class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80"
                          title="Cliquer pour détacher"
                      >
                        {{ z.name }}
                        <span class="px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">{{ z.spawn_chance ?? 100 }}%</span>
                          <X class="h-3 w-3 text-white/60 cursor-pointer" @click.prevent="detach(m, z.id)"/>
                      </span>
                  </template>
                  <span v-else class="text-xs text-white/50">—</span>
                </div>
              </td>

              <!-- actions -->
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <button
                      class="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-1.5 text-white hover:bg-white/10"
                      @click="openEdit(m)"
                      aria-label="Modifier"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                      class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10"
                      @click="openAttach(m)"
                  >
                    <Link2 class="h-4 w-4" /> Attacher
                  </button>
                  <button
                      class="inline-flex items-center justify-center rounded-md border border-rose-600/40 bg-rose-600/20 p-1.5 text-rose-300 hover:bg-rose-600/30 disabled:opacity-60"
                      :disabled="deletingIds.has(m.id)"
                      @click="del(m)"
                      aria-label="Supprimer"
                      title="Supprimer"
                  >
                    <Loader2 v-if="deletingIds.has(m.id)" class="h-4 w-4 animate-spin" />
                    <Trash2 v-else class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- footer -->
      <div class="px-4 py-3 border-t border-white/10 flex justify-end">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="closeModal">
          Fermer
        </button>
      </div>
    </div>

    <!--  Sous-modal: modifier un monstre  -->
    <MonstersEditModal
        :open="editOpen"
        :monster="editTarget"
        @close="editOpen = false"
        @updated="onEdited"
    />

    <!-- Sous-modal: attacher à une zone -->
    <MonstersAttachToZoneModal
        :open="attachOpen"
        :monster="attachTarget"
        @close="attachOpen = false"
        @attached="onAttached"
    />
  </div>

  <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      @change="onFileChange"
  />
</template>

<style scoped>

</style>