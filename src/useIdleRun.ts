// src/useIdleRun.ts
import { ref } from 'vue'
import axios from 'axios'

export type IdleRun = {
    id: number
    user_id: number
    zone_id: number
    duration_sec: number
    start_at: string
    end_at: string | null
    status: 'running' | 'finished' | 'claimed' | 'canceled'
    encounters_total?: number
    encounters_done?: number
    interval_sec?: number
    gold_earned?: number
    xp_earned?: number
}

export type IdleRunLite = { id:number; zone_id:number; status:'finished'|'running'|'claimed' }

const activeRun = ref<IdleRun | null>(null)

// --- PENDING RECAP (localStorage) ---
const LS_KEY = 'idle:pendingRecap' // { id:number, zone_id:number, ts:number }
function setPendingRecap(runId:number, zoneId:number){
    try { localStorage.setItem(LS_KEY, JSON.stringify({ id:runId, zone_id:zoneId, ts:Date.now() })) } catch {}
}
function getPendingRecap(): { id:number; zone_id:number } | null {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return null
        const v = JSON.parse(raw)
        if (v && typeof v.id === 'number' && typeof v.zone_id === 'number') return v
    } catch {}
    return null
}
function clearPendingRecap(){ try { localStorage.removeItem(LS_KEY) } catch {} }

// --- Echo (optionnel, si présent globalement) ---
let echoBoundForUser: number | null = null
function listenFinishForUser(userId:number) {
    if (!('Echo' in window)) return
    if (echoBoundForUser === userId) return
    echoBoundForUser = userId

    // @ts-ignore
    window.Echo.private(`idle.user.${userId}`)
        .listen('IdleRunFinished', (e:any) => {
            // e.payload minimal: { id, zone_id, ... }
            const id = Number(e?.payload?.id ?? e?.id)
            const zoneId = Number(e?.payload?.zone_id ?? e?.zone_id)
            if (id && zoneId) {
                setPendingRecap(id, zoneId)
            }
        })
}

export default function useIdleRun() {
    async function getActiveRun(): Promise<IdleRun | null> {
        const { data } = await axios.get('/api/idle/runs/active', { headers: { Accept: 'application/json' } })
        const run = (data?.data ?? data?.run ?? data) || null
        activeRun.value = run
        return run
    }

    async function startRun(zoneId:number, minutes:number): Promise<IdleRun> {
        const mins = Math.max(1, Math.round(Number(minutes) || 1))
        const { data } = await axios.post('/api/idle/runs', { zone_id: zoneId, minutes: mins }, { headers:{ Accept:'application/json' } })
        const run: IdleRun = (data?.data ?? data?.run ?? data)
        if (!run?.id) throw new Error('Réponse invalide du serveur.')
        activeRun.value = run
        return run
    }

    async function stopRun(): Promise<void> {
        if (!activeRun.value) return
        await axios.post(`/api/idle/runs/${activeRun.value.id}/stop`, null, { headers:{ Accept:'application/json' } })
    }

    async function getUnclaimedRun(): Promise<IdleRunLite | null> {
        const { data } = await axios.get('/api/idle/runs/unclaimed', { headers:{ Accept:'application/json' } })
        return (data?.data ?? null) as IdleRunLite | null
    }

    async function claimRun(runId:number): Promise<void> {
        await axios.post(`/api/idle/runs/${runId}/claim`, null, { headers:{ Accept:'application/json' } })
    }

    return {
        activeRun,
        getActiveRun,
        startRun,
        stopRun,
        claimRun,
        getUnclaimedRun,
        // recap helpers
        setPendingRecap, getPendingRecap, clearPendingRecap,
        listenFinishForUser,
    }
}
