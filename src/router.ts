import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import axios from "axios";

import useIdleRun from "./useIdleRun.ts";
import HelloWorld from "./components/HelloWorld.vue";
import Admin from "./components/Pages/Admin/Admin.vue";
import Team from "./components/Pages/Team/Team.vue";
import Fight from "./components/Pages/Fight/Fight.vue";
import FightZone from "./components/Pages/Fight/Zone.vue";
import Idling from "./components/Pages/Fight/Idling.vue";
import useAuth from "./useAuth.ts";
const { authenticated, hydrate } = useAuth()

const routes = [
    { path: '/', name: 'home', component: HelloWorld, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAdminPermission: true, requiresAuth: true } },
    { path: '/fight', name: 'fight', component: Fight, meta: { requiresAuth: true } },
    {
        path: '/fight/zone/:id(\\d+)',
        name: 'fight.zone',
        component: FightZone,
        props: r => ({ id: Number(r.params.id) }),
        meta: { requiresAuth: true },
    },
    { path: '/fight/zone/:zoneId/idling', name: 'fight-idling', component: Idling },
    {
        path: '/team',
        name: 'team.me',
        redirect: () => {
            const { user } = useAuth()
            const id = user.value?.id ?? Number(sessionStorage.getItem('uid'))
            return id ? { name: 'team.user', params: { id } } : '/login'
        },
        meta: { requiresAuth: true },
    },
    {
        path: '/team/:id(\\d+)',
        name: 'team.user',
        component: Team,
        props: r => ({ id: Number(r.params.id) }),
        meta: { requiresAuth: true },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to) => {
    if (!authenticated.value) {
        await hydrate()
    }
    if (to.meta?.requiresAuth && !authenticated.value) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }
    return true
})

/* --- helper API: dernière run finished/non-claim, côté serveur --- */
async function fetchUnclaimed(): Promise<null | { id:number; zone_id:number }> {
    try {
        // si tu as un axios global avec baseURL = '/api' (ou un proxy Vite), garde juste '/idle/runs/unclaimed'
        const { data } = await axios.get('/api/idle/runs/unclaimed', {
            withCredentials: true,          // cookies/sanctum si besoin
            headers: { Accept: 'application/json' },
        })
        return data?.data ?? null
    } catch {
        return null
    }
}

/* ---------- UNIQUE GUARD ---------- */
router.beforeEach(async (to) => {
    const { authenticated, user } = useAuth()
    const isAuthed = authenticated.value

    // Auth / Admin / Guest
    if (to.meta.requiresAuth && !isAuthed) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.meta.requiresAdminPermission && !user.value?.is_admin) {
        return { name: 'home' }
    }
    if (to.meta.guestOnly && isAuthed) {
        const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : null
        const last = sessionStorage.getItem('lastPath')
        return redirect ?? (last && last !== '/login' ? last : { name: 'team.me' })
    }

    // ===== Politique /fight : Running > Finished (API) > sinon laisse passer =====
    if (to.path.startsWith('/fight')) {
        const { getActiveRun, activeRun } = useIdleRun()

        // 1) Running ?
        try { await getActiveRun() } catch { /* ignore, on tente l’API unclaimed ensuite */ }
        const run = activeRun.value && activeRun.value.status === 'running' ? activeRun.value : null
        if (run) {
            const already =
                to.name === 'fight-idling' &&
                String(to.params.zoneId ?? '') === String(run.zone_id) &&
                String((to.query?.run as string | undefined) ?? '') === String(run.id)
            if (!already) {
                return {
                    name: 'fight-idling',
                    params: { zoneId: String(run.zone_id) },
                    query: { run: String(run.id) },
                }
            }
            return true
        }

        // 2) Sinon, finished non-claim ?
        const pending = await fetchUnclaimed()
        if (pending && pending.id && pending.zone_id) {
            const already =
                to.name === 'fight-idling' &&
                String(to.params.zoneId ?? '') === String(pending.zone_id) &&
                String((to.query?.run as string | undefined) ?? '') === String(pending.id) &&
                (to.query?.recap as string | undefined) === '1'
            if (!already) {
                return {
                    name: 'fight-idling',
                    params: { zoneId: String(pending.zone_id) },
                    query: { run: String(pending.id), recap: '1' },
                }
            }
            return true
        }

        // 3) rien -> OK
        return true
    }

    return true
})

router.afterEach((to) => {
    if (to.name !== 'login') {
        sessionStorage.setItem('lastPath', to.fullPath)
    }
})

export default router
