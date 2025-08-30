// src/useTeam.ts
import { ref, computed } from 'vue'
import axios from 'axios'

export type Character = {
    id: number
    name: string
    class_name?: string | null
    level: number
    portrait_url?: string | null
    type_id?: number | null
    equipment?: Record<string, any>
    spells?: any[]
}

const characters = ref<Character[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const index = ref(0)

const current = computed(() => characters.value[index.value] ?? null)

async function load(userId?: number | 'me') {
    loading.value = true
    error.value = null
    try {
        const url = userId ? `/api/team/${userId}` : '/api/team/me'
        const { data } = await axios.get(url)
        characters.value = Array.isArray(data) ? data : (data.data ?? [])
        index.value = 0
    } catch (e: any) {
        characters.value = []
        error.value = e?.response?.data?.message ?? e?.message ?? 'Erreur de chargement'
    } finally {
        loading.value = false
    }
}

function next() {
    if (characters.value.length === 0) return
    index.value = (index.value + 1) % characters.value.length
}
function prev() {
    if (characters.value.length === 0) return
    index.value = (index.value - 1 + characters.value.length) % characters.value.length
}

export default function useTeam() {
    return { characters, current, loading, error, load, next, prev, index }
}
