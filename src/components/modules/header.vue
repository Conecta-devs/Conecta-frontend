<script setup lang="ts">
import { faBell, faSearch } from '@fortawesome/free-solid-svg-icons'

const profile = {
  name: '{name_profile}',
  image: '{image}',
}

const today = new Date()
const data = {
  day: today.getDate(),
  year: today.getFullYear(),
  weekday: today.toLocaleDateString('pt-BR', { weekday: 'long' }),
}
</script>

<template>
  <header
    class="header-top flex min-h-[157px] items-center justify-between gap-7 border-b border-[#e8ebf0] bg-white px-[clamp(24px,5vw,70px)] py-[30px] max-[620px]:flex-col max-[620px]:items-start max-[620px]:p-6"
  >
    <div class="header-text">
      <p class="header-eyebrow m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6]">
        {{ data.weekday }}, {{ data.day }} de
        {{ today.toLocaleDateString('pt-BR', { month: 'long' }) }} de {{ data.year }}
      </p>
      <h1
        class="my-2 font-['Space_Grotesk',sans-serif] text-[clamp(15px,2vw,35px)] font-bold leading-tight tracking-[-1.2px]"
      >
        Bom dia, {{ profile.name }} <span>!</span>
      </h1>
      <p class="header-description m-0 text-[13px] text-[#828c9d]">
        Veja o que está acontecendo na sua comunidade hoje.
      </p>
    </div>
    <div class="header-actions flex w-auto items-center gap-[18px] max-[620px]:w-full">
      <label
        class="search-box flex h-10 flex-1 items-center gap-2 rounded-[9px] border border-[#e7eaf0] px-[13px] text-[#929aaa] min-[621px]:w-[225px] min-[621px]:flex-none"
        ><font-awesome-icon :icon="faSearch" /><input
          class="w-full border-0 bg-transparent text-xs text-[#172238] outline-none placeholder:text-[#a3aab6]"
          type="search"
          placeholder="Buscar no Conecta"
          aria-label="Buscar no Conecta"
      /></label>
      <button
        class="notification-button relative border-0 bg-transparent p-1.5 text-[#8c96a7]"
        aria-label="Notificações"
      >
        <font-awesome-icon :icon="faBell" /><span
          class="absolute right-1 top-0.5 size-1.5 rounded-full border border-white bg-[#e8755f]"
        ></span>
      </button>
      <div
        class="profile-avatar grid size-[34px] shrink-0 place-items-center rounded-full bg-[#ffe9e2] text-[10px] font-bold text-[#db6d57]"
      >
        {{ profile.image }}
      </div>
    </div>
  </header>
</template>
