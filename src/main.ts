import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import axios from "axios"
import useAuth from "./useAuth.ts";
import router from "./router.ts";
import '@/lib/echo'

const API_BASE = import.meta.env.VITE_API_URL || ''
axios.defaults.baseURL = API_BASE
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true

const { hydrate } = useAuth()

const app = createApp(App)

await hydrate()           // ← on récupère l’utilisateur une fois au démarrage

app.use(router)
await router.isReady()
app.mount('#app')