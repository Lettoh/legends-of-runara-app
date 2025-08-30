<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import zones from '@/zones'
import useToast from '@/useToast'
const { success, error: toastError } = useToast()


const { createZone } = zones()

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e:'update:open', v:boolean): void
  (e:'created', zone:any): void
}>()

const form = reactive({
  name: '',
  description: '',
  min_level: 1,
  max_level: 1,
  image: null as File | null,
})

const loading = ref(false)
const errors = reactive<Record<string, string[]>>({})
const imageUrl = ref<string | null>(null)

watch(() => form.image, f => {
  imageUrl.value = f ? URL.createObjectURL(f) : null
})

function close() { emit('update:open', false) }
function reset() {
  form.name = ''
  form.description = ''
  form.min_level = 1
  form.max_level = 1
  form.image = null
  imageUrl.value = null
  for (const k in errors) delete errors[k]
}

async function submit() {
  loading.value = true
  for (const k in errors) delete errors[k]

  try {
    const zone = await createZone({
      name: form.name,
      description: form.description || undefined,
      min_level: form.min_level,
      max_level: form.max_level,
      image: form.image,
    })
    success(`La zone « ${zone.name} » a été créée.`)  // ✅ toast succès
    emit('created', zone)

    close()
    reset()
  } catch (e: any) {
    if (e.response?.status === 422) {
      Object.assign(errors, e.response.data.errors ?? {})
      toastError('Échec de la création de la zone.')
    } else {
      errors.general = ['Une erreur est survenue.']
      toastError('Échec de la création de la zone.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50" @keydown.esc="close">
      <!-- overlay + blur -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

      <!-- panel -->
      <div class="relative z-10 flex min-h-full items-center justify-center p-4">
        <div class="w-full max-w-lg rounded-xl border border-white/10 bg-neutral-900/90 p-5 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">Ajouter une zone</h3>
            <button class="text-white/60 hover:text-white" @click="close" aria-label="Fermer">✕</button>
          </div>

          <!-- errors globales -->
          <p v-if="errors.general" class="mb-3 text-sm text-rose-300">{{ errors.general[0] }}</p>

          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-sm text-white/80 mb-1">Nom *</label>
              <input
                  v-model.trim="form.name"
                  required
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Dunes cendrées"
              />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-300">{{ errors.name[0] }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-white/80 mb-1">Niveau min *</label>
                <input
                    v-model.number="form.min_level"
                    type="number" min="1"
                    class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
             focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <p v-if="errors.min_level" class="mt-1 text-xs text-rose-300">{{ errors.min_level[0] }}</p>
              </div>

              <div>
                <label class="block text-sm text-white/80 mb-1">Niveau max *</label>
                <input
                    v-model.number="form.max_level"
                    type="number" min="1"
                    class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white
             focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <p v-if="errors.max_level" class="mt-1 text-xs text-rose-300">{{ errors.max_level[0] }}</p>
              </div>
            </div>

            <!-- Image (plein largeur, en dessous) -->
            <div>
              <label class="block text-sm text-white/80 mb-1">Image (png/jpg/webp)</label>
              <input
                  type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                  @change="(e:any)=>{ form.image = e.target.files?.[0] ?? null }"
                  class="block w-full text-sm text-white file:mr-3 file:rounded-md file:border-0
           file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/20"
              />
              <p v-if="errors.image" class="mt-1 text-xs text-rose-300">{{ errors.image[0] }}</p>
            </div>

            <div>
              <label class="block text-sm text-white/80 mb-1">Description</label>
              <textarea
                  v-model.trim="form.description"
                  rows="3"
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Courte description de la zone…"
              />
              <p v-if="errors.description" class="mt-1 text-xs text-rose-300">{{ errors.description[0] }}</p>
            </div>

            <div v-if="imageUrl" class="rounded-lg border border-white/10 bg-white/5 p-2">
              <img :src="imageUrl" alt="Prévisualisation" class="max-h-40 mx-auto rounded-md" />
            </div>

            <div class="mt-4 flex justify-end gap-2">
              <button type="button" @click="close"
                      class="rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
                Annuler
              </button>
              <button type="submit"
                      :disabled="loading"
                      class="rounded-lg px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 disabled:opacity-60">
                {{ loading ? 'Création…' : 'Créer la zone' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </teleport>
</template>
