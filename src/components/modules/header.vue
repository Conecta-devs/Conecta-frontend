<script setup lang="ts">
import { computed } from 'vue'
import { faBell, faSearch } from '@fortawesome/free-solid-svg-icons'
import { currentUser } from '../../services/session'

const name_user = computed(() => currentUser.user?.name ?? 'usuário')
const email_user = computed(() => currentUser.user?.email ?? '')
const userImage = computed(() => currentUser.user?.image || localStorage.getItem('userImage') || '')
const profileImage = computed(() => {
  const image = userImage.value
  return image || 'EU'
})

const today = new Date()
const data = {
  day: today.getDate(),
  year: today.getFullYear(),
  weekday: today.toLocaleDateString('pt-BR', { weekday: 'long' }),
}
</script>

<template>
  <header
    class="header-top flex min-h-[157px] items-center justify-between gap-7 border-b border-traceline bg-co-white px-[clamp(24px,5vw,70px)] py-[30px] max-[620px]:flex-col max-[620px]:items-start max-[620px]:p-6"
  >
    <div class="header-text">
      <p class="header-eyebrow m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-text-2">
        {{ data.weekday }}, {{ data.day }} de
        {{ today.toLocaleDateString('pt-BR', { month: 'long' }) }} de {{ data.year }}
      </p>
      <h1
        class="type-h2 my-2"
      >
        Bom dia, {{ name_user }} <span>!</span>
      </h1>
      <p class="header-description m-0 text-[13px] text-text-2">
        {{ email_user }}
      </p>
    </div>
    <div class="header-actions flex w-auto items-center gap-[18px] max-[620px]:w-full">
      <label
        class="search-box flex h-10 flex-1 items-center gap-2 rounded-[9px] border border-traceline px-[13px] text-text-2 min-[621px]:w-[225px] min-[621px]:flex-none"
        ><font-awesome-icon :icon="faSearch" /><input
          class="w-full border-0 bg-transparent text-xs text-text-1 outline-none placeholder:text-text-2"
          type="search"
          placeholder="Buscar no Conecta"
          aria-label="Buscar no Conecta"
      /></label>
      <button
        class="notification-button relative border-0 bg-transparent p-1.5 text-text-2"
        aria-label="Notificações"
      >
        <font-awesome-icon :icon="faBell" /><span
          class="absolute right-1 top-0.5 size-1.5 rounded-full border border-co-white bg-co-coral"
        ></span>
      </button>
      <div
        v-if="userImage"
        class="profile-avatar grid size-[34px] shrink-0 place-items-center overflow-hidden rounded-full bg-s-coral text-[10px] font-bold text-co-coral"
      >
        <img :src="userImage" alt="Foto do usuário" class="h-full w-full object-cover" />
      </div>
      <div
        v-else
        class="profile-avatar grid size-[34px] shrink-0 place-items-center rounded-full bg-s-coral text-[10px] font-bold text-co-coral"
      >
        {{ profileImage }}
      </div>
    </div>
  </header>
</template>
