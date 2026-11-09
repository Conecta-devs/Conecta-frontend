<script setup lang="ts">
import { computed, ref } from 'vue'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useRoute, useRouter } from 'vue-router'

import { clearSession, currentUser } from '../../../shared/services/session'
import AppArrowIcon from '../../../shared/ui/AppArrowIcon.vue'
import AppDashboardIcon from '../../../shared/ui/AppDashboardIcon.vue'
import AppIcon from '../../../shared/ui/AppIcon.vue'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import AppLogoAnimated from '../../../shared/ui/AppLogoAnimated.vue'

type DashboardIconName =
  | 'layout-dashboard'
  | 'messages-square'
  | 'coletive'
  | 'newspaper'
  | 'calendar-days'

const props = defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'open-profile-config'): void
  (e: 'close-mobile'): void
}>()

const router = useRouter()
const route = useRoute()
const menuAberto = ref(false)
const submenuAberto = ref(false)

const menuItems: Array<{ label: string; icon: DashboardIconName; path: string }> = [
  { label: 'Visão geral', icon: 'layout-dashboard', path: '/dashboard' },
  { label: 'Conversas', icon: 'messages-square', path: '/dashboard/chat' },
  { label: 'Comunidades', icon: 'coletive', path: '/dashboard/communities' },
  { label: 'Publicações', icon: 'newspaper', path: '/dashboard/posts' },
  { label: 'Agenda', icon: 'calendar-days', path: '/dashboard/agenda' },
]

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

function abrirOpcoes() {
  submenuAberto.value = !submenuAberto.value
}

function abrirConfiguracaoPerfil() {
  menuAberto.value = false
  submenuAberto.value = false
  emit('close-mobile')
  emit('open-profile-config')
}

const profileImage = computed(() => {
  const image = currentUser.user?.image ?? ''
  return image && image !== '{image}' ? image : ''
})
</script>

