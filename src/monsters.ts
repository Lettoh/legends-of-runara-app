// src/monsters.ts
import axios from 'axios'

export type ZoneLite = { id:number; name:string; spawn_chance?: number }
export type Drop = {
    id:number
    name:string
    icon_url?: string | null
    chance:number        // 0..100 (backend renvoie déjà en %)
    min_qty:number
    max_qty:number
}

export type MonsterRow = {
    id:number;
    name:string;
    level:number;
    hp:number;
    atk:number;
    def:number;
    spawn_chance:number
    image_url?: string
    zones?: ZoneLite[]
    drops?: Drop[]
}

export type MonsterUpdatePayload = {
    name?: string
    level?: number
    hp?: number
    atk?: number
    def?: number
}

export default function monsters() {
    return {
        /** Liste des monstres */
        // async listMonsters(): Promise<MonsterRow[]> {
        //     const { data } = await axios.get('/api/monsters')
        //     const raw = Array.isArray(data) ? data : (data.data ?? [])
        //
        //     return (raw as any[]).map(m => ({
        //         ...m,
        //         zones: (m.zones ?? []).map((z:any) => ({
        //             id: Number(z.id),
        //             name: z.name,
        //
        //             spawn_chance: z.pivot?.spawn_chance != null
        //                 ? Number(z.pivot.spawn_chance)
        //                 : (typeof z.spawn_chance === 'number' ? z.spawn_chance : 100),
        //         })),
        //     })) as MonsterRow[]
        // },

        async listMonsters(): Promise<MonsterRow[]> {
            const { data } = await axios.get('/api/monsters')
            const arr = Array.isArray(data) ? data : (data.data ?? [])
            return arr as MonsterRow[]
        },

        /** Détacher un monstre d'une zone */
        async detachMonsterFromZone(monsterId:number, zoneId:number) {
            await axios.delete(`/api/zones/${zoneId}/monsters/${monsterId}`)
        },

        /** Attacher un monstre à une zone */
        async attachMonsterToZone(zoneId:number, monsterId:number) {
            await axios.post(`/api/zones/${zoneId}/monsters`, { monster_id: monsterId })
        },

        /** Créer un monstre */
        async createMonster(fd: FormData) {
            const { data } = await axios.post('/api/monsters', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return data
        },

        async updateMonsterImage(monsterId: number, file: File) {
            const fd = new FormData()
            fd.append('image', file)
            fd.append('_method', 'PATCH') // ← override propre

            const { data } = await axios.post(`/api/monsters/${monsterId}`, fd, {
                headers: { Accept: 'application/json' },
                transformRequest: (d) => d,
            })
            return data.monster ?? data
        },

        async updateMonster(monsterId: number, payload: MonsterUpdatePayload) {
            const { data } = await axios.patch(`/api/monsters/${monsterId}`, payload)
            return data.monster ?? data
        },

        /** Supprimer un monstre */
        async deleteMonster(id:number) {
            await axios.delete(`/api/monsters/${id}`)
        },
    }
}
