<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { PlusCircle, X } from 'lucide-vue-next'
import monsters from '@/monsters' // ← service api (voir plus bas)

// events vers le parent si besoin (pour rafraîchir une liste, etc.)
const emit = defineEmits<{ (e: 'created', monster: any): void }>()

/* ---------- état modal ---------- */
const open = ref(false)
function openModal() { open.value = true }
function closeModal() {
  open.value = false
  reset()
}

/* ---------- form ---------- */
const form = ref({
  name: '',
  level: 1,
  hp: 10,
  atk: 1,
  def: 0,
  image: null as File | null,
})

const loading = ref(false)
const errors = ref<Record<string, string[]>>({})
const previewUrl = computed(() => (form.value.image ? URL.createObjectURL(form.value.image) : null))

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  form.value.image = file
}

function reset() {
  errors.value = {}
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  form.value = { name: '', level: 1, hp: 10, atk: 1, def: 0, image: null }
}

/* ---------- submit ---------- */
async function submit() {
  loading.value = true
  errors.value = {}

  try {
    const fd = new FormData()
    fd.append('name', form.value.name.trim())
    fd.append('level', String(form.value.level))
    fd.append('hp', String(form.value.hp))
    fd.append('atk', String(form.value.atk))
    fd.append('def', String(form.value.def))
    if (form.value.image) fd.append('image', form.value.image)

    const { createMonster } = monsters()
    const res = await createMonster(fd) // { monster: {...} } attendu
    emit('created', res.monster ?? res)

    closeModal()
  } catch (e: any) {
    // erreurs de validation Laravel: { errors: { field: ["msg", ...] } }
    const ve = e?.response?.data?.errors
    if (ve) errors.value = ve
    else alert(e?.message ?? 'Erreur inconnue')
  } finally {
    loading.value = false
  }
}

/* ---------- ESC pour fermer ---------- */
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) closeModal()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- Bouton "carte" -->
  <button
      type="button"
      @click="openModal"
      class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-left
           hover:bg-white/10 transition"
  >
    <div class="flex items-center gap-3">
      <PlusCircle class="h-5 w-5 text-indigo-400" />
      <div>
        <p class="font-medium text-white">Ajouter un monstre</p>
        <p class="text-xs text-white/60">Créer un nouveau monstre (image optionnelle)</p>
      </div>
    </div>
  </button>

  <!-- Modal -->
  <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4
           bg-black/60 backdrop-blur-sm"
      @click.self="closeModal"
  >
    <div class="w-full max-w-lg rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
      <!-- header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-semibold">Ajouter un monstre</h3>
        <button
            type="button"
            class="p-1 rounded-md hover:bg-white/10 text-white/70"
            @click="closeModal"
            aria-label="Fermer"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- form -->
      <form class="px-4 py-4 space-y-4" @submit.prevent="submit">
        <!-- Nom -->
        <div>
          <label class="block text-sm text-white/80 mb-1">Nom *</label>
          <input
              v-model.trim="form.name"
              type="text"
              required
              class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
                   placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400/40"
              placeholder="Crocodile fou"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-rose-300">{{ errors.name[0] }}</p>
        </div>

        <!-- Ligne : level / hp -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-white/80 mb-1">Niveau *</label>
            <input
                v-model.number="form.level"
                type="number" min="1"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p v-if="errors.level" class="mt-1 text-xs text-rose-300">{{ errors.level[0] }}</p>
          </div>

          <div>
            <label class="block text-sm text-white/80 mb-1">HP *</label>
            <input
                v-model.number="form.hp"
                type="number" min="1"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p v-if="errors.hp" class="mt-1 text-xs text-rose-300">{{ errors.hp[0] }}</p>
          </div>
        </div>

        <!-- Ligne : atk / def -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-white/80 mb-1">ATK *</label>
            <input
                v-model.number="form.atk"
                type="number" min="0"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p v-if="errors.atk" class="mt-1 text-xs text-rose-300">{{ errors.atk[0] }}</p>
          </div>

          <div>
            <label class="block text-sm text-white/80 mb-1">DEF *</label>
            <input
                v-model.number="form.def"
                type="number" min="0"
                class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p v-if="errors.def" class="mt-1 text-xs text-rose-300">{{ errors.def[0] }}</p>
          </div>
        </div>

        <!-- Image -->
        <div>
          <label class="block text-sm text-white/80 mb-1">Image (png/jpg/webp) — optionnel</label>
          <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="block w-full text-sm file:mr-3 file:rounded-md file:border-0
                   file:bg-white/10 file:px-3 file:py-2 file:text-white
                   hover:file:bg-white/20 text-white/80"
              @change="onFile"
          />
          <p v-if="errors.image" class="mt-1 text-xs text-rose-300">{{ errors.image[0] }}</p>

          <div v-if="previewUrl" class="mt-3">
            <p class="text-xs text-white/60 mb-1">Aperçu :</p>
            <img :src="previewUrl" alt="" class="h-28 w-28 rounded-md object-cover border border-white/10">
          </div>
        </div>

        <!-- footer -->
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
              type="button"
              @click="closeModal"
              class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
          >
            Annuler
          </button>

          <button
              type="submit"
              :disabled="loading"
              class="rounded-lg bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-500/90 disabled:opacity-60"
          >
            {{ loading ? 'Création…' : 'Créer le monstre' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
