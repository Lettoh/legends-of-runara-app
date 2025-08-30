// useInventory.ts
import { ref, watch, onMounted, isRef, type Ref } from 'vue'
import axios from 'axios'

export type InvItem = {
    resource_id: number
    name: string
    icon_url?: string | null
    quantity: number
    rarity?: number
    tradeable?: boolean
    updated_at?: string
}

export function useInventory(userId: number | Ref<number | null>) {
    const idRef: Ref<number | null> = isRef(userId) ? (userId as Ref<number | null>) : ref(userId ?? null)

    const items   = ref<InvItem[]>([])
    const loading = ref(false)
    const error   = ref<string | null>(null)

    async function load() {
        if (!idRef.value) { items.value = []; return }
        loading.value = true
        error.value = null
        try {
            const { data } = await axios.get(`/api/inventory/${idRef.value}`, {
                headers: { Accept: 'application/json' },
            })
            const rows = (data?.data ?? []) as any[]
            items.value = rows.map(r => ({
                resource_id: r.resource_id,
                name:        r.name,
                icon_url:    r.icon_url,
                quantity:    r.quantity,
                rarity:      r.rarity,
                tradeable:   r.tradeable,
                updated_at:  r.updated_at,
            }))
        } catch (e: any) {
            error.value = e?.response?.data?.message || e?.message || 'Erreur'
        } finally {
            loading.value = false
        }
    }

    watch(idRef, () => load(), { immediate: true })

    onMounted(() => {
        // si immediate a déjà chargé, ça ne rechargera pas inutilement
        if (!items.value.length && !loading.value) load()
    })

    return { items, loading, error, reload: load }
}
