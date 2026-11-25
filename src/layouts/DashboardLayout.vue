<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import Header from '@/features/dashboard/components/AppHeader.vue'
import Sidebar from '@/features/dashboard/components/AppSidebar.vue'
import ProfileSetupModal from '@/features/profile/ProfileSetupModal.vue'
import {
  expandChatHeader,
  mobileKeyboardOpen,
} from '@/features/dashboard/composables/chatHeader'
import { useRoute } from 'vue-router'

const route = useRoute()
const profileSetupOpen = ref(false)
const mobileMenuOpen = ref(false)
const dashboardHeaderOffset = ref(0)
let lastScrollY = 0
let dashboardHeaderHeight = 0
let dashboardViewportWidth = 0

function isMobileLayout() {
  return window.matchMedia('(max-width: 620px)').matches
}

function measureDashboardHeader() {
  dashboardHeaderHeight =
    (document.querySelector('.dashboard-main > header') as HTMLElement | null)?.offsetHeight ?? 0
}

function resetDashboardHeader() {
  dashboardViewportWidth = window.innerWidth
  dashboardHeaderOffset.value = 0
  lastScrollY = window.scrollY
  void nextTick(measureDashboardHeader)
}

function handleViewportResize() {
  // Esconder/mostrar a barra do navegador muda só a altura; não deve revelar o header.
  if (window.innerWidth !== dashboardViewportWidth) {
    resetDashboardHeader()
    return
  }
  measureDashboardHeader()
  dashboardHeaderOffset.value = Math.min(dashboardHeaderOffset.value, dashboardHeaderHeight)
}

function handleDashboardScroll() {
  if (!isMobileLayout() || route.meta.hideHeader) {
    resetDashboardHeader()
    return
  }

  const scrollY = window.scrollY
  const delta = scrollY - lastScrollY
  lastScrollY = scrollY
  if (!delta) return

  // O header acompanha o dedo: sobe ao descer, desce ao subir, sempre travado na nav.
  const next = dashboardHeaderOffset.value + delta
  dashboardHeaderOffset.value = Math.max(0, Math.min(dashboardHeaderHeight, next))
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', handleDashboardScroll, { passive: true })
  window.addEventListener('resize', handleViewportResize)
  resetDashboardHeader()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleDashboardScroll)
  window.removeEventListener('resize', handleViewportResize)
})

watch(() => route.path, resetDashboardHeader)

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
      <div
        class="sticky top-0 z-40 flex items-center gap-3 border-b border-traceline bg-co-white px-5 py-3 min-[621px]:hidden"
        :class="{ 'max-[620px]:!hidden': mobileKeyboardOpen }"
      >
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

      <Header v-if="!route.meta.hideHeader" :scroll-offset="dashboardHeaderOffset" />

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
