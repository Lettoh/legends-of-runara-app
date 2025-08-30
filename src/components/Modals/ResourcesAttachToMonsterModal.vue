<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { X, Loader2, Link2 } from 'lucide-vue-next'
import UiSelect from '@/components/ui/UiSelect.vue'
import resources from "@/resource.ts";
import monsters from '@/monsters'
import useToast from '@/useToast'

type ResourceLite = { id:number; name:string }

const props = defineProps<{ open:boolean; resource: ResourceLite | null }>()
const emit = defineEmits<{ (e:'close'):void; (e:'attached', payload:{ monster_id:number }):void }>()

const toast = useToast()
const rsvc = resources()
const msvc = monsters()

const monsterId = ref<number|null>(null)
const drop = ref<number>(100)
const minQty = ref<number>(1)
const maxQty = ref<number>(1)
const options = ref<Array<{id:number; name:string}>>([])
const loading = ref(false)

async function loadMonsters() {
  const list = await msvc.listMonsters()
  options.value = list.map((m:any) => ({ id: m.id, name: `${m.name} (Niv. ${m.level})` }))
  monsterId.value = null
}
watch(() => props.open, (v) => { if (v) loadMonsters() })

function onKey(e: KeyboardEvent){ if(e.key==='Escape' && props.open) emit('close') }
onMounted(()=>document.addEventListener('keydown', onKey))
onBeforeUnmount(()=>document.removeEventListener('keydown', onKey))

async function submit() {
  if (!props.resource || !monsterId.value) return
  if (maxQty.value < minQty.value) maxQty.value = minQty.value
  loading.value = true
  try {
    await rsvc.attachResourceToMonster(monsterId.value, props.resource.id, drop.value, minQty.value, maxQty.value)
    toast.success('Ressource attachée au monstre.')
    emit('attached', { monster_id: monsterId.value })
    emit('close')
  } catch (e:any) {
    toast.error(e?.response?.data?.message ?? 'Échec de l’attache.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Attacher « {{ resource?.name }} »</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="$emit('close')"><X class="h-4 w-4" /></button>
      </div>

      <div class="px-4 py-4 space-y-3">
        <label class="block text-sm text-white/70">Monstre</label>
        <UiSelect v-model="monsterId" :options="options" placeholder="Choisir un monstre…" />

        <div class="grid grid-cols-3 gap-3 pt-2">
          <div>
            <label class="block text-sm text-white/70 mb-1">Chance %</label>
            <input v-model.number="drop" type="number" min="0" max="100" step="0.1"
                   class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"/>
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-1">Min</label>
            <input v-model.number="minQty" type="number" min="1"
                   class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"/>
          </div>
          <div>
            <label class="block text-sm text-white/70 mb-1">Max</label>
            <input v-model.number="maxQty" type="number" min="1"
                   class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"/>
          </div>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="$emit('close')">Annuler</button>
        <button :disabled="!monsterId || loading" @click="submit"
                class="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-500/90 px-3 py-2 text-white disabled:opacity-60">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin"/> <Link2 v-else class="h-4 w-4"/> Attacher
        </button>
      </div>
    </div>
  </div>
</template>
