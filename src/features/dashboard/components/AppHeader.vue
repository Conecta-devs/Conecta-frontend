<script setup lang="ts">
import { computed } from 'vue'

import { currentUser } from '../../../shared/services/session'
import AppDashboardIcon from '../../../shared/ui/AppDashboardIcon.vue'

const email_user = computed(() => currentUser.user?.email ?? '')

const today = new Date()
const todayLabel = `${today.toLocaleDateString('pt-BR', { weekday: 'long' })}, ${today.getDate()} de ${today.toLocaleDateString('pt-BR', { month: 'long' })} de ${today.getFullYear()}`
</script>

<template>
  <header
    class="flex min-h-[100px] items-center justify-between gap-12 border-b border-traceline bg-co-white px-[clamp(24px,5vw,75px)] max-[1000px]:flex-col max-[1000px]:items-stretch max-[1000px]:gap-5 max-[620px]:py-5"
  >
    <div class="header-text flex min-w-0 flex-1 flex-col gap-[5px]">
      <p class="m-0 text-[14px] leading-4 font-medium text-text-2 uppercase">
        {{ todayLabel }}
      </p>
      <h1
        class="m-0 text-title leading-[38px] text-text-1 max-[1400px]:text-[28px] max-[1400px]:leading-[34px] max-[1100px]:text-[24px] max-[1100px]:leading-[30px]"
      >
        Olá, que bom ter você aqui!
      </h1>
      <p class="m-0 truncate text-[16px] leading-[19px] font-medium text-text-2">
        {{ email_user }}
      </p>
    </div>

    <div class="header-actions flex shrink-0 items-center gap-5 max-[1000px]:w-full max-[620px]:gap-3">
      <label
        class="flex h-14 w-[360px] shrink-0 items-center gap-3 rounded-[10px] border border-traceline bg-white px-4 text-text-2 max-[1400px]:w-[280px] max-[1100px]:w-[240px] max-[1000px]:w-full max-[1000px]:flex-1"
      >
        <AppDashboardIcon name="search" :size="20" />
        <input
          class="w-full min-w-0 border-0 bg-transparent text-[14px] leading-4 font-medium text-text-1 outline-none placeholder:text-text-2"
          type="search"
          placeholder="Buscar no Conecta"
          aria-label="Buscar no Conecta"
        />
      </label>

      <button
        type="button"
        class="relative grid size-5 shrink-0 place-items-center border-0 bg-transparent text-text-2 transition-colors before:absolute before:-inset-2.5 before:content-[''] hover:text-co-blue"
        aria-label="Notificações"
      >
        <AppDashboardIcon name="bell" :size="20" />
      </button>
    </div>
  </header>
</template>
