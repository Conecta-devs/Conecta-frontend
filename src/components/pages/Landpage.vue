<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import BlurReveal from '../ui/BlurReveal.vue'

import {
  faArrowRight,
  faBars,
  faBookOpen,
  faHandshake,
  faWandSparkles,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const menuAberto = ref(false)
const router = useRouter()

const aviso = ref('')

function abrirComunidade() {
  router.push('/login')
}

function fecharAviso() {
  aviso.value = ''
}

const beneficios = [
  {
    icon: faHandshake,
    title: 'Um lugar para conversar',
    text: 'Fale com outros estudantes que também passam pelos desafios da faculdade.',
  },

  {
    icon: faBookOpen,
    title: 'Estude com outras pessoas',
    text: 'Tire dúvidas, monte grupos de estudo e encontre quem está estudando as mesmas matérias.',
  },

  {
    icon: faUsers,
    title: 'Conheça gente nova',
    text: 'Converse, faça amizades e conheça outras pessoas do seu curso e da sua faculdade.',
  },
]

const passos = [
  {
    number: '01',
    title: 'Diga o que você procura',
    text: 'Conte o que está precisando ou simplesmente dê uma olhada no que está rolando.',
  },

  {
    number: '02',
    title: 'Encontre pessoas como você',
    text: 'Entre em grupos para estudar, conversar, tirar dúvidas ou trocar experiências.',
  },

  {
    number: '03',
    title: 'Comece a conversar',
    text: 'Participe no seu ritmo e vá conhecendo pessoas ao longo do caminho.',
  },
]
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#f8f7f4] text-[#19253d]">
    <header class="relative z-20 mx-auto flex min-w-6xl max-w-dvh items-center justify-between px-6 py-6 lg:px-10">
      <a href="#inicio" class="flex items-center gap-[11px]" aria-label="Conecta, início">
        <img
          src="../../assets/Logo3.svg"
          alt="Logo Conecta"
          class="h-10 w-auto"
        />

        <span class="font-['Space_Grotesk',sans-serif] text-[21px] text-[#263B73] font-bold tracking-[-.7px]">
          conecta<span class="text-[#ec765d]">.</span>
        </span>
      </a>

      <nav class="hidden items-center gap-8 text-sm font-medium text-[#667087] md:flex"
        aria-label="Navegação principal">
        <a class="transition-colors hover:text-[#263b73]" href="#por-que">
          Por que usar o Conecta
        </a>

        <a class="transition-colors hover:text-[#263b73]" href="#como-funciona"> Como funciona </a>

        <a class="transition-colors hover:text-[#263b73]" href="#seguranca"> Segurança </a>
      </nav>


      <button class="rounded-xl p-2 text-[#263b73] md:hidden" :aria-expanded="menuAberto" aria-label="Abrir menu"
        @click="menuAberto = !menuAberto">
        <font-awesome-icon v-if="menuAberto" :icon="faXmark" />
      
        <font-awesome-icon v-else :icon="faBars" />
      </button>
    </header>

    <!-- Separação do header -->
    <!--Main Mexer com cuidade-->
    <div v-if="menuAberto"
      class="relative z-20 mx-6 rounded-2xl border border-[#dfe2eb] bg-white p-4 shadow-xl md:hidden">
      <nav class="flex flex-col gap-4 text-sm font-medium text-[#667087]">
        <a href="#por-que" @click="menuAberto = false"> Por que usar o Conecta </a>

        <a href="#como-funciona" @click="menuAberto = false"> Como funciona </a>

        <a href="#seguranca" @click="menuAberto = false"> Segurança </a>
      </nav>
    </div>

    <main id="inicio">
      <!-- HERO || Essa parte aqui é fogo -->

      <section
        class="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-12 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-32 lg:pt-20">
        <div class="relative z-10">
          <div
            class="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe2eb] bg-white/70 px-3 py-2 text-xs font-semibold text-[#667087] shadow-sm">
            <font-awesome-icon :icon="faWandSparkles" class="text-[#ec765d]" />

            Feito pensando na vida de quem está na faculdade
          </div>

          <h1
            class="select-none max-w-3xl font-sans text-5xl font-semibold leading-[1.03] tracking-[-0.06em] text-[#263B73] sm:text-6xl lg:text-7xl">
            <BlurReveal as="span" text="Um Lugar Amigável para Aprender." />
            <BlurReveal as="span" class="text-[#ec765d]" text=" Conecte-se!" :delay="0.6" />
          </h1>

          <p class="mt-7 max-w-xl text-lg leading-8 text-[#667087] select-none">
            Conheça sua comunidade, tire as dúvidas pertinentes e encontre ajuda nos seus estudos!
          </p>

          <div class="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              class="group cursor-pointer inline-flex items-center justify-center gap-3 rounded-2xl bg-[#263b73] px-6 py-4 font-bold text-white shadow-xl shadow-[#263b73]/20 transition-all  hover:bg-[#1e315f]"
              @click="abrirComunidade">
              Quero fazer parte

              <font-awesome-icon :icon="faArrowRight" class="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div class="connection-tree relative mx-auto w-full max-w-[600px]" aria-hidden="true">
          <img src="../../assets/AConexao.svg" alt="" class="h-auto w-full" />

          <div
            class="select-none connection-tree-note absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-[#dfe2eb] bg-white/90 px-4 py-2 text-xs font-semibold text-[#667087] shadow-lg shadow-[#263b73]/10">
            Uma conversa Conecta a outra
          </div>
        </div>
      </section>

      <!-- POR QUE SAboooor! -->

      <section id="por-que" class="border-y border-[#dfe2eb] bg-[#eef1f7] px-6 py-20 lg:px-10 lg:py-28">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-2xl">
            <p class="eyebrow text-2xl font-bold uppercase tracking-[0.16em] text-[#ec765d]">
              Por que usar o Conecta?
            </p>

            <h2 class="section-title mt-4 text-[1.25rem] font-semibold text-[#19253d]">
              A vida universitária fica mais leve quando se é compartilhada
            </h2>

            <p class="mt-5 max-w-xl text-lg leading-8 text-[#667087]">
              Encontre pessoas que entendem sua rotina, seus desafios e as pequenas dúvidas do dia a dia na universidade
            </p>
          </div>

          <div class="mt-12 grid gap-5 select-none md:grid-cols-3">
            <article v-for="beneficio in beneficios" :key="beneficio.title"
              class="cursor-pointer rounded-2xl border border-[#dfe2eb] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#ec765d] hover:shadow-lg hover:shadow-[#263b73]/10">
              <div class="mb-10 grid h-11 w-11 place-items-center rounded-xl bg-[#fff0ec] text-[#ec765d]">
                <font-awesome-icon :icon="beneficio.icon" />
              </div>

              <h3 class="text-xl font-bold text-[#19253d]">
                {{ beneficio.title }}
              </h3>

              <p class="mt-3 leading-7 text-[#667087]">
                {{ beneficio.text }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <!-- COMO FUNCIONA -->

      <section id="como-funciona" class="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-32">
        <div class="grid ga -14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <p class="eyebrow select-none">Como funciona</p>

            <h2 class="section-title mt-4 select-none">Você usa o Conecta do seu jeito.</h2>

            <p class="mt-6 leading-7 text-[#667087] select-none">
              Você escolhe quando participar, com quem conversar e quais assuntos fazem sentido para
              você.
            </p>

            <a href="#comunidade"
              class="mt-8 inline-flex items-center gap-2 font-bold text-[#263b73] select-none hover:text-[#ec765d]">
              Começar agora

              <font-awesome-icon :icon="faArrowRight" />
            </a>
          </div>

          <div class="space-y-9">
            <div v-for="passo in passos" :key="passo.number" class="flex gap-6 border-b border-[#e5e6eb] pb-9">
              <span class="font-mono text-sm font-bold text-[#ec765d]">
                {{ passo.number }}
              </span>

              <div>
                <h3 class="text-xl font-bold">
                  {{ passo.title }}
                </h3>

                <p class="mt-2 leading-7 text-[#667087]">
                  {{ passo.text }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- COMUNIDADE -->

      <section id="comunidade" class="px-6 pb-20 lg:px-10 lg:pb-28 p-8">
        <div
          class="mx-auto max-w-7xl overflow-hidden rounded-[1rem] bg-[#263b73] px-8 py-14 text-center text-white sm:px-12 lg:py-20">
          <p class="font-mono select-none text-sm uppercase tracking-[.2em] text-[#bfc9e7]">
            Conheça o Conecta
          </p>

          <h2 class="mx-auto select-none mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            <span class="Texto-col text-[#ec765d]">
              Estude,
            </span>
             <span class="Texto-col text-[#]">
             converse 
            </span>
             <span class="Texto-col text-[#cfdbfa]">
             e compartilhe
            </span>
             
            
          </h2>

          <button
            class="mt-9 cursor-pointer inline-flex items-center gap-3 rounded-2xl bg-[#ec765d] px-7 py-4 font-bold text-white transition-colors hover:bg-[#f1421f]"
            @click="abrirComunidade">
            Quero fazer parte

            <font-awesome-icon :icon="faArrowRight" />
          </button>
        </div>
      </section>
    </main>

    <!-- FOOTER -->

    <footer
      class="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-10 text-sm text-[#98a0b3] sm:flex-row sm:items-center sm:justify-between lg:px-10">
      <span class="font-['Space_Grotesk',sans-serif] text-[21px] font-bold tracking-[-.7px] text-[#263b73]">
        conecta<span class="text-[#ec765d]">.</span>
      </span>

      <span> Feito por estudantes, para estudantes. </span>

      <span> © 2026 Conecta </span>
    </footer>

    <!-- AVISO -->
    <!-- Lembrando tudo que for mexer avise -->
    <div v-if="aviso"
      class="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-[#19253d] px-5 py-4 text-sm text-white shadow-2xl">
      <span>
        {{ aviso }}
      </span>

      <button class="text-[#bfc9e7] hover:text-white" aria-label="Fechar aviso" @click="fecharAviso">
        <font-awesome-icon :icon="faXmark" />
      </button>
    </div>
  </div>
</template>
