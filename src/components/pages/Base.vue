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
    class="dashboard-page flex min-h-screen bg-co-white text-text-1"
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
:global(*) {
  box-sizing: border-box;
}
</style>
