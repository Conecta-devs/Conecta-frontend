<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import Header from '@/features/dashboard/components/AppHeader.vue'
import Sidebar from '@/features/dashboard/components/AppSidebar.vue'
import ProfileSetupModal from '@/features/profile/ProfileSetupModal.vue'
import {
  chatHeaderCollapsed,
  createHeaderScrollHandlers,
  expandChatHeader,
} from '@/features/dashboard/composables/chatHeader'
import { useRoute } from 'vue-router'

const route = useRoute()
const profileSetupOpen = ref(false)
const mobileMenuOpen = ref(false)
const dashboardTouchHandlers = createHeaderScrollHandlers()
let lastWindowScrollY = 0
const expandedHeaderHeight = ref(0)

function isMobileHeader() {
  return window.matchMedia('(max-width: 620px)').matches
}

function getPageHeader() {
  return document.querySelector('.dashboard-main > header') as HTMLElement | null
}

function measureHeader() {
  if (route.meta.hideHeader || chatHeaderCollapsed.value) return
  expandedHeaderHeight.value = getPageHeader()?.offsetHeight || expandedHeaderHeight.value
}

function handleWindowScroll() {
  if (!isMobileHeader()) return

  const scrollY = window.scrollY
  const delta = scrollY - lastWindowScrollY
  lastWindowScrollY = scrollY

  // No chat, o container interno controla o recolhimento.
  if (route.meta.hideHeader) return

  measureHeader()

  // Recolhe quando o encontro com a barra de navegação chega ao fim.
  const collapseAt = Math.max(expandedHeaderHeight.value, 24) + 8

  // Um fling no mobile pode avançar mais de 100px entre dois eventos.
  if (delta > 3 && scrollY > collapseAt) chatHeaderCollapsed.value = true
  else if (delta < -3 && scrollY <= 8) chatHeaderCollapsed.value = false
}

onMounted(() => {
  lastWindowScrollY = window.scrollY
  measureHeader()
  window.addEventListener('resize', measureHeader)
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  window.addEventListener('touchstart', dashboardTouchHandlers.onTouchStart, true)
  window.addEventListener('touchmove', dashboardTouchHandlers.onTouchMove, true)
  window.addEventListener('touchend', dashboardTouchHandlers.onTouchEnd, true)
  window.addEventListener('touchcancel', dashboardTouchHandlers.onTouchEnd, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', measureHeader)
  window.removeEventListener('scroll', handleWindowScroll)
  window.removeEventListener('touchstart', dashboardTouchHandlers.onTouchStart, true)
  window.removeEventListener('touchmove', dashboardTouchHandlers.onTouchMove, true)
  window.removeEventListener('touchend', dashboardTouchHandlers.onTouchEnd, true)
  window.removeEventListener('touchcancel', dashboardTouchHandlers.onTouchEnd, true)
  dashboardTouchHandlers.reset()
})

watch(() => route.fullPath, async () => {
  expandChatHeader()
  lastWindowScrollY = window.scrollY
  dashboardTouchHandlers.reset()
  await nextTick()
  measureHeader()
})

function handleProfileSave() {
  localStorage.setItem('conecta_profile_setup', 'true')
  profileSetupOpen.value = false
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  expandChatHeader()
}
</script>

<template>
  <div
    class="dashboard-page flex min-h-dvh bg-co-white text-text-1"
  >
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="fixed inset-0 z-50 bg-overlay/45 min-[621px]:hidden"
      aria-label="Fechar menu de navegação"
      @click="mobileMenuOpen = false"
    ></button>

    <Sidebar
      :mobile-open="mobileMenuOpen"
      @close-mobile="mobileMenuOpen = false"
      @open-profile-config="profileSetupOpen = true"
    />

    <main class="dashboard-main min-w-0 flex-1">
      <div class="sticky top-0 z-40 flex items-center gap-3 border-b border-traceline bg-co-white px-5 py-3 min-[621px]:hidden">
        <button
          type="button"
          class="grid size-10 shrink-0 place-items-center rounded-lg border border-traceline bg-co-white text-co-blue"
          aria-controls="dashboard-sidebar"
          :aria-expanded="mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
          @click="toggleMobileMenu"
        >
          <font-awesome-icon :icon="mobileMenuOpen ? faXmark : faBars" />
        </button>
        <span class="text-h6 text-co-blue">
          Navegação
        </span>
      </div>

      <Header v-if="!route.meta.hideHeader" :collapsed="chatHeaderCollapsed" />

      <div
        v-if="!route.meta.hideHeader"
        class="pointer-events-none hidden shrink-0 transition-[height] duration-300 ease-out motion-reduce:transition-none max-[620px]:block"
        :style="{ height: chatHeaderCollapsed ? `${expandedHeaderHeight}px` : '0px' }"
        aria-hidden="true"
      ></div>

      <div class="main-content" style>
        <RouterView />
      </div>
    </main>

    <ProfileSetupModal
      :model-value="profileSetupOpen"
      @update:model-value="profileSetupOpen = $event"
      @save="handleProfileSave"
    />
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
</style>
