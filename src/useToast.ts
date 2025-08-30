import { reactive, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type Toast = { id: number; type: ToastType; message: string; duration: number }

const state = reactive({ list: [] as Toast[] })
let _id = 0

function remove(id: number) {
    const i = state.list.findIndex(t => t.id === id)
    if (i !== -1) state.list.splice(i, 1)
}

function push(message: string, type: ToastType = 'info', opts?: { duration?: number }) {
    const t: Toast = { id: ++_id, type, message, duration: opts?.duration ?? 5000 }
    state.list.push(t)
    if (t.duration > 0) setTimeout(() => remove(t.id), t.duration)
    return t.id
}

const success = (m: string, opts?: { duration?: number }) => push(m, 'success', opts)
const error   = (m: string, opts?: { duration?: number }) => push(m, 'error', opts)
const info    = (m: string, opts?: { duration?: number }) => push(m, 'info', opts)
const warning = (m: string, opts?: { duration?: number }) => push(m, 'warning', opts)

export default function useToast() {
    return { toasts: readonly(state.list), push, success, error, info, warning, remove }
}
