<script setup lang="ts">
import { ref } from 'vue'
import Header from '../modules/header.vue'
import Sidebar from '../modules/sidebar.vue'
import ProfileSetupModal from '../modules/ProfileSetupModal.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const profileSetupOpen = ref(false)

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
    <Sidebar @open-profile-config="profileSetupOpen = true" />

    <main class="dashboard-main min-w-0 flex-1">
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
