// src/lib/echo.ts
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import axios from 'axios'

declare global { interface Window { Pusher: any } }
window.Pusher = Pusher

// Si VITE_PUSHER_HOST est défini, on considère un serveur websockets self-hosted
const USE_SELF_HOSTED = !!import.meta.env.VITE_PUSHER_HOST

const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local-key',

    // ✅ requis par Pusher-JS (même en self-hosted)
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',

    // Self-hosted (beyondcode/laravel-websockets)
    ...(USE_SELF_HOSTED
        ? {
            wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
            wsPort: Number(import.meta.env.VITE_PUSHER_PORT || 6001),
            wssPort: Number(import.meta.env.VITE_PUSHER_PORT || 6001),
            forceTLS: false,
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
        }
        // Pusher Cloud (pusher.com)
        : {
            forceTLS: true,
            // cluster déjà défini plus haut
        }),

    // Auth privé (Sanctum via cookies)
    authorizer: (channel: any) => ({
        authorize(socketId: string, callback: (error: any, data: any) => void) {
            axios.post('/broadcasting/auth', {
                socket_id: socketId,
                channel_name: channel.name,
            }, { withCredentials: true })
                .then(res => callback(null, res.data))
                .catch(err => callback(err, null))
        },
    }),
} as any)

export default echo
