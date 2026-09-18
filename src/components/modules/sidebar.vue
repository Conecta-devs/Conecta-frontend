<script setup lang="ts">
import {
  faArrowRight,
  faCalendarDays,
  faEllipsis,
  faTableColumns,
  faMessage,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { useRoute } from 'vue-router'

import { computed } from 'vue'
import { currentUser } from '../../services/session'

const name_user = computed(() => currentUser.user?.name ?? 'usuário')
const email_user = computed(() => currentUser.user?.email ?? '')
const course = computed(() => currentUser.course?.email ?? 'indefinido')
const menuItems = [
  { label: 'Visão geral', icon: faTableColumns, path: '/dashboard' },
  { label: 'Conversas', icon: faMessage, path: '/dashboard/chat', badge: '{notificações}' },
  { label: 'Comunidades', icon: faUsers, path: '/dashboard#comunidades' },
  { label: 'Agenda', icon: faCalendarDays, path: '/dashboard#agenda' },
]

const route = useRoute()

function isActive(path: string) {
  const [targetPath, targetHash] = path.split('#')

  return route.path === targetPath && route.hash === (targetHash ? `#${targetHash}` : '')
}

const profile = {
  image: '{image}',
  name: name_user,
  curso: course,
}
</script>

<template>
  <aside
    class="dashboard-sidebar flex w-[260px] shrink-0 flex-col border-r border-[#e8ebf0] bg-white px-[18px] py-7 max-[850px]:w-[72px] max-[850px]:px-2.5 max-[620px]:hidden"
  >
    <div class="conecta-text flex gap-2 items-end select-none h-8">
      <span
        class="brand-icon grid size-9 place-items-center rounded-xl bg-[#253b73] font-['Space_Grotesk',sans-serif] text-lg font-bold text-white"
        >C</span
      >
      <span
        class="brand-name font-['Space_Grotesk',sans-serif] text-[21px] font-bold tracking-[-.7px] max-[850px]:hidden"
        >conecta<span class="text-[#e8755f]">.</span></span
      >
    </div>

    <nav class="sidebar-navigation mt-[66px] max-[850px]:mt-14" aria-label="Navegação do dashboard">
      <p
        class="navigation-label mb-3 px-[13px] text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6] max-[850px]:hidden"
      >
        Menu principal
      </p>

      <RouterLink
        v-for="item in menuItems"
        :key="item.label"
        :to="item.path"
        class="navigation-item hover:bg-[#eef1f9] transition-colors relative flex h-[46px] items-center gap-3 rounded-[11px] px-[13px] text-sm font-semibold text-[#6f7a8d] no-underline [&+&]:mt-[5px] max-[850px]:justify-center max-[850px]:px-0"
        :class="isActive(item.path) ? 'navigation-item-active bg-[#e3e9fa] text-[#253b73]' : ''"
      >
        <font-awesome-icon :icon="item.icon" />
        <span class="max-[850px]:hidden">{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="navigation-badge ml-auto min-w-[22px] rounded-full bg-[#e8755f] px-1.5 py-[3px] text-center text-[10px] text-white max-[850px]:absolute max-[850px]:-right-0.5 max-[850px]:-top-1 max-[850px]:min-w-[17px] max-[850px]:px-1 max-[850px]:py-0.5"
          >{{ item.badge }}</span
        >
      </RouterLink>
    </nav>

    <div
      class="sidebar-invite mt-auto mb-6 rounded-[14px] bg-[#fff6f1] p-[17px] max-[850px]:hidden"
    >
      <div
        class="invite-icon mb-[13px] grid size-[34px] place-items-center rounded-[10px] bg-[#ffe5dc] text-[#e8755f]"
      >
        <font-awesome-icon :icon="faUsers" />
      </div>
      <strong class="block font-['Space_Grotesk',sans-serif] text-[13px] font-semibold"
        >Faça novas conexões</strong
      >
      <p class="my-2 text-[11px] leading-[1.5] text-[#7a8494]">
        Encontre pessoas com os mesmos interesses que você.
      </p>
      <RouterLink
        class="flex items-center gap-1 text-[11px] font-bold text-[#d9624c] no-underline"
        to="/dashboard#comunidades"
        >Explorar comunidades <font-awesome-icon :icon="faArrowRight"
      /></RouterLink>
    </div>

    <div
      class="sidebar-profile flex items-center gap-2.5 border-t border-[#edf0f4] px-2 pt-[17px] max-[850px]:justify-center max-[850px]:px-0"
    >
      <div
        class="hover:cursor-pointer profile-avatar grid size-[34px] shrink-0 place-items-center rounded-full bg-[#e9eefb] text-[10px] font-bold text-[#536bad]"
      >
        {{ profile.image }}
      </div>
      <div class="profile-details hover:cursor-pointer min-w-0 flex-1 max-[850px]:hidden">
        <strong class="block truncate text-xs">{{ profile.name }}</strong>
        <span class="mt-0.5 block truncate text-[10px] text-[#929aaa]">{{ profile.curso }}</span>
      </div>
      <button
        class="icon-button border-0 hover:cursor-pointer transition-colors bg-transparent text-[#8c96a7] hover:text-[#536bad] max-[850px]:hidden"
        aria-label="Mais opções"
      >
        <font-awesome-icon :icon="faEllipsis" />
      </button>
    </div>
  </aside>
</template>
