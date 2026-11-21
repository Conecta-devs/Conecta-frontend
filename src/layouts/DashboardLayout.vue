<script setup lang="ts">
import { ref } from 'vue'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import Header from '../features/dashboard/components/AppHeader.vue'
import Sidebar from '../features/dashboard/components/AppSidebar.vue'
import ProfileSetupModal from '../features/profile/ProfileSetupModal.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const profileSetupOpen = ref(false)
const mobileMenuOpen = ref(false)

function handleProfileSave(payload: {
  image: string
  gen: string
  bio: string
  name: string
}) {
  console.log('Perfil salvo:', payload)
  localStorage.setItem('conecta_profile_setup', 'true')
  profileSetupOpen.value = false
}
</script>

<template>
  <div
    class="dashboard-page flex min-h-screen bg-co-white text-text-1"
  >
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="fixed inset-0 z-50 bg-[#101827]/45 min-[621px]:hidden"
      aria-label="Fechar menu de navegação"
      @click="mobileMenuOpen = false"
    ></button>

    <Sidebar
      :mobile-open="mobileMenuOpen"
      @close-mobile="mobileMenuOpen = false"
      @open-profile-config="profileSetupOpen = true"
    />

    <main class="dashboard-main min-w-0 flex-1">
      <div class="flex items-center gap-3 border-b border-traceline bg-co-white px-5 py-3 min-[621px]:hidden">
        <button
          type="button"
          class="grid size-10 shrink-0 place-items-center rounded-lg border border-traceline bg-co-white text-co-blue"
          aria-controls="dashboard-sidebar"
          :aria-expanded="mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <font-awesome-icon :icon="mobileMenuOpen ? faXmark : faBars" />
        </button>
        <span class="text-h6 text-co-blue">
          Navegação
        </span>
      </div>

      <Header v-if="!route.meta.hideHeader" />

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
