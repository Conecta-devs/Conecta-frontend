<script setup lang="ts">
import { computed } from 'vue'

import { currentUser } from '@/shared/services/session'
import AppDashboardIcon from '@/shared/ui/AppDashboardIcon.vue'

withDefaults(
  defineProps<{
    /** `chat` fixa a altura em 100px para caber na viewport da tela de Chat. */
    variant?: 'page' | 'chat'
    /** Valor controlado da busca. Sem valor, o campo permanece livre. */
    searchValue?: string
    /** No chat, recolhe liberando espaço durante a rolagem do histórico. */
    collapsed?: boolean
    /** Deslocamento vertical acompanhando o scroll nas telas fora do chat. */
    scrollOffset?: number
  }>(),
  {
    variant: 'page',
    searchValue: undefined,
    collapsed: false,
    scrollOffset: 0,
  },
)

const emit = defineEmits<{
  'update:searchValue': [value: string]
  'search-input': [event: Event]
}>()

const email_user = computed(() => currentUser.user?.email ?? '')

const today = new Date()
const todayLabel = `${today.toLocaleDateString('pt-BR', { weekday: 'long' })}, ${today.getDate()} de ${today.toLocaleDateString('pt-BR', { month: 'long' })} de ${today.getFullYear()}`

function onSearchInput(event: Event) {
  emit('update:searchValue', (event.target as HTMLInputElement).value)
  emit('search-input', event)
}
</script>

<template>
  <header
    :inert="collapsed ? true : undefined"
    :aria-hidden="collapsed ? 'true' : undefined"
    :style="variant !== 'chat' && scrollOffset ? { transform: `translateY(-${scrollOffset}px)` } : undefined"
    class="flex items-center justify-between gap-12 border-b border-traceline bg-co-white px-page-gutter transition-[height,padding,gap,border-width] duration-300 ease-out motion-reduce:transition-none max-[1000px]:flex-col max-[1000px]:items-stretch max-[1000px]:gap-5 max-[620px]:py-5"
    :class="[
      variant === 'chat'
        ? 'h-[100px] shrink-0 max-[1000px]:h-auto max-[1000px]:py-5 max-[620px]:gap-3'
        : 'min-h-[100px] max-[620px]:sticky max-[620px]:top-[65px] max-[620px]:z-30 max-[620px]:will-change-transform',
      collapsed
        ? 'max-[620px]:!h-0 max-[620px]:!min-h-0 max-[620px]:!overflow-hidden max-[620px]:!border-0 max-[620px]:!py-0 max-[620px]:!gap-0'
        : '',
    ]"
  >
    <div class="header-text flex min-w-0 flex-1 flex-col gap-[5px]">
      <p class="m-0 text-h6 leading-4 font-medium text-text-2 uppercase">
        {{ todayLabel }}
      </p>
      <h1
        class="m-0 text-title leading-[38px] text-text-1 max-[1400px]:text-[28px] max-[1400px]:leading-[34px] max-[1100px]:text-h2 max-[1100px]:leading-[30px]"
      >
        Olá, que bom ter você aqui!
      </h1>
      <p class="m-0 truncate text-h5 leading-[19px] font-medium text-text-2">
        {{ email_user }}
      </p>
    </div>

    <div class="header-actions flex shrink-0 items-center gap-5 max-[1000px]:w-full max-[620px]:gap-3">
      <label
        class="flex h-14 w-[360px] shrink-0 items-center gap-3 rounded-button border border-traceline bg-white px-4 text-text-2 max-[1400px]:w-[280px] max-[1100px]:w-[240px] max-[1000px]:w-full max-[1000px]:flex-1"
      >
        <slot name="search-icon">
          <AppDashboardIcon name="search" :size="20" />
        </slot>
        <input
          class="w-full min-w-0 border-0 bg-transparent text-h6 leading-4 font-medium text-text-1 outline-none placeholder:text-text-2"
          type="search"
          placeholder="Buscar no Conecta"
          aria-label="Buscar no Conecta"
          :value="searchValue"
          @input="onSearchInput"
        />
      </label>

      <button
        type="button"
        class="relative grid size-5 shrink-0 place-items-center border-0 bg-transparent text-text-2 transition-colors before:absolute before:-inset-2.5 before:content-[''] hover:text-co-blue"
        aria-label="Notificações"
      >
        <slot name="notification-icon">
          <AppDashboardIcon name="bell" :size="20" />
        </slot>
      </button>
    </div>
  </header>
</template>
