<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useAuth from '@/useAuth'

import {
  Shield, UsersRound, LogOut, Settings, Swords, Store, Hammer, Castle
} from 'lucide-vue-next'

const { user, logout } = useAuth()
const route = useRoute()

const links = computed(() => [
  { to: '/admin',  label: 'Admin',              icon: Shield,     show: !!user.value?.is_admin },
  { to: '/fight',  label: 'Combattre',          icon: Swords,     show: true },
  { to: '/team',   label: 'Gérer mon équipe',   icon: UsersRound, show: true },
  { to: '/hdv',    label: "Hôtel des ventes",   icon: Store,      show: true },
  { to: '/craft',  label: 'Craft',              icon: Hammer,     show: true },
  { to: '/guild',  label: 'Guilde',             icon: Castle,     show: true },
])

const navItem =
    'no-underline flex items-center gap-3 rounded-lg px-3 py-2 ' +
    'text-gray-300 hover:text-white hover:bg-white/5 transition ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'

const visibleLinks = computed(() => links.value.filter(l => l.show))
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <nav
      class="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10
           bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/50"
      aria-label="Navigation principale"
  >
    <div class="flex h-full flex-col">
      <!-- Logo -->
      <div class="p-6 flex justify-center">
        <img class="w-48" src="../assets/runara_logo.png" alt="Runara" />
      </div>

      <!-- Liens -->
      <ul class="flex-1 space-y-1 px-3">
        <li v-for="l in visibleLinks" :key="l.to">
          <RouterLink
              :to="l.to"
              :class="[navItem, isActive(l.to) && 'bg-white/10 text-white ring-1 ring-white/10']"
              :aria-current="isActive(l.to) ? 'page' : undefined"
          >
            <component :is="l.icon" class="h-5 w-5 shrink-0" />
            <span class="truncate">{{ l.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <ul class="px-3 py-3 border-t border-white/10 space-y-1 mt-auto">
        <li>
          <RouterLink to="/settings" :class="navItem">
            <Settings class="h-5 w-5" />
            <span>Options</span>
          </RouterLink>
        </li>

        <li>
          <!-- Logout en <a> pour rendre EXACTEMENT le même rendu qu’un lien -->
          <a href="#" @click.prevent="logout()" :class="navItem" aria-label="Se déconnecter">
            <LogOut class="h-5 w-5" />
            <span>Se déconnecter</span>
          </a>
        </li>
      </ul>

    </div>
  </nav>
</template>
