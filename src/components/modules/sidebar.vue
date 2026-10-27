<script setup lang="ts">
import {
  faArrowRight,
  faCalendarDays,
  faEllipsis,
  faTableColumns,
  faMessage,
  faUsers,
  faXmark,
  faNewspaper,
} from '@fortawesome/free-solid-svg-icons'
import { useRoute, useRouter } from 'vue-router'

import { computed, ref } from 'vue'
import { clearSession, currentUser } from '../../services/session'

const props = defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'open-profile-config'): void
  (e: 'close-mobile'): void
}>()

const router = useRouter()
const menuAberto = ref(false)
const submenuAberto = ref(false)

const name_user = computed(() => currentUser.user?.name ?? 'usuário')
const course = computed(() => 'usuário')
const menuItems = [
  { label: 'Visão geral', icon: faTableColumns, path: '/dashboard' },
  { label: 'Conversas', icon: faMessage, path: '/dashboard/chat', badge: '{notificações}' },
  { label: 'Comunidades', icon: faUsers, path: '/dashboard/communities' },
  { label: 'Publicações', icon: faNewspaper, path: '/dashboard/posts' },
  { label: 'Agenda', icon: faCalendarDays, path: '/dashboard/agenda' },
]

const route = useRoute()

function isActive(path: string) {
  const [targetPath, targetHash] = path.split('#')

  return route.path === targetPath && route.hash === (targetHash ? `#${targetHash}` : '')
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Protection': '1',
      },
    })
  } catch {
    // ignora falha do backend e continua limpando localmente
  } finally {
    clearSession()
    menuAberto.value = false
    submenuAberto.value = false
    router.push('/login')
  }
}

function abrirConfiguracaoPerfil() {
  menuAberto.value = false
  submenuAberto.value = false
  emit('close-mobile')
  emit('open-profile-config')
}

const profile = {
  image: currentUser.user?.image || localStorage.getItem('userImage') || '{image}',
  name: name_user,
  curso: course,
}
</script>

