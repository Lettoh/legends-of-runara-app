<script setup lang="ts">
import { ref } from 'vue'
import { Eye, X, Pencil, Loader2, Trash2 } from 'lucide-vue-next'
import useToast from '@/useToast'
import spells, { type SpellRow } from '@/spells'
import SpellsEditModal from '@/components/Modals/SpellsEditModal.vue'
import SpellAttachToClassModal from '@/components/Modals/SpellAttachToClassModal.vue'
const toast = useToast()
const svc = spells()
const open = ref(false)
const loading = ref(false)
const items = ref<SpellRow[]>([])
const q = ref('')
const editOpen = ref(false)
const editTarget = ref<SpellRow|null>(null)
function openModal(){ open.value = true; fetchItems() }
function closeModal(){ open.value = false }
async function fetchItems(){
  try{ loading.value = true; const list = await svc.list({ q: q.value, with_effects: true, per_page: 50 }); items.value = Array.isArray(list) ? list : (list.data ?? []) }
  catch(e:any){ console.error(e); toast.error(e?.response?.data?.message || 'Erreur de chargement') }
  finally{ loading.value = false }
}
function onEdited(){ fetchItems() }
async function removeItem(spell: SpellRow){
  if (!confirm(`Supprimer le sort "${spell.name}" ?`)) return
  try{ await svc.destroy(spell.id); items.value = items.value.filter(x => x.id !== spell.id); toast.success('Supprimé') }
  catch(e:any){ toast.error(e?.response?.data?.message || 'Suppression impossible') }
}

const attachOpen = ref(false)
</script>
<template>
  <button @click="openModal" class="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10">
    <div class="flex items-center gap-3"><Eye class="h-5 w-5 text-indigo-400" /><div><p class="font-medium text-white">Voir les Sorts</p><p class="text-xs text-white/60">Lister, rechercher, éditer</p></div></div>
  </button>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-5xl rounded-xl border border-white/10 bg-zinc-900 text-white shadow-xl">
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-3"><h3 class="font-semibold">Sorts</h3><button @click="closeModal" class="rounded-md p-1 text-white/70 hover:bg-white/10"><X class="h-5 w-5"/></button></div>
      <div class="p-3"><div class="flex items-center gap-2"><input v-model="q" @keyup.enter="fetchItems" type="search" placeholder="Rechercher..." class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/><button @click="fetchItems" class="rounded-md bg-white/10 px-3 py-2 hover:bg-white/15">Rechercher</button></div></div>
      <div class="px-4 pb-4">
        <div v-if="loading" class="flex items-center gap-2 p-4 text-white/70"><Loader2 class="h-4 w-4 animate-spin"/> Chargement…</div>
        <div v-else class="overflow-x-auto rounded-lg border border-white/10">
          <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-white/5"><tr class="text-left"><th class="px-3 py-2">#</th><th class="px-3 py-2">Nom</th><th class="px-3 py-2">Cible</th><th class="px-3 py-2">Base</th><th class="px-3 py-2">STR</th><th class="px-3 py-2">POW</th><th class="px-3 py-2">Image</th><th class="px-3 py-2 w-28"></th></tr></thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="sp in items" :key="sp.id" class="hover:bg-white/5">
                <td class="px-3 py-2 text-white/70">{{ sp.id }}</td>
                <td class="px-3 py-2">{{ sp.name }}</td>
                <td class="px-3 py-2">{{ sp.target }}</td>
                <td class="px-3 py-2">{{ sp.base_power }}</td>
                <td class="px-3 py-2">{{ sp.scaling_str }}</td>
                <td class="px-3 py-2">{{ sp.scaling_pow }}</td>
                <td class="px-3 py-2"><img v-if="sp.image_url" :src="sp.image_url" alt="" class="h-8 w-8 rounded object-cover border border-white/10"/></td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2 justify-end">
                    <button @click="editTarget=sp; editOpen=true" class="rounded-md p-1 text-white/80 hover:bg-white/10">✏️</button>
                    <button @click="removeItem(sp)" class="rounded-md p-1 text-red-400 hover:bg-white/10">🗑️</button>
                    <button @click="attachOpen=true; editTarget=sp" class="rounded-md p-1 text-green-400 hover:bg-white/10">🔗</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="px-4 py-3 border-t border-white/10 flex justify-end"><button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="closeModal">Fermer</button></div>
    </div>
    <SpellsEditModal
        :open="editOpen"
        :spell="editTarget"
        @update:open="editOpen=$event"
        @close="editOpen=false"
        @updated="onEdited"
    />
    <SpellAttachToClassModal
        :open="attachOpen"
        :spell="editTarget"
        @update:open="attachOpen=$event"
        @close="attachOpen=false"
        @changed="fetchItems"
    />
  </div>
</template>
