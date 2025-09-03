<script setup lang="ts">
import { ref } from 'vue'
import { X, Loader2, Check } from 'lucide-vue-next'
import useToast from '@/useToast'
import characterTypes, { type CharacterTypeRow } from '@/characterTypes'
import { type SpellRow } from '@/spells'

const toast = useToast()
const cts = characterTypes()

const props = defineProps<{ open: boolean; spell: SpellRow | null }>()
const emit = defineEmits<{(e:'update:open', v:boolean):void; (e:'close'):void; (e:'changed'):void}>()

const types = ref<CharacterTypeRow[]>([])
const selectedTypeId = ref<number | null>(null)
const unlockLevel = ref<number>(1)
const requiredSpec = ref<string>('')

const loading = ref(false)
const saving  = ref(false)

async function ensureTypes() {
  if (types.value.length) return
  try {
    loading.value = true
    types.value = await cts.list()
    if (!selectedTypeId.value && types.value.length) selectedTypeId.value = types.value[0].id
  } catch (e:any) {
    console.error(e)
    toast.error(e?.response?.data?.message || 'Impossible de charger les classes')
  } finally {
    loading.value = false
  }
}

function close(){ emit('update:open', false); emit('close') }

async function attach() {
  if (!props.spell || !selectedTypeId.value) return
  try {
    saving.value = true
    await cts.attachSpell(selectedTypeId.value, props.spell.id, {
      unlock_level: Math.max(1, Number(unlockLevel.value || 1)),
      required_specialization: requiredSpec.value?.trim() || null,
    })
    toast.success('Sort attaché à la classe')
    emit('changed')
    close()
  } catch (e:any) {
    console.error(e)
    toast.error(e?.response?.data?.message || 'Échec de l’attache')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="props.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @vue:mounted="ensureTypes()">
    <div class="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-900 text-white shadow-xl">
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 class="font-semibold">Attacher à une classe</h3>
        <button @click="close" class="rounded-md p-1 text-white/70 hover:bg-white/10"><X class="h-5 w-5"/></button>
      </div>

      <div class="space-y-4 p-4">
        <div class="space-y-1">
          <label class="text-sm text-white/70">Classe</label>
          <select v-model.number="selectedTypeId" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2" @focus="ensureTypes()">
            <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <div v-if="loading" class="flex items-center gap-2 text-white/70 text-sm mt-1">
            <Loader2 class="h-4 w-4 animate-spin"/> Chargement…
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-white/70">Niveau de déblocage</label>
            <input type="number" min="1" v-model.number="unlockLevel" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm text-white/70">Spécialisation requise (optionnel)</label>
            <input type="text" v-model="requiredSpec" placeholder="ex: 'berserker'…" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2" />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="close">Annuler</button>
        <button :disabled="saving" @click="attach" class="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-500/90 disabled:opacity-60">
          <Loader2 v-if="saving" class="h-4 w-4 animate-spin"/><Check v-else class="h-4 w-4"/> Attacher
        </button>
      </div>
    </div>
  </div>
</template>
