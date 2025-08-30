<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import zones from '@/zones'               // service API (updateZone)
import useToast from '@/useToast'

type Zone = {
  id: number
  name: string
  description?: string | null
  min_level: number
  max_level: number
  image?: string | null
  image_url?: string | null
}

const props = defineProps<{
  open: boolean
  zone: Zone | null
}>()

const emit = defineEmits<{
  (e:'update:open', v:boolean): void
  (e:'updated', zone:any): void
}>()

const { updateZone } = zones()
const { success, error: toastError } = useToast()

const form = reactive({
  name: '',
  description: '' as string | '',
  min_level: 1,
  max_level: 1,
  image: null as File | null,
})

const loading = ref(false)
const errors  = reactive<Record<string, string[]>>({})
const imageUrl = ref<string | null>(null)     // preview de la nouvelle image
const currentImage = ref<string | null>(null) // image existante de la zone
const MAX_KB = 2048

// --- compression front (si > 2 Mo)
async function compressImage(
    file: File,
    { maxWidth = 1536, maxHeight = 1536, quality = 0.82, type = 'image/webp' } = {}
): Promise<File> {
  const bmp = await createImageBitmap(file)
  const ratio = Math.min(maxWidth / bmp.width, maxHeight / bmp.height, 1)
  const w = Math.round(bmp.width * ratio), h = Math.round(bmp.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0, w, h)
  const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), type, quality)!)
  const name = file.name.replace(/\.\w+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg')
  return new File([blob], name, { type, lastModified: Date.now() })
}

async function onFileChange(e: any) {
  const f: File | undefined = e.target.files?.[0]
  if (!f) { form.image = null; imageUrl.value = null; return }
  let file = f
  if (file.size / 1024 > MAX_KB) {
    file = await compressImage(file)
  }
  form.image = file
  imageUrl.value = URL.createObjectURL(file)
}

function fillFromZone(z: Zone | null) {
  for (const k in errors) delete errors[k]
  form.name = z?.name ?? ''
  form.description = (z?.description ?? '') as string
  form.min_level = z?.min_level ?? 1
  form.max_level = z?.max_level ?? 1
  form.image = null
  imageUrl.value = null
  currentImage.value = z?.image_url ?? null
}

watch(() => props.zone, (z) => { if (props.open) fillFromZone(z || null) }, { immediate: true })
watch(() => props.open, (v) => { if (v) fillFromZone(props.zone || null) })

function close(){ emit('update:open', false) }

async function submit() {
  console.log('submit called', props.zone?.id, typeof updateZone) // ← doit afficher "function"
  if (!props.zone) return
  loading.value = true
  for (const k in errors) delete errors[k]

  try {
    const updated = await updateZone(props.zone.id, {
      name: form.name,
      description: form.description,
      min_level: form.min_level,
      max_level: form.max_level,
      image: form.image ?? undefined, // envoie seulement si changée
    })
    success(`La zone « ${updated.name} » a été mise à jour.`)
    emit('updated', updated)
    close()
  } catch (e: any) {
    if (e.response?.status === 422) {
      Object.assign(errors, e.response.data.errors ?? {})
    } else {
      toastError('Échec de la mise à jour de la zone.')
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
            <h3 class="text-lg font-semibold text-white">Éditer la zone</h3>
            <a href="#" @click.prevent="close"
               class="rounded-md p-1 text-white/70 hover:text-white hover:bg-white/5" aria-label="Fermer">
              <X class="h-5 w-5"/>
            </a>
          </div>

          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-sm text-white/80 mb-1">Nom *</label>
              <input
                  v-model.trim="form.name"
                  required
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-white/40
                       focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Nom de la zone"
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

            <!-- Image (en dessous) -->
            <div>
              <label class="block text-sm text-white/80 mb-1">Image (png/jpg/webp)</label>
              <input
                  type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                  @change="onFileChange"
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
                  class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-white/40
                       focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Description de la zone…"
              />
              <p v-if="errors.description" class="mt-1 text-xs text-rose-300">{{ errors.description[0] }}</p>
            </div>

            <!-- previews -->
            <div class="grid grid-cols-2 gap-3" v-if="currentImage || imageUrl">
              <div v-if="currentImage" class="rounded-lg border border-white/10 bg-white/5 p-2">
                <p class="text-xs text-white/60 mb-1">Image actuelle</p>
                <img :src="currentImage" alt="Image actuelle" class="max-h-40 mx-auto rounded-md" />
              </div>
              <div v-if="imageUrl" class="rounded-lg border border-white/10 bg-white/5 p-2">
                <p class="text-xs text-white/60 mb-1">Nouvelle image</p>
                <img :src="imageUrl" alt="Prévisualisation" class="max-h-40 mx-auto rounded-md" />
              </div>
            </div>

            <div class="mt-4 flex justify-end gap-2">
              <button type="button" @click="close"
                      class="rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
                Annuler
              </button>
              <button type="submit" :disabled="loading"
                      class="rounded-lg px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20
                       disabled:opacity-60">
                {{ loading ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </teleport>
</template>