<template>
  <aside id="dashboard-sidebar"
    class="dashboard-sidebar flex w-[260px] shrink-0 flex-col border-r border-[#e8ebf0] bg-white px-[18px] py-7 max-[850px]:w-[72px] max-[850px]:px-2.5 max-[620px]:hidden"
    :class="props.mobileOpen
      ? 'max-[620px]:!fixed max-[620px]:!inset-y-0 max-[620px]:!left-0 max-[620px]:!z-[51] max-[620px]:!flex max-[620px]:!w-[82vw] max-[620px]:!max-w-[300px] max-[620px]:overflow-y-auto max-[620px]:shadow-2xl'
      : ''
      ">
    <div class="conecta-text flex h-8 items-end justify-between gap-2 select-none">
      <span
        class="brand-icon grid size-9 place-items-center rounded-xl bg-[#253b73] font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">C</span>
      <span
        class="brand-name font-['Space_Grotesk',sans-serif] text-[21px] font-bold tracking-[-.7px] max-[850px]:hidden"
        :class="props.mobileOpen ? 'max-[620px]:!inline' : ''">conecta<span class="text-[#e8755f]">.</span></span>
      <button v-if="props.mobileOpen" type="button"
        class="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e1e5ec] bg-white text-[#53617a] min-[621px]:hidden"
        aria-label="Fechar navegação" @click="emit('close-mobile')">
        <font-awesome-icon :icon="faXmark" />
      </button>
    </div>

    <nav class="sidebar-navigation mt-[66px] max-[850px]:mt-14" aria-label="Navegação do dashboard">
      <p
        class="navigation-label mb-3 px-[13px] text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6] max-[850px]:hidden">
        Menu principal
      </p>

      <RouterLink v-for="item in menuItems" :key="item.label" :to="item.path" :aria-label="item.label"
        :title="item.label" @click="emit('close-mobile')"
        class="navigation-item hover:bg-[#eef1f9] transition-colors relative flex h-[46px] items-center gap-3 rounded-[11px] px-[13px] text-sm font-semibold text-[#6f7a8d] no-underline [&+&]:mt-[5px] max-[850px]:justify-center max-[850px]:px-0"
        :class="isActive(item.path) ? 'navigation-item-active bg-[#e3e9fa] text-[#253b73]' : ''">
        <font-awesome-icon :icon="item.icon" />
        <span :class="props.mobileOpen
          ? 'max-[620px]:!flex max-[620px]:min-w-0 max-[620px]:flex-1 max-[620px]:truncate'
          : ''
          " class="max-[850px]:hidden">
          {{ item.label }}
        </span>
        <span v-if="item.badge" class="navigation-badge ml-auto inline-flex min-w-[22px] max-w-full items-center justify-center
         rounded-full bg-[#e8755f] px-1.5 py-[3px] text-center text-[10px] leading-none text-white
         max-[850px]:absolute max-[850px]:-right-1 max-[850px]:-top-1
         max-[850px]:z-10 max-[850px]:h-[18px] max-[850px]:min-w-[18px]
         max-[850px]:max-w-[28px] max-[850px]:overflow-hidden
         max-[850px]:px-1 max-[850px]:py-0.5" :class="props.mobileOpen
          ? 'max-[620px]:!static max-[620px]:!h-auto max-[620px]:!max-w-[90px] max-[620px]:!min-w-[22px] max-[620px]:truncate'
          : ''
          ">
          {{ item.badge }}
        </span>
      </RouterLink>
    </nav>

    <div class="sidebar-invite mt-auto mb-6 rounded-[14px] bg-[#fff6f1] p-[17px] max-[850px]:hidden">
      <div class="invite-icon mb-[13px] grid size-[34px] place-items-center rounded-[10px] bg-[#ffe5dc] text-[#e8755f]">
        <font-awesome-icon :icon="faUsers" />
      </div>
      <strong class="block font-['Space_Grotesk',sans-serif] text-[13px] font-semibold">Faça novas conexões</strong>
      <p class="my-2 text-[11px] leading-[1.5] text-[#7a8494]">
        Encontre pessoas com os mesmos interesses que você.
      </p>
      <RouterLink class="flex items-center gap-1 text-[11px] font-bold text-[#d9624c] no-underline"
        to="/dashboard/communities" @click="emit('close-mobile')">Explorar comunidades <font-awesome-icon
          :icon="faArrowRight" /></RouterLink>
    </div>

    <div
      class="sidebar-profile flex items-center gap-2.5 border-t border-[#edf0f4] px-2 pt-[17px] max-[850px]:justify-center max-[850px]:px-0">
      <div v-if="profile.image && profile.image !== '{image}'"
        class="hover:cursor-pointer profile-avatar grid size-[34px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9eefb] text-[10px] font-bold text-[#536bad]">
        <img :src="profile.image" alt="Avatar do usuário" class="h-full w-full object-cover" />
      </div>
      <div v-else
        class="hover:cursor-pointer profile-avatar grid size-[34px] shrink-0 place-items-center rounded-full bg-[#e9eefb] text-[10px] font-bold text-[#536bad] max-[850px]:hidden">
        {{ profile.image === '{image}' ? 'EU' : profile.image }}
      </div>
      <div class="profile-details hover:cursor-pointer min-w-0 flex-1 max-[850px]:hidden">
        <strong class="block truncate text-xs">{{ profile.name }}</strong>
        <span class="mt-0.5 block truncate text-[10px] text-[#929aaa]">{{ profile.curso }}</span>
      </div>


      <div class="relative flex items-center justify-center">
        <button type="button"
          class="icon-button inline-flex cursor-pointer items-center justify-center border-0 bg-transparent text-[#8c96a7] transition-colors hover:text-[#536bad]"
          :class="props.mobileOpen ? 'max-[620px]:!inline-flex' : ''" aria-label="Mais opções"
          :aria-expanded="menuAberto" @click="menuAberto = !menuAberto; submenuAberto = false">
          <font-awesome-icon :icon="faEllipsis" />
        </button>

        <!-- Painel principal e submenu -->
        <div v-if="menuAberto" class="fixed z-[100] w-[min(220px,calc(100vw-24px))] overflow-hidden
           rounded-[16px] border border-[#edf0f4] bg-white
           shadow-[0_12px_30px_rgba(17,24,39,0.12)]" :style="{
            right: '12px',
            bottom: '12px',
            maxHeight: 'calc(100dvh - 24px)',
          }" @click.stop>

          <!-- Menu principal -->
          <template v-if="!submenuAberto">
            <button type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f4f7fb]"
              @click="abrirConfiguracaoPerfil">
              <span>Perfil</span>
            </button>

            <button type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#e05d4d] transition-colors hover:bg-[#fff4f2]"
              @click="logout">
              <span>Sair</span>
            </button>
          </template>

        </div>
      </div>
    </div>
  </aside>
</template>
