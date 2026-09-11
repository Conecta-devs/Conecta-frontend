<script setup lang="ts">
import Sidebar from '../modules/sidebar.vue'
import {
  faArrowRight,
  faBell,
  faBookOpen,
  faChevronRight,
  faSearch,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

const communities = [
  { name: '{group_name}', members: '{members_counter}', color: '{color}' },
  { name: '{group_name}', members: '{members_counter}', color: '{color}' },
  { name: '{group_name}', members: '{members_counter}', color: '{color}' },
]

const profile = {
  name: '{name_profile}',
  curso: '{curso}',
  email: '{email}',
  image: '{image}',
  telefone: '{telefone}',
  date_birth: '{date_birth}',
}

const conversations = [
  {
    name: '{name}',
    text: '{text}',
    time: '{last_time}',
    initials: '{Initia}',
    color: '{color_profile}',
  },
  {
    name: '{group_name}',
    text: '{last_chat}',
    time: '{last_time}',
    initials: '{initia}', // Initial tá
    color: '{color}',
  },
  {
    name: '{name}',
    text: '{text}',
    time: '{last_time}',
    initials: '{Initia}',
    color: '{color}',
  },
]

const today = new Date()

const data = {
  day: today.getDate(),
  month: today.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
  year: today.getFullYear(),
  weekday: today.toLocaleDateString('pt-BR', { weekday: 'long' }),
}

</script>

<template>
  <div
    class="dashboard-page flex min-h-screen bg-[#f8f7f4] font-['DM_Sans',sans-serif] text-[#172238]"
  >
    <Sidebar />

    <main class="dashboard-main min-w-0 flex-1">
      <header
        class="header-top flex min-h-[157px] items-center justify-between gap-7 border-b border-[#e8ebf0] bg-white px-[clamp(24px,5vw,70px)] py-[30px] max-[620px]:flex-col max-[620px]:items-start max-[620px]:p-6"
      >
        <div class="header-text">
          <p
            class="header-eyebrow m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6]"
          >
            {{ data.weekday }}, {{ data.day }} de {{ today.toLocaleDateString('pt-BR', { month: 'long' }) }} de {{ data.year }}

          </p>
          <h1
            class="my-2 font-['Space_Grotesk',sans-serif] text-[clamp(15px,2vw,35px)] font-bold leading-tight tracking-[-1.2px]"
          >
            Bom dia, {{ profile.name }} <span class="">!</span>
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

      <section
        class="dashboard-content mx-auto max-w-[1240px] px-[clamp(24px,5vw,70px)] pb-[60px] pt-[38px] max-[620px]:px-[18px] max-[620px]:py-[25px]"
      >
        <div
          class="dashboard-grid mt-[37px] grid grid-cols-[1.1fr_.9fr] gap-[22px] max-[850px]:grid-cols-1"
        >
          <section class="dashboard-section community-section" id="comunidades">
            <div class="section-heading mb-[17px] flex items-end justify-between gap-4">
              <div>
                <p
                  class="section-kicker m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6]"
                >
                  Descubra
                </p>
                <h2
                  class="mt-1 font-['Space_Grotesk',sans-serif] text-[19px] font-semibold tracking-[-.5px]"
                >
                  Suas comunidades
                </h2>
              </div>
              <a
                class="section-link flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-[#6d7890] no-underline"
                href="#comunidades"
                >Ver todas <font-awesome-icon :icon="faChevronRight"
              /></a>
            </div>
            <div class="community-list flex flex-col gap-2">
              <article
                v-for="community in communities"
                :key="community.name"
                class="community-card flex items-center gap-3 rounded-xl border border-[#e9ecf1] bg-white p-[13px]"
              >
                <div
                  class="community-symbol grid size-[42px] place-items-center rounded-[11px]"
                  :class="
                    community.color === 'coral'
                      ? 'bg-[#fff0eb] text-[#df6e58]'
                      : community.color === 'blue'
                        ? 'bg-[#edf1fc] text-[#536bad]'
                        : 'bg-[#fff6dc] text-[#bf9440]'
                  "
                >
                  <font-awesome-icon :icon="faUsers" />
                </div>
                <div class="community-copy min-w-0 flex-1">
                  <h3 class="m-0 text-xs font-bold">{{ community.name }}</h3>
                  <p class="mt-1 text-[10px] text-[#919aaa]">{{ community.members }}</p>
                </div>
                <button
                  class="small-icon-button grid size-[30px] place-items-center rounded-lg border-0 bg-[#f7f8fa] text-[#6d7890]"
                  :aria-label="`Abrir ${community.name}`"
                >
                  <font-awesome-icon :icon="faArrowRight" />
                </button>
              </article>
            </div>
          </section>
          <section class="dashboard-section conversation-section">
            <div class="section-heading mb-[17px] flex items-end justify-between gap-4">
              <div>
                <p
                  class="section-kicker m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6]"
                >
                  Agora
                </p>
                <h2
                  class="mt-1 font-['Space_Grotesk',sans-serif] text-[19px] font-semibold tracking-[-.5px]"
                >
                  Conversas recentes
                </h2>
              </div>
              <a
                class="section-link flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-[#6d7890] no-underline"
                href="#conversas"
                >Ver todas <font-awesome-icon :icon="faChevronRight"
              /></a>
            </div>
            <div class="conversation-list flex flex-col gap-2" id="conversas">
              <article
                v-for="conversation in conversations"
                :key="conversation.name"
                class="conversation-item flex items-center gap-[11px] rounded-xl border border-[#e9ecf1] bg-white p-3"
              >
                <div
                  class="profile-avatar grid size-[34px] shrink-0 place-items-center rounded-full text-[10px] font-bold"
                  :class="
                    conversation.color === 'coral'
                      ? 'bg-[#ffe9e2] text-[#db6d57]'
                      : conversation.color === 'blue'
                        ? 'bg-[#e9eefb] text-[#536bad]'
                        : 'bg-[#e4f3eb] text-[#4f9273]' //Tem que mudar depois as opções mas na base é isso
                  "
                >
                  {{ conversation.initials }}
                </div>
                <div class="conversation-copy min-w-0 flex-1">
                  <h3 class="m-0 text-xs font-bold">{{ conversation.name }}</h3>
                  <p class="mt-1 truncate text-[10px] text-[#919aaa]">{{ conversation.text }}</p>
                </div>
                <time class="self-start text-[10px] text-[#a1a9b6]">{{ conversation.time }}</time>
              </article>
            </div>
          </section>
        </div>

        <section class="dashboard-section event-section mt-[37px]">
          <div class="section-heading mb-[17px] flex items-end justify-between gap-4">
            <div>
              <p
                class="section-kicker m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6]"
              >
                Não perca
              </p>
              <h2
                class="mt-1 font-['Space_Grotesk',sans-serif] text-[19px] font-semibold tracking-[-.5px]"
              >
                Próximos encontros
              </h2>
            </div>
            <a
              class="section-link flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-[#6d7890] no-underline"
              href="#agenda"
              >Ver agenda <font-awesome-icon :icon="faChevronRight"
            /></a>
          </div>
          <article
            class="event-card flex items-center gap-[19px] rounded-xl border border-[#e9ecf1] bg-white p-[15px_18px] max-[620px]:flex-wrap max-[620px]:items-start"
            id="agenda"
          >
            <div
              class="event-date w-[47px] shrink-0 rounded-lg bg-[#fff0eb] py-1.5 text-center text-[#e8755f]"
            >
              <strong class="block font-['Space_Grotesk',sans-serif] text-xl font-bold">{data.day}</strong
              ><span class="block text-[9px] font-bold">{data.month}</span>
            </div>
            <div class="event-copy min-w-0 flex-1">
              <span class="event-type text-[9px] font-bold uppercase tracking-[.7px] text-[#e8755f]"
                >Encontro online</span
              >
              <h3 class="my-1 font-['Space_Grotesk',sans-serif] text-[15px] font-semibold">
                Editar e criar objeto depois
              </h3>
              <p class="m-0 flex items-center gap-1 text-[10px] text-[#8a94a5]">
                <font-awesome-icon :icon="faBookOpen" /> {Placeholder_curso} <span>•</span> {placeholder_horario}
              </p>
            </div>
            <button
              class="cursor-pointer hover:bg-[#e4e0ff] transition-colors outline-button inline-flex items-center gap-2 rounded-lg border border-[#e0e4eb] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#53617a] max-[620px]:ml-[66px]"
            >
              Tenho interesse <font-awesome-icon :icon="faArrowRight" />
            </button>
          </article>
        </section>
      </section>
    </main>
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
