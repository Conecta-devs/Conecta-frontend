<script setup lang="ts">
import { ref } from 'vue'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import Header from '../modules/header.vue'
import Sidebar from '../modules/sidebar.vue'
import ProfileSetupModal from '../modules/ProfileSetupModal.vue'
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
  localStorage.setItem('userImage', payload.image || '')
  profileSetupOpen.value = false
}
</script>

<template>
  <div
    class="dashboard-page flex min-h-screen bg-[#f8f7f4] font-['DM_Sans',sans-serif] text-[#172238]"
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
      <div class="flex items-center gap-3 border-b border-[#e8ebf0] bg-white px-5 py-3 min-[621px]:hidden">
        <button
          type="button"
          class="grid size-10 shrink-0 place-items-center rounded-lg border border-[#e1e5ec] bg-white text-[#253b73]"
          aria-controls="dashboard-sidebar"
          :aria-expanded="mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <font-awesome-icon :icon="mobileMenuOpen ? faXmark : faBars" />
        </button>
        <span class="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#253b73]">
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

:global(*) {
  box-sizing: border-box;
}
:global(body) {
  margin: 0;
}
</style>
