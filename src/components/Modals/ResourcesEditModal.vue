<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { X, Loader2, Check } from 'lucide-vue-next'
import resources, { type ResourceRow } from "@/resource.ts";
import useToast from '@/useToast'

const props = defineProps<{ open:boolean, resource: ResourceRow | null }>()
const emit = defineEmits<{ (e:'close'):void; (e:'updated', r:ResourceRow):void }>()

const toast = useToast()
const rsvc = resources()

const form = reactive({ name:'', description:'', rarity:1, tradeable:true })
const saving = ref(false)

watch(() => props.resource, (r) => {
  if (!r) return
  form.name = r.name
  form.description = r.description ?? ''
  form.rarity = r.rarity
  form.tradeable = !!r.tradeable
}, { immediate:true })

async function save() {
  if (!props.resource) return
  saving.value = true
  try {
    const updated = await rsvc.updateResource(props.resource.id, {
      name: form.name,
      description: form.description,
      rarity: form.rarity,
      tradeable: form.tradeable,
    })
    toast.success('Ressource mise à jour.')
    emit('updated', updated)
  } catch (e:any) {
    toast.error(e?.response?.data?.message ?? 'Échec de la mise à jour.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="w-full max-w-lg rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Éditer « {{ resource?.name }} »</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="$emit('close')"><X class="h-4 w-4"/></button>
      </div>

      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm text-white/70 mb-1">Nom</label>
          <input v-model.trim="form.name" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"/>
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-1">Description</label>
          <textarea v-model.trim="form.description" rows="3" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"/>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm text-white/70 mb-1">Rareté</label>
            <select v-model.number="form.rarity" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
              <option v-for="n in 5" :key="n" :value="n">Rang {{ n }}</option>
            </select>
          </div>
          <div class="sm:col-span-2 flex items-center gap-2">
            <input id="trade2" type="checkbox" v-model="form.tradeable" class="h-4 w-4 rounded border-white/20 bg-white/10"/>
            <label for="trade2" class="text-sm text-white/80">Échangeable entre joueurs</label>
          </div>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="$emit('close')">Fermer</button>
        <button :disabled="saving" @click="save" class="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-500/90 px-3 py-2 text-white disabled:opacity-60">
          <Loader2 v-if="saving" class="h-4 w-4 animate-spin"/><Check v-else class="h-4 w-4"/> Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>
