<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {Plus, X, Loader2, ImagePlus, PlusCircle} from 'lucide-vue-next'
import resources from "@/resource.ts";
import useToast from '@/useToast'
import UiSelect from "@/components/ui/UiSelect.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";

const toast = useToast()
const rsvc = resources()

const open = ref(false)
const loading = ref(false)

const form = reactive({
  name: '',
  description: '',
  rarity: 1,
  tradeable: true,
  icon: null as File | null,
})

const rarityOptions = [
  { id: 1, name: 'Rang 1' },
  { id: 2, name: 'Rang 2' },
  { id: 3, name: 'Rang 3' },
  { id: 4, name: 'Rang 4' },
  { id: 5, name: 'Rang 5' },
]

const preview = ref<string | null>(null)

function pickFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
    toast.error('Formats acceptés: PNG, JPG, WEBP.')
    return
  }
  form.icon = file
  preview.value = URL.createObjectURL(file)
}

async function submit() {
  if (!form.name.trim()) return toast.error('Donne un nom à la ressource.')
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('name', form.name.trim())
    if (form.description) fd.append('description', form.description)
    fd.append('rarity', String(form.rarity))
    fd.append('tradeable', form.tradeable ? '1' : '0')
    if (form.icon) fd.append('icon', form.icon)
    await rsvc.createResource(fd)
    toast.success('Ressource créée.')
    reset()
    open.value = false
  } catch (e:any) {
    toast.error(e?.response?.data?.message ?? 'Échec de la création.')
  } finally {
    loading.value = false
  }
}
function reset() {
  form.name=''; form.description=''; form.rarity=1; form.tradeable=true; form.icon=null
  if (preview.value) URL.revokeObjectURL(preview.value); preview.value=null
}
</script>

<template>
  <!-- bouton carte -->
  <button
      type="button" @click="open=true"
      class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-left hover:bg-white/10 transition"
  >
    <div class="flex items-center gap-3">
      <PlusCircle class="h-5 w-5 text-indigo-400" />
      <div>
        <p class="font-medium text-white">Ajouter une ressource</p>
        <p class="text-xs text-white/60">Créer une nouvelle ressource (drop)</p>
      </div>
    </div>
  </button>

  <!-- modal -->
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="open=false">
    <div class="w-full max-w-lg rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Nouvelle ressource</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="open=false"><X class="h-4 w-4"/></button>
      </div>

      <div class="px-4 py-4 space-y-4">
        <div>
          <label class="block text-sm text-white/70 mb-1">Nom</label>
          <input v-model.trim="form.name" type="text"
                 class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-400/40" />
        </div>

        <div>
          <label class="block text-sm text-white/70 mb-1">Description</label>
          <textarea v-model.trim="form.description" rows="3"
                    class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-400/40" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm text-white/70 mb-1">Rareté</label>
            <UiSelect
                v-model="form.rarity"
                :options="rarityOptions"
                placeholder="Choisir un rang…"
            />
          </div>
          <div class="sm:col-span-2 flex items-center">
            <UiSwitch v-model="form.tradeable">
              Échangeable entre joueurs
            </UiSwitch>
          </div>
        </div>

        <div>
          <label class="block text-sm text-white/70 mb-1">Icône (png/jpg/webp)</label>
          <div class="flex items-center gap-3">
            <div class="h-14 w-14 rounded-md overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
              <img v-if="preview" :src="preview" class="h-full w-full object-cover" />
              <ImagePlus v-else class="h-5 w-5 text-white/40" />
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" @change="pickFile"
                   class="block w-full text-sm text-white/80 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/5 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/10"/>
          </div>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="open=false">Annuler</button>
        <button :disabled="loading" @click="submit"
                class="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-500/90 px-3 py-2 text-white disabled:opacity-60">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin"/> Créer
        </button>
      </div>
    </div>
  </div>
</template>
