// src/spells.ts
import axios from 'axios'
export type SpellEffect = {
  id?: number
  kind: 'defense' | 'damage' | 'elemental_weakness' | 'stun' | 'shield' | 'dot'
  mode: 'percent' | 'flat'
  value?: number | null
  vs?: 'strength' | 'power' | null
  duration_turns: number
  chance?: number
}
export type SpellRow = {
  id: number
  name: string
  image?: string | null
  image_url?: string | null
  description?: string | null
  target: 'enemy_single' | 'enemy_all' | 'ally_single' | 'ally_all' | 'self'
  base_power: number
  scaling_str: number
  scaling_pow: number
  cooldown_turns: number
  effects?: SpellEffect[]
}
export type SpellCreatePayload = {
  name: string
  image?: string | null
  image_file?: File | null
  description?: string | null
  target: SpellRow['target']
  base_power: number
  scaling_str: number
  scaling_pow: number
  cooldown_turns?: number
  meta?: Record<string, any> | null
  effects?: SpellEffect[]
}
export type SpellUpdatePayload = Partial<SpellCreatePayload>
export default function spells() {
  return {
    async list(params: { q?: string; with_effects?: boolean; with_character_types?: boolean; page?: number; per_page?: number } = {}) {
      const { data } = await axios.get('/api/spells', { params })
      return data.data ?? data
    },
    async show(id: number, params: { with_effects?: boolean; with_character_types?: boolean } = {}) {
      const { data } = await axios.get(`/api/spells/${id}`, { params })
      return data.spell ?? data
    },
    async create(payload: SpellCreatePayload) {
      if (payload.image_file) {
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'image_file' && v instanceof File) fd.append('image_file', v)
          else if (k === 'effects' && Array.isArray(v)) fd.append('effects', JSON.stringify(v))
          else if (v !== undefined && v !== null) fd.append(k, String(v))
        })
        const { data } = await axios.post('/api/spells', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        return data
      } else {
        const { data } = await axios.post('/api/spells', payload)
        return data
      }
    },
    async update(id: number, payload: SpellUpdatePayload) {
      if (payload.image_file) {
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'image_file' && v instanceof File) fd.append('image_file', v)
          else if (k === 'effects' && Array.isArray(v)) fd.append('effects', JSON.stringify(v))
          else if (v !== undefined && v !== null) fd.append(k, String(v))
        })
        const { data } = await axios.patch(`/api/spells/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        return data
      } else {
        const { data } = await axios.patch(`/api/spells/${id}`, payload)
        return data
      }
    },
    async destroy(id: number) {
      await axios.delete(`/api/spells/${id}`)
    },
  }
}
