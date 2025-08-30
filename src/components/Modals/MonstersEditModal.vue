<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { X, Check, Loader2 } from 'lucide-vue-next'
import useToast from '@/useToast'
import monsters from '@/monsters'     // doit exposer updateMonster(monsterId, payload)
import zones from '@/zones'           // doit exposer updateZoneMonsterChance(zoneId, monsterId, chance)

type ZoneLink = { id:number; name:string; spawn_chance?: number }
type MonsterRow = {
  id:number; name:string; level:number; hp:number; atk:number; def:number;
  zones?: ZoneLink[];
}

const props = defineProps<{
  open: boolean
  monster: MonsterRow | null
}>()

const emit = defineEmits<{
  (e:'close'): void
  (e:'updated', m: MonsterRow): void
}>()

const toast = useToast()
const msvc = monsters()
const zsvc = zones()

// ------- Formulaire stats -------
const form = reactive({
  name: '',
  level: 1,
  hp: 1,
  atk: 0,
  def: 0,
})

const savingStats = ref(false)

// ------- Chances par zone -------
const zrows = ref<Array<{ id:number; name:string; chance:number }>>([])
const savingChance = ref<Record<number, boolean>>({}) // zoneId => loading

const title = computed(() => props.monster?.name ?? 'Monstre')

watch(
    () => [props.open, props.monster],
    ([isOpen, m]) => {
      if (!isOpen || !m) return

      // Stats
      form.name  = m.name ?? ''
      form.level = Number(m.level ?? 1)
      form.hp    = Number(m.hp ?? 1)
      form.atk   = Number(m.atk ?? 0)
      form.def   = Number(m.def ?? 0)

      // Zones (pour les chances)
      const zones = m.zones ?? []
      zrows.value = zones.map(z => ({
        id: z.id,
        name: z.name,
        chance: Number((z as any).spawn_chance ?? 100),
      }))
    },
    { immediate: true }
)

watch(
    () => props.monster?.zones,
    (zones) => {
      if (!props.open) return
      if (!zones) { zrows.value = []; return }
      zrows.value = zones.map(z => ({
        id: z.id,
        name: z.name,
        chance: Number((z as any).spawn_chance ?? 100),
      }))
    },
    { deep: true }
)

async function saveStats() {
  if (!props.monster) return
  savingStats.value = true
  try {
    const updated = await msvc.updateMonster(props.monster.id, {
      name: form.name,
      level: form.level,
      hp: form.hp,
      atk: form.atk,
      def: form.def,
    })
    // renvoyer à la liste pour rafraîchir la ligne
    emit('updated', updated)
    toast.success('Statistiques mises à jour.')
  } catch (e:any) {
    toast.error(e?.response?.data?.message ?? 'Échec de la mise à jour.')
  } finally {
    savingStats.value = false
  }
}

async function saveChance(row: {id:number; name:string; chance:number}) {
  if (!props.monster) return
  const zId = row.id
  savingChance.value[zId] = true
  try {
    await zsvc.updateZoneMonsterChance(zId, props.monster.id, row.chance)
    // reflect locally + remonter à la liste si besoin
    const m: MonsterRow = {
      ...(props.monster as MonsterRow),
      zones: (props.monster?.zones ?? []).map(z => ({ ...z }))
    }
    const z = (m.zones ?? []).find(zz => zz.id === zId)
    if (z) z.spawn_chance = row.chance

    emit('updated', m)
    toast.success(`Chance pour « ${row.name} » enregistrée (${row.chance}%).`)
  } catch (e:any) {
    toast.error(e?.response?.data?.message ?? 'Échec de l’enregistrement.')
  } finally {
    savingChance.value[zId] = false
  }
}

function close() { emit('close') }
</script>

<template>
  <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="close"
  >
    <div class="w-full max-w-3xl rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Éditer « {{ title }} »</h3>
        <button class="p-1 rounded-md hover:bg-white/10 text-white/70" @click="close" aria-label="Fermer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Contenu -->
      <div class="p-4 space-y-6">
        <!-- Stats -->
        <section>
          <h4 class="text-white font-medium mb-3">Statistiques</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm text-white/70 mb-1">Nom</label>
              <input v-model.trim="form.name" type="text"
                     class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
                            placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400/40" />
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">Niveau</label>
              <input v-model.number="form.level" type="number" min="1"
                     class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
                            outline-none focus:ring-2 focus:ring-indigo-400/40" />
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">HP</label>
              <input v-model.number="form.hp" type="number" min="1"
                     class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
                            outline-none focus:ring-2 focus:ring-indigo-400/40" />
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">ATK</label>
              <input v-model.number="form.atk" type="number" min="0"
                     class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
                            outline-none focus:ring-2 focus:ring-indigo-400/40" />
            </div>
            <div>
              <label class="block text-sm text-white/70 mb-1">DEF</label>
              <input v-model.number="form.def" type="number" min="0"
                     class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
                            outline-none focus:ring-2 focus:ring-indigo-400/40" />
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <button
                class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10 disabled:opacity-60"
                :disabled="savingStats"
                @click="saveStats"
            >
              <Loader2 v-if="savingStats" class="h-4 w-4 animate-spin" />
              <Check v-else class="h-4 w-4" />
              Enregistrer les stats
            </button>
          </div>
        </section>

        <!-- Chances par zone -->
        <section>
          <h4 class="text-white font-medium mb-3">Zones & chance d’apparition</h4>

          <div v-if="zrows.length === 0" class="text-sm text-white/60">
            Ce monstre n’est attaché à aucune zone.
          </div>

          <div v-else class="space-y-2">
            <div
                v-for="row in zrows"
                :key="row.id"
                class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <div class="min-w-0 flex-1">
                <p class="text-white font-medium truncate">{{ row.name }}</p>
              </div>
              <div class="flex items-center gap-2">
                <input
                    v-model.number="row.chance"
                    type="number" min="0" max="100" step="0.1"
                    class="w-24 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-white
                         outline-none focus:ring-2 focus:ring-indigo-400/40 text-right"
                />
                <span class="text-white/70 text-sm">%</span>

                <button
                    class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-white hover:bg-white/10 disabled:opacity-60"
                    :disabled="savingChance[row.id]"
                    @click="saveChance(row)"
                >
                  <Loader2 v-if="savingChance[row.id]" class="h-4 w-4 animate-spin" />
                  <Check v-else class="h-4 w-4" />
                  <span class="hidden sm:inline">Enregistrer</span>
                </button>
              </div>
            </div>
          </div>

          <p class="mt-2 text-xs text-white/50">
            Valeur entre 0 et 100. Ce pourcentage est propre à chaque zone et sert au tirage des rencontres.
          </p>
        </section>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-white/10 flex justify-end">
        <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10" @click="close">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>
