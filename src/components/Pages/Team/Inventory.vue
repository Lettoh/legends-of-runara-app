<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import InventoryItem from './InventoryItem.vue'
import { ArrowDownAZ, ArrowDown10, Sparkles } from 'lucide-vue-next'

type InvRow = {
  resource_id: number
  name: string
  icon_url?: string | null
  quantity: number
  rarity?: number | null
  tradeable?: boolean
  updated_at?: string | null
}

const props = defineProps<{ userId?: number | null }>()

const loading = ref(false)
const error = ref<string | null>(null)
const all = ref<InvRow[]>([])

const q = ref('')
const sortKey = ref<'name' | 'qty' | 'rarity'>('name')

async function load(userId?: number | null) {
  if (!userId) {
    all.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    const { data } = await axios.get(`/api/inventory/${userId}`, {
      headers: { Accept: 'application/json' }
    })
    const arr = (data?.data ?? data ?? []) as any[]
    all.value = arr.map(r => ({
      resource_id: Number(r.resource_id),
      name: String(r.name),
      icon_url: r.icon_url ?? null,
      quantity: Number(r.quantity ?? r.qty ?? 0),
      rarity: r.rarity != null ? Number(r.rarity) : null,
      tradeable: !!r.tradeable,
      updated_at: r.updated_at ?? null,
    }))
  } catch (e:any) {
    error.value = e?.response?.data?.message ?? 'Impossible de charger l’inventaire.'
  } finally {
    loading.value = false
  }
}

watch(() => props.userId, (id) => load(id), { immediate: true })

const filtered = computed(() => {
  let arr = all.value
  const s = q.value.trim().toLowerCase()
  if (s) arr = arr.filter(i => i.name.toLowerCase().includes(s))
  switch (sortKey.value) {
    case 'qty':    arr = [...arr].sort((a,b) => (b.quantity||0) - (a.quantity||0)); break
    case 'rarity': arr = [...arr].sort((a,b) => (b.rarity||0) - (a.rarity||0)); break
    default:       arr = [...arr].sort((a,b) => a.name.localeCompare(b.name)); break
  }
  return arr
})

function setSort(k:'name'|'qty'|'rarity'){ sortKey.value = k }
</script>

<template>
  <!-- overflow-x hidden local -->
  <div class="space-y-3">
    <!-- bandeau sticky -->
    <div class="sticky -m-4 mb-0 bg-neutral-900/80 backdrop-blur border-b border-white/10 top-0 p-3 z-10">
      <div class="items-center gap-2">
        <input
            v-model="q"
            type="search"
            placeholder="Rechercher une ressource…"
            class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white
                 placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400/40"
        />

        <div class="flex items-center gap-1 mt-3">
          <button
              class="rounded-md border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
              :class="sortKey === 'name' ? 'ring-2 ring-indigo-400/40' : ''"
              @click="setSort('name')"
              title="Trier par nom"
          >
            <ArrowDownAZ class="h-4 w-4" />
          </button>
          <button
              class="rounded-md border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
              :class="sortKey === 'qty' ? 'ring-2 ring-indigo-400/40' : ''"
              @click="setSort('qty')"
              title="Trier par quantité"
          >
            <ArrowDown10 class="h-4 w-4" />
          </button>
          <button
              class="rounded-md border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
              :class="sortKey === 'rarity' ? 'ring-2 ring-indigo-400/40' : ''"
              @click="setSort('rarity')"
              title="Trier par rareté"
          >
            <Sparkles class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-white/70 text-sm p-2">Chargement…</div>
    <div v-else-if="error" class="text-rose-300 text-sm p-2">{{ error }}</div>
    <div v-else-if="!filtered.length" class="text-white/60 text-sm p-2">Inventaire vide.</div>

    <!-- grille 3 colonnes -->
    <div v-else class="grid grid-cols-3 gap-3 mt-4">
      <InventoryItem
          v-for="it in filtered"
          :key="it.resource_id"
          :item="{
          resource_id: it.resource_id,
          name: it.name,
          icon_url: it.icon_url,
          quantity: it.quantity,
          rarity: it.rarity ?? 1
        }"
      />
    </div>
  </div>
</template>

<!-- Global: tue la barre horizontale de la page -->
<style>
html, body, #app { overflow-x: hidden; }
</style>
