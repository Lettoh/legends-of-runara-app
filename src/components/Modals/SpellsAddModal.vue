<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PlusCircle, X, Loader2, Check, ImagePlus, Trash2 } from 'lucide-vue-next'
import useToast from '@/useToast'
import spells, { type SpellCreatePayload, type SpellEffect } from '@/spells'

const { success, error: toastError } = useToast()
const svc = spells()

const open = ref(false)
const loading = ref(false)

const form = reactive<SpellCreatePayload>({
  name: '', image: null, image_file: undefined, description:'',
  target:'enemy_single', base_power:0, scaling_str:0, scaling_pow:0,
  cooldown_turns:0, effects:[]
})
const fileInput = ref<HTMLInputElement|null>(null)
function chooseFile(){ fileInput.value?.click() }
function onFile(e: Event){ const el = e.target as HTMLInputElement; const f = el.files?.[0] || null; if (f) form.image_file = f }
function removeFile(){ form.image_file = undefined; if (fileInput.value) fileInput.value.value='' }
function reset(){ form.name=''; form.image=null; form.image_file=undefined; form.description=''; form.target='enemy_single'; form.base_power=0; form.scaling_str=0; form.scaling_pow=0; form.cooldown_turns=0; form.effects=[] }
function close(){ open.value=false; reset() }
function openModal(){ open.value=true }
function addEffect(){ (form.effects as SpellEffect[]).push({ kind:'damage', mode:'percent', value:30, vs:null, duration_turns:1, chance:100 }) }
function removeEffect(i:number){ (form.effects as SpellEffect[]).splice(i,1) }
async function save(){
  try{
    loading.value=true
    const created = await svc.create({ ...form })
    success('Sort créé')
    close()
    emit('created', created?.data ?? created)
  }catch(e:any){
    console.error(e); toastError(e?.response?.data?.message || 'Erreur lors de la création')
  }finally{ loading.value=false }
}
const emit = defineEmits<{(e:'created', spell:any):void}>()
</script>

<template>
  <button @click="openModal" class="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10">
    <div class="flex items-center gap-3">
      <PlusCircle class="h-5 w-5 text-indigo-400" />
      <div>
        <p class="font-medium text-white">Ajouter un Sort</p>
        <p class="text-xs text-white/60">Créer un nouveau sort</p>
      </div>
    </div>
  </button>

  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-3xl rounded-xl border border-white/10 bg-zinc-900 text-white shadow-xl">
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 class="font-semibold">Nouveau Sort</h3>
        <button @click="close" class="rounded-md p-1 text-white/70 hover:bg-white/10"><X class="h-5 w-5"/></button>
      </div>

      <div class="grid gap-4 p-4 md:grid-cols-2">
        <div class="space-y-3">
          <label class="block text-sm text-white/70">Nom</label>
          <input v-model="form.name" type="text" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/>
        </div>
        <div class="space-y-3">
          <label class="block text-sm text-white/70">Cible</label>
          <select v-model="form.target" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2">
            <option value="enemy_single">Ennemi (mono)</option>
            <option value="enemy_all">Ennemis (AoE)</option>
            <option value="ally_single">Allié (mono)</option>
            <option value="ally_all">Alliés (AoE)</option>
            <option value="self">Soi</option>
          </select>
        </div>
        <div class="space-y-3">
          <label class="block text-sm text-white/70">Puissance de base</label>
          <input v-model.number="form.base_power" type="number" min="0" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/>
        </div>
        <div class="space-y-3">
          <label class="block text-sm text-white/70">Cooldown (tours)</label>
          <input v-model.number="form.cooldown_turns" type="number" min="0" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/>
        </div>
        <div class="space-y-3">
          <label class="block text-sm text-white/70">Scaling STR</label>
          <input v-model.number="form.scaling_str" type="number" step="0.001" min="0" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/>
        </div>
        <div class="space-y-3">
          <label class="block text-sm text-white/70">Scaling POW</label>
          <input v-model.number="form.scaling_pow" type="number" step="0.001" min="0" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/>
        </div>
        <div class="md:col-span-2 space-y-3">
          <label class="block text-sm text-white/70">Description</label>
          <textarea v-model="form.description" rows="3" class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"></textarea>
        </div>
        <div class="md:col-span-2 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm text-white/70">Image</label>
            <div class="flex gap-2">
              <button @click="chooseFile" class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 text-sm"><i class="i"></i><ImagePlus class="h-4 w-4"/> Choisir un fichier</button>
              <button v-if="form.image_file" @click="removeFile" class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 text-sm"><Trash2 class="h-4 w-4"/> Retirer</button>
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFile"/>
          <p class="text-xs text-white/50">Ou indique un chemin/URL direct.</p>
          <input v-model="(form.image as any)" type="text" placeholder="/storage/spells/..." class="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2"/>
        </div>
        <div class="md:col-span-2">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm text-white/70">Effets</label>
            <button @click="addEffect" class="text-indigo-400 hover:text-indigo-300 text-sm">+ Ajouter un effet</button>
          </div>
          <div v-if="form.effects && form.effects.length" class="space-y-3">
            <div v-for="(ef,i) in form.effects" :key="i" class="rounded-lg border border-white/10 bg-white/5 p-3 grid grid-cols-2 md:grid-cols-6 gap-2">
              <select v-model="ef.kind" class="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-sm">
                <option value="defense">DEF ±%</option>
                <option value="damage">DMG ±%</option>
                <option value="elemental_weakness">Weakness</option>
                <option value="stun">Stun</option>
                <option value="shield">Shield</option>
                <option value="dot">DoT</option>
              </select>
              <select v-model="ef.mode" class="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-sm">
                <option value="percent">%</option>
                <option value="flat">Flat</option>
              </select>
              <input v-model.number="ef.value" type="number" placeholder="valeur" class="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-sm"/>
              <select v-model="(ef.vs as any)" class="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-sm">
                <option :value="null">—</option>
                <option value="strength">Strength</option>
                <option value="power">Power</option>
              </select>
              <input v-model.number="ef.duration_turns" type="number" min="0" placeholder="durée" class="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-sm"/>
              <input v-model.number="ef.chance" type="number" min="0" max="100" placeholder="chance %" class="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-sm"/>
            </div>
          </div>
          <p v-else class="text-xs text-white/50">Aucun effet pour l’instant.</p>
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="close">Fermer</button>
        <button :disabled="loading" @click="save" class="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-500/90 disabled:opacity-60">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin"/><Check v-else class="h-4 w-4"/> Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>
