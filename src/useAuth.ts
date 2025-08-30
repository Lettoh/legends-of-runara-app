// useAuth.ts
import { computed, reactive } from 'vue'
import axios from 'axios'

const state = reactive({
    authenticated: false,
    user: null as null | { id:number; [k:string]: any },
    hydrated: false,
})

let hydratePromise: Promise<void> | null = null

async function fetchMe() {
    const { data } = await axios.get('/api/user')
    state.authenticated = !!data?.id
    state.user = data ?? null
    if (data?.id) sessionStorage.setItem('uid', String(data.id))
    else sessionStorage.removeItem('uid')
}

async function hydrate(opts: { force?: boolean } = {}) {
    const { force = false } = opts
    if (state.hydrated && !force) return
    if (hydratePromise && !force) return hydratePromise

    const run = (async () => {
        try {
            await fetchMe()
        } catch {
            state.authenticated = false
            state.user = null
            sessionStorage.removeItem('uid')
        } finally {
            state.hydrated = true
            hydratePromise = null
        }
    })()

    return force ? run : (hydratePromise = run)
}

export default function useAuth() {
    const authenticated = computed(() => state.authenticated)
    const user = computed(() => state.user)

    const login = async (credentials: any) => {
        await axios.get('/sanctum/csrf-cookie')
        await axios.post('/login', credentials, {
            withCredentials: true,
            headers: { Accept: 'application/json' },  // évite le 302 /dashboard
        })
        await hydrate({ force: true })              // <— IMPORTANT : force une vraie hydratation
        return !!state.user?.id
    }

    const logout = async () => {
        try { await axios.post('/logout') } finally {
            state.authenticated = false
            state.user = null
            state.hydrated = true
            sessionStorage.removeItem('uid')
            const { default: router } = await import('./router')
            router.replace('/login')
        }
    }

    return { authenticated, user, hydrate, login, logout }
}
