import axios from 'axios'

export type CharacterTypeRow = {
  id: number
  name: string
}

export default function characterTypes() {
  return {
    async list(): Promise<CharacterTypeRow[]> {
      const { data } = await axios.get('/api/character-types')
      return data.data ?? data
    },
    async listSpells(typeId: number) {
      const { data } = await axios.get(`/api/character-types/${typeId}/spells`, { params: { with_effects: true } })
      return data.data ?? data
    },
    async attachSpell(typeId: number, spellId: number, payload: { unlock_level: number; required_specialization?: string | null }) {
      const { data } = await axios.post(`/api/character-types/${typeId}/spells/${spellId}`, payload)
      return data
    },
    async updatePivot(typeId: number, spellId: number, payload: { unlock_level?: number; required_specialization?: string | null }) {
      const { data } = await axios.patch(`/api/character-types/${typeId}/spells/${spellId}`, payload)
      return data
    },
    async detachSpell(typeId: number, spellId: number) {
      await axios.delete(`/api/character-types/${typeId}/spells/${spellId}`)
    },
  }
}
