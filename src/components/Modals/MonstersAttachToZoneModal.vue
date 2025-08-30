<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import UiSelect from '@/components/ui/UiSelect.vue'
import zones from '@/zones'
import useToast from '@/useToast'
import monsters from "@/monsters.ts";

type MonsterLite = { id:number; name:string; zones?: Array<{id:number; name:string}> }

const props = defineProps<{
  open: boolean
  monster: MonsterLite | null
}>()

const emit = defineEmits<{
  (e:'close'): void
  (e:'attached', zone: { id:number; name:string }): void
}>()

const toast = useToast()
const { listZonesForSelect } = zones()
const { attachMonsterToZone } = monsters()

const zoneId = ref<number | null>(null)
const chance = ref<number>(100)
const options = ref<Array<{ id:number; name:string }>>([])
const loading = ref(false)
const title = computed(() => props.monster ? `Attacher « ${props.monster.name} »` : 'Attacher')

/** charge les zones au moment de l’ouverture, et enlève celles déjà liées au monstre (utile) */
watch(() => props.open, async (v) => {
  if (!v) return
  try {
    const zs = await listZonesForSelect() // <= tableau [{id, name}]
    const already = new Set((props.monster?.zones ?? []).map(z => z.id))
    options.value = zs.filter(z => !already.has(z.id))
    zoneId.value = null
  } catch (e:any) {
    toast.error(e?.message ?? 'Impossible de charger les zones.')
  }
})

/** fermeture par ESC */
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && props.open) emit('close') }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

async function submit() {
  if (!zoneId.value || !props.monster) return
  loading.value = true
  try {
    await attachMonsterToZone(zoneId.value, props.monster.id, chance.value)
    const z = options.value.find(o => o.id === zoneId.value)
    if (z) emit('attached', { id: z.id, name: z.name })
    emit('close')
    toast.success('Monstre attaché à la zone.')
  } catch (e:any) {
    toast.error(e?.message ?? 'Échec de l’attache.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="$emit('close')"
  >
    <div class="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <!-- header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">{{ title }}</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="$emit('close')" aria-label="Fermer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- content -->
      <div class="px-4 py-4 space-y-3">
        <label class="block text-sm text-white/70">Zone</label>
        <UiSelect
            v-model="zoneId"
            :options="options"
            placeholder="Choisir une zone…"
        />

        <div>
          <label class="block text-sm text-white/80 mb-1">Chance d’apparition (%)</label>
          <input type="number" min="0" max="100" v-model.number="chance"
                 class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"/>
        </div>
      </div>

      <!-- footer -->
      <div class="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        <button
            class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
            @click="$emit('close')"
        >
          Annuler
        </button>
        <button
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-500/90
                 px-3 py-2 text-white disabled:opacity-50"
            :disabled="!zoneId || loading"
            @click="submit"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          Attacher
        </button>
      </div>
    </div>
  </div>
</template>
