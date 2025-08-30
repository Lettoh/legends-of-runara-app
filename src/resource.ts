// src/resources.ts
import axios from 'axios'

export type ResourceLite = { id:number; name:string }
export type ResourceRow = {
    id:number; name:string; description?:string|null;
    icon_url?: string|null;
    rarity:number;
    tradeable:boolean;
}

export default function resources() {
    return {
        async listResources(): Promise<ResourceRow[]> {
            const { data } = await axios.get('/api/resources')
            return Array.isArray(data) ? data : (data.data ?? [])
        },
        async listResourcesForSelect(): Promise<ResourceLite[]> {
            const { data } = await axios.get('/api/resources', { params:{ select:1 } })
            const arr = Array.isArray(data) ? data : (data.data ?? [])
            return arr.map((r:any) => ({ id:Number(r.id), name:r.name }))
        },
        async createResource(fd: FormData) {
            const { data } = await axios.post('/api/resources', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return data.resource ?? data
        },
        async updateResource(id:number, payload: Partial<ResourceRow>) {
            const { data } = await axios.patch(`/api/resources/${id}`, payload)
            return data.resource ?? data
        },
        async updateResourceIcon(id:number, file: File) {
            const fd = new FormData()
            fd.append('icon', file)
            fd.append('_method', 'PATCH')
            const { data } = await axios.post(`/api/resources/${id}`, fd)
            return data.resource ?? data
        },

        // Attach à un monstre (pivot)
        async listMonsterDrops(monsterId:number) {
            const { data } = await axios.get(`/api/monsters/${monsterId}/resources`)
            return data.data ?? []
        },
        async attachResourceToMonster(monsterId:number, resourceId:number, drop:number, minQty=1, maxQty=1) {
            await axios.post(`/api/monsters/${monsterId}/resources`, {
                resource_id: resourceId,
                drop_chance: drop,
                min_qty: minQty,
                max_qty: Math.max(minQty, maxQty),
            })
        },
        async updateMonsterDrop(monsterId:number, resourceId:number, payload:{ drop_chance?:number; min_qty?:number; max_qty?:number }) {
            await axios.patch(`/api/monsters/${monsterId}/resources/${resourceId}`, payload)
        },
        async detachResourceFromMonster(monsterId:number, resourceId:number) {
            await axios.delete(`/api/monsters/${monsterId}/resources/${resourceId}`)
        },
    }
}
