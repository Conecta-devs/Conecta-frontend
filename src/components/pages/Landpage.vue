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
  <div class="min-h-screen overflow-hidden bg-co-white text-text-1">
    <header class="relative z-20 mx-auto flex min-w-6xl max-w-dvh items-center justify-between px-6 py-6 lg:px-10">
      <a href="#inicio" class="flex items-center gap-[11px]" aria-label="Conecta, início">
        <img
          src="../../assets/logos/logo-3.svg"
          alt="Logo Conecta"
          class="h-10 w-auto"
        />

        <span class="text-[21px] text-co-blue font-bold tracking-[-.7px]">
          conecta<span class="text-co-coral">.</span>
        </span>
      </a>

      <nav class="hidden items-center gap-8 text-sm font-medium text-text-2 md:flex"
        aria-label="Navegação principal">
        <a class="transition-colors hover:text-co-blue" href="#por-que">
          Por que usar o Conecta
        </a>

        <a class="transition-colors hover:text-co-blue" href="#como-funciona"> Como funciona </a>
        <a class="transition-colors hover:text-co-blue" href="#seguranca"> Segurança </a>
      </nav>


      <button class="rounded-xl p-2 text-co-blue md:hidden" :aria-expanded="menuAberto" aria-label="Abrir menu"
        @click="menuAberto = !menuAberto">
        <font-awesome-icon v-if="menuAberto" :icon="faXmark" />
      
        <font-awesome-icon v-else :icon="faBars" />
      </button>
    </header>

    <!-- Separação do header -->
    <!--Main Mexer com cuidade-->
    <div v-if="menuAberto"
      class="relative z-20 mx-6 rounded-2xl border border-traceline bg-co-white p-4 shadow-xl md:hidden">
      <nav class="flex flex-col gap-4 text-sm font-medium text-text-2">
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
            class="mb-7 inline-flex items-center gap-2 rounded-full border border-traceline bg-co-white/70 px-3 py-2 text-xs font-semibold text-text-2 shadow-sm">
            <font-awesome-icon :icon="faWandSparkles" class="text-co-coral" />

            Feito pensando na vida de quem está na faculdade
          </div>

          <h1 class="type-h1 select-none max-w-3xl text-co-blue">
            <BlurReveal as="span" text="Um Lugar Amigável para Aprender." />
            <BlurReveal as="span" class="text-co-coral" text=" Conecte-se!" :delay="0.6" />
          </h1>

          <p class="mt-7 max-w-xl text-lg leading-8 text-text-2 select-none">
            Conheça sua comunidade, tire as dúvidas pertinentes e encontre ajuda nos seus estudos!
          </p>

          <div class="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              class="group cursor-pointer inline-flex items-center justify-center gap-3 rounded-2xl bg-co-blue px-6 py-4 font-bold text-co-white shadow-xl shadow-co-blue/20 transition-all hover:bg-co-blue/90"
              @click="abrirComunidade">
              Quero fazer parte

              <font-awesome-icon :icon="faArrowRight" class="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div class="connection-tree relative mx-auto w-full max-w-[600px]" aria-hidden="true">
          <img src="../../assets/hero-tree.svg" alt="" class="h-auto w-full" />

          <div
            class="select-none connection-tree-note absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-traceline bg-co-white/90 px-4 py-2 text-xs font-semibold text-text-2 shadow-lg shadow-co-blue/10">
            Uma conversa Conecta a outra
          </div>
        </div>
      </section>

      <!-- POR QUE SAboooor! -->

      <section id="por-que" class="border-y border-traceline bg-s-blue/30 px-6 py-20 lg:px-10 lg:py-28">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-2xl">
            <p class="eyebrow text-2xl font-bold uppercase tracking-[0.16em] text-co-coral">
              Por que usar o Conecta?
            </p>

            <h2 class="type-h2 section-title mt-4 text-text-1">
              A vida universitária fica mais leve quando se é compartilhada
            </h2>

            <p class="mt-5 max-w-xl text-lg leading-8 text-text-2">
              Encontre pessoas que entendem sua rotina, seus desafios e as pequenas dúvidas do dia a dia na universidade
            </p>
          </div>

          <div class="mt-12 grid gap-5 select-none md:grid-cols-3">
            <article v-for="beneficio in beneficios" :key="beneficio.title"
              class="cursor-pointer rounded-2xl border border-traceline bg-co-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-co-coral hover:shadow-lg hover:shadow-co-blue/10">
              <div class="mb-10 grid h-11 w-11 place-items-center rounded-xl bg-s-coral text-co-coral">
                <font-awesome-icon :icon="beneficio.icon" />
              </div>

              <h3 class="type-h3 text-text-1">
                {{ beneficio.title }}
              </h3>

              <p class="mt-3 leading-7 text-text-2">
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

            <h2 class="type-h2 section-title mt-4 select-none">Você usa o Conecta do seu jeito.</h2>

            <p class="mt-6 leading-7 text-text-2 select-none">
              Você escolhe quando participar, com quem conversar e quais assuntos fazem sentido para
              você.
            </p>

            <a href="#comunidade"
              class="mt-8 inline-flex items-center gap-2 font-bold text-co-blue select-none hover:text-co-coral">
              Começar agora

              <font-awesome-icon :icon="faArrowRight" />
            </a>
          </div>

          <div class="space-y-9">
            <div v-for="passo in passos" :key="passo.number" class="flex gap-6 border-b border-traceline pb-9">
              <span class="font-sans text-sm font-bold text-co-coral">
                {{ passo.number }}
              </span>

              <div>
                <h3 class="type-h3">
                  {{ passo.title }}
                </h3>

                <p class="mt-2 leading-7 text-text-2">
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
          class="mx-auto max-w-7xl overflow-hidden rounded-[1rem] bg-co-blue px-8 py-14 text-center text-co-white sm:px-12 lg:py-20">
          <p class="font-sans select-none text-sm uppercase tracking-[.2em] text-s-blue">
            Conheça o Conecta
          </p>

          <h2 class="type-h2 mx-auto select-none mt-5 max-w-2xl">
            <span class="Texto-col text-co-coral">
              Estude,
            </span>
             <span class="Texto-col text-s-blue">
             converse 
            </span>
             <span class="Texto-col text-s-blue">
             e compartilhe
            </span>
             
            
          </h2>

          <button
            class="mt-9 cursor-pointer inline-flex items-center gap-3 rounded-2xl bg-co-coral px-7 py-4 font-bold text-co-white transition-colors hover:bg-co-coral/90"
            @click="abrirComunidade">
            Quero fazer parte

            <font-awesome-icon :icon="faArrowRight" />
          </button>
        </div>
      </section>
    </main>

    <!-- FOOTER -->

    <footer
      class="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-10 text-sm text-text-2 sm:flex-row sm:items-center sm:justify-between lg:px-10">
      <span class="text-[21px] font-bold tracking-[-.7px] text-co-blue">
        conecta<span class="text-co-coral">.</span>
      </span>

      <span> Feito por estudantes, para estudantes. </span>

      <span> © 2026 Conecta </span>
    </footer>

    <!-- AVISO -->
    <!-- Lembrando tudo que for mexer avise -->
    <div v-if="aviso"
      class="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-text-1 px-5 py-4 text-sm text-co-white shadow-2xl">
      <span>
        {{ aviso }}
      </span>

      <button class="text-s-blue hover:text-co-white" aria-label="Fechar aviso" @click="fecharAviso">
        <font-awesome-icon :icon="faXmark" />
      </button>
    </div>
  </div>
</template>