<template>
  <aside
    id="dashboard-sidebar"
    class="dashboard-sidebar sticky top-0 flex h-dvh w-[360px] shrink-0 flex-col gap-[15px] self-start overflow-y-auto border-r border-traceline bg-co-white px-[35px] pb-[22px] pt-[22px] max-[1100px]:w-[72px] max-[1100px]:items-center max-[1100px]:px-2.5 max-[620px]:hidden"
    :class="props.mobileOpen ? 'is-drawer' : ''"
  >
    <div
      class="sidebar-logo flex h-[55px] w-full shrink-0 items-center justify-between max-[1100px]:justify-center"
    >
      <AppLogoAnimated :width="209" class="sidebar-full-logo max-[1100px]:hidden" />
      <AppLogo
        variant="logo-3"
        :width="40"
        :height="22"
        class="sidebar-rail-logo hidden max-[1100px]:block"
      />
      <button
        v-if="props.mobileOpen"
        type="button"
        class="sidebar-close grid size-9 shrink-0 place-items-center rounded-lg border border-traceline bg-co-white text-text-2 min-[621px]:hidden"
        aria-label="Fechar navegação"
        @click="emit('close-mobile')"
      >
        <font-awesome-icon :icon="faXmark" />
      </button>
    </div>

    <nav class="sidebar-navigation w-full shrink-0" aria-label="Navegação do dashboard">
      <p
        class="sidebar-label mb-5 text-[14px] leading-4 font-medium text-text-2 max-[1100px]:hidden"
      >
        MENU PRINCIPAL
      </p>

      <div class="flex flex-col gap-3">
        <RouterLink
          v-for="item in menuItems"
          :key="item.label"
          :to="item.path"
          :aria-label="item.label"
          :title="item.label"
          class="navigation-item flex h-16 w-full items-center gap-4 rounded-[10px] px-5 text-[14px] leading-4 font-medium no-underline transition-colors hover:bg-traceline/60 max-[1100px]:size-[52px] max-[1100px]:justify-center max-[1100px]:px-0"
          :class="
            isActive(item.path)
              ? 'navigation-item-active bg-traceline text-co-blue'
              : 'text-text-2'
          "
          @click="emit('close-mobile')"
        >
          <AppDashboardIcon :name="item.icon" :size="20" />
          <span class="sidebar-item-label max-[1100px]:hidden">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <div
      class="sidebar-invite mt-auto flex w-full shrink-0 flex-col gap-5 rounded-2xl bg-s-coral p-6 max-[1100px]:hidden"
    >
      <AppIcon variant="hands" :width="24" class="text-co-blue" />

      <div class="flex flex-col gap-3">
        <strong class="text-[18px] leading-[21px] font-medium text-text-1">
          Faça novas conexões
        </strong>
        <p class="text-[14px] leading-4 font-medium text-text-2">
          Encontre pessoas com os mesmos interesses que você.
        </p>
      </div>

      <RouterLink
        to="/dashboard/communities"
        class="inline-flex items-center gap-2 text-[14px] leading-4 font-medium text-co-blue no-underline transition-colors hover:text-co-coral"
        @click="emit('close-mobile')"
      >
        Explorar comunidades
        <AppArrowIcon />
      </RouterLink>
    </div>

    <div class="sidebar-profile relative w-full shrink-0">
      <div class="h-px w-full bg-traceline max-[1100px]:hidden"></div>

      <button
        type="button"
        class="sidebar-profile-button mt-5 flex h-11 w-full items-center gap-3 text-left max-[1100px]:mt-0 max-[1100px]:justify-center"
        aria-haspopup="menu"
        :aria-expanded="menuAberto"
        @click="menuAberto = !menuAberto; submenuAberto = false"
      >
        <span
          class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-traceline text-text-2"
        >
          <img
            v-if="profileImage"
            :src="profileImage"
            alt="Avatar do usuário"
            class="h-full w-full object-cover"
          />
          <AppDashboardIcon v-else name="person" :size="14" />
        </span>

        <span class="sidebar-profile-details min-w-0 flex-1 max-[1100px]:hidden">
          <strong class="block truncate text-[16px] leading-[19px] font-medium text-text-1">
            Meu perfil
          </strong>
          <span class="mt-1 block truncate text-[14px] leading-4 font-medium text-text-2">
            Seu espaço no Conecta
          </span>
        </span>

        <AppDashboardIcon
          name="chevron-right"
          :size="16"
          class="sidebar-profile-chevron text-text-2 max-[1100px]:hidden"
        />
      </button>

      <div
        v-if="menuAberto"
        class="fixed bottom-[95px] left-[35px] z-[100] w-[290px] overflow-hidden rounded-2xl border border-traceline bg-co-white shadow-[0_12px_30px_rgba(17,24,39,0.12)] max-[1100px]:bottom-[80px] max-[1100px]:left-3 max-[1100px]:w-[220px] max-[620px]:left-4 max-[620px]:w-[240px]"
        role="menu"
        @click.stop
      >
        <template v-if="!submenuAberto">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text-1 transition-colors hover:bg-s-blue/30"
            role="menuitem"
            @click="abrirConfiguracaoPerfil"
          >
            <span>Perfil</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text-1 transition-colors hover:bg-s-blue/30"
            role="menuitem"
            @click="abrirOpcoes"
          >
            <span>Opções</span>
            <span class="text-[11px] text-text-2">›</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-co-coral transition-colors hover:bg-s-coral"
            role="menuitem"
            @click="logout"
          >
            <span>Sair</span>
          </button>
        </template>

        <template v-else>
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text-1 transition-colors hover:bg-s-blue/30"
            role="menuitem"
            @click="submenuAberto = false; menuAberto = false"
          >
            <span>Conta</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text-1 transition-colors hover:bg-s-blue/30"
            role="menuitem"
            @click="submenuAberto = false; menuAberto = false"
          >
            <span>Preferências</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text-1 transition-colors hover:bg-s-blue/30"
            role="menuitem"
            @click="submenuAberto = false; menuAberto = false"
          >
            <span>Privacidade</span>
          </button>
        </template>
      </div>
    </div>
  </aside>
</template>

<style scoped>
@media (max-width: 620px) {
  .dashboard-sidebar.is-drawer {
    display: flex;
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 51;
    width: 82vw;
    max-width: 300px;
    align-items: stretch;
    padding: 22px 24px;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(17, 24, 39, 0.25);
  }

  .dashboard-sidebar.is-drawer .sidebar-logo {
    justify-content: space-between;
  }

  .dashboard-sidebar.is-drawer .sidebar-full-logo {
    display: block;
  }

  .dashboard-sidebar.is-drawer .sidebar-rail-logo {
    display: none;
  }

  .dashboard-sidebar.is-drawer .sidebar-label,
  .dashboard-sidebar.is-drawer .sidebar-item-label,
  .dashboard-sidebar.is-drawer .sidebar-profile-details {
    display: block;
  }

  .dashboard-sidebar.is-drawer .sidebar-profile-chevron {
    display: block;
  }

  .dashboard-sidebar.is-drawer .sidebar-invite {
    display: flex;
  }

  .dashboard-sidebar.is-drawer .navigation-item {
    width: 100%;
    height: 64px;
    justify-content: flex-start;
    padding: 0 20px;
  }

  .dashboard-sidebar.is-drawer .sidebar-profile-button {
    justify-content: flex-start;
  }
}
</style>
