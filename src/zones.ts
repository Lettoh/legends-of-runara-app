// src/zones.ts
import axios from 'axios'

export type Zone = {
    id: number
    name: string
    description?: string | null
    min_level: number
    max_level: number
    image?: string | null
    image_url?: string | null
    created_at?: string
    updated_at?: string
}

export type CreateZonePayload = {
    name: string
    description?: string
    min_level: number
    max_level: number
    image?: File | null
}

export type Drop = {
    id:number;
    name:string;
    chance:number;
    icon_url?:string;
    min_qty:number;
    max_qty:number;
}

export type Monster = {
    id:number;
    name:string;
    level:number;
    hp:number;
    atk:number;
    def:number;
    spawn_chance:number;
    drops?: Drop[]
}

export type UpdateZonePayload = Partial<CreateZonePayload>

export default function zones() {
    async function createZone(payload: CreateZonePayload): Promise<Zone> {
        const fd = new FormData()
        fd.append('name', payload.name)
        fd.append('min_level', String(payload.min_level))
        fd.append('max_level', String(payload.max_level))
        if (payload.description) fd.append('description', payload.description)
        if (payload.image) fd.append('image', payload.image)

        const { data } = await axios.post('api/zones', fd, {
            headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
        })
        return data.zone as Zone
    }

    async function updateZone(id: number, payload: UpdateZonePayload): Promise<Zone> {
        const fd = new FormData()
        if (payload.name !== undefined) fd.append('name', payload.name)
        if (payload.min_level !== undefined) fd.append('min_level', String(payload.min_level))
        if (payload.max_level !== undefined) fd.append('max_level', String(payload.max_level))
        if (payload.description !== undefined) fd.append('description', payload.description ?? '')
        if (payload.image) fd.append('image', payload.image)

        const { data } = await axios.post(`api/zones/${id}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
        })
        return data.zone as Zone
    }

    async function deleteZone(id: number): Promise<void> {
        await axios.delete(`api/zones/${id}`)
    }

    async function listZones(params?: { page?: number; search?: string; per_page?: number; sort?: string; dir?: 'asc'|'desc' }) {
        const { data } = await axios.get('/api/zones', { params })
        return data
    }

    async function listZonesForSelect() {
        const { data } = await axios.get('/api/zones', { params: { select: 1 } })
        const arr = Array.isArray(data) ? data : (data.data ?? [])
        return arr.map((z: any) => ({ id: Number(z.id), name: z.name }))
    }

    async function getZoneById(id: number): Promise<Zone> {
        const { data } = await axios.get(`api/zones/${id}`)
        return data.zone as Zone
    }

    async function getZoneMonsters(zoneId: number) {
        const { data } = await axios.get(`/api/zones/${zoneId}/monsters`)
        return data.data as Array<{
            id:number; name:string; level:number; hp:number; atk:number; def:number;
            image_url?: string; spawn_chance:number; drops?: Drop[];
        }>
    }

    async function updateZoneMonsterChance(zoneId:number, monsterId:number, chance:number) {
        const { data } = await axios.patch(`/api/zones/${zoneId}/monsters/${monsterId}`, {
            spawn_chance: chance
        })
        return data
    }

    return {
        createZone,
        updateZone,
        deleteZone,
        listZones,
        getZoneById,
        getZoneMonsters,
        listZonesForSelect,
        updateZoneMonsterChance,
    }
}
