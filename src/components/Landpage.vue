<script setup>
import { ref } from "vue";
import {
  ArrowRight,
  BookOpen,
  Check,
  HeartHandshake,
  LockKeyhole,
  Menu,
  MessageCircle,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "@lucide/vue";

const menuAberto = ref(false);
const aviso = ref("");

function abrirComunidade() {
  aviso.value = "Perfeito. Sua jornada no Conecta começa agora.";
  document.querySelector("#comunidade")?.scrollIntoView({ behavior: "smooth" });
}

function fecharAviso() {
  aviso.value = "";
}

const beneficios = [
  {
    icon: HeartHandshake,
    title: "Apoio sem julgamento",
    text:
      "Encontre pessoas que entendem a pressão da faculdade e estão prontas para ouvir.",
  },
  {
    icon: BookOpen,
    title: "Estude acompanhado",
    text:
      "Crie salas, tire dúvidas e mantenha o foco com quem está vivendo o mesmo desafio.",
  },
  {
    icon: Users,
    title: "Conexões de verdade",
    text: "Faça amizades que começam em uma conversa e continuam para além da tela.",
  },
];

const passos = [
  {
    number: "01",
    title: "Escolha como você está",
    text: "Compartilhe seu momento ou apenas passe para descobrir novas conversas.",
  },
  {
    number: "02",
    title: "Encontre sua sala",
    text: "Entre em grupos sobre ansiedade, rotina, provas, carreira e muito mais.",
  },
  {
    number: "03",
    title: "Sinta que pertence",
    text: "Converse no seu ritmo e construa uma rede para chamar de sua.",
  },
];
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#f8f7f4] text-[#19253d]">
    <header
      class="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10"
    >
      <a href="#inicio" class="flex items-center gap-3" aria-label="Conecta, início">
        <span
          class="grid h-10 w-10 place-items-center rounded-2xl bg-[#263b73] text-lg font-bold text-white shadow-lg shadow-[#263b73]/15"
          >C</span
        >
        <span class="font-mono text-lg font-semibold tracking-tight"
          >conecta<span class="text-[#ec765d]">.</span></span
        >
      </a>
      <nav
        class="hidden items-center gap-8 text-sm font-medium text-[#667087] md:flex"
        aria-label="Navegação principal"
      >
        <a class="transition-colors hover:text-[#263b73]" href="#por-que"
          >Por que o Conecta</a
        >
        <a class="transition-colors hover:text-[#263b73]" href="#como-funciona"
          >Como funciona</a
        >
        <a class="transition-colors hover:text-[#263b73]" href="#seguranca">Segurança</a>
      </nav>
      <button
        class="hidden cursor-pointer rounded-full bg-[#ec765d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#ec765d]/20 transition-transform hover:-translate-y-0.5 md:block"
        @click="abrirComunidade"
      >
        Entrar na comunidade
      </button>
      <button
        class="rounded-xl p-2 text-[#263b73] md:hidden"
        :aria-expanded="menuAberto"
        aria-label="Abrir menu"
        @click="menuAberto = !menuAberto"
      >
        <X v-if="menuAberto" :size="24" />
        <Menu v-else :size="24" />
      </button>
    </header>
    <div
      v-if="menuAberto"
      class="relative z-20 mx-6 rounded-2xl border border-[#dfe2eb] bg-white p-4 shadow-xl md:hidden"
    >
      <nav class="flex flex-col gap-4 text-sm font-medium text-[#667087]">
        <a href="#por-que" @click="menuAberto = false">Por que o Conecta</a>
        <a href="#como-funciona" @click="menuAberto = false">Como funciona</a>
        <a href="#seguranca" @click="menuAberto = false">Segurança</a>
      </nav>
    </div>

    <main id="inicio">
      <section
        class="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-12 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-32 lg:pt-20"
      >
        <div class="relative z-10">
          <div
            class="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe2eb] bg-white/70 px-3 py-2 text-xs font-semibold text-[#667087] shadow-sm"
          >
            <Sparkles :size="14" class="text-[#ec765d]" /> Um espaço feito para a vida
            universitária
          </div>
          <h1
            class=" select-none max-w-3xl font-sans text-5xl font-semibold leading-[1.03] tracking-[-0.06em] text-[#19253d] sm:text-6xl lg:text-7xl"
          >
            Você não precisa enfrentar a faculdade
            <span class="text-[#ec765d]">sozinho.</span>
          </h1>
          <p class="mt-7 max-w-xl text-lg leading-8 text-[#667087] select-none">
            O Conecta é o lugar onde estudantes se apoiam, estudam juntos e encontram
            leveza para seguir em frente.
          </p>
          <div class="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              class="group cursor-pointer inline-flex items-center justify-center gap-3 rounded-full bg-[#263b73] px-6 py-4 font-bold text-white shadow-xl shadow-[#263b73]/20 transition-all hover:-translate-y-1 hover:bg-[#1e315f]"
              @click="abrirComunidade"
            >
              Quero fazer parte
              <ArrowRight
                :size="18"
                class="transition-transform group-hover:translate-x-1"
              />
            </button>
            <a
              href="#como-funciona"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe2eb] bg-white px-6 py-4 font-bold text-[#263b73] transition-colors hover:border-[#263b73]"
              >Entenda como funciona</a
            >
          </div>
          <div class="mt-10 flex items-center gap-3 text-sm text-[#667087]">
            <span class="flex -space-x-2"
              ><span class="avatar bg-[#f2b7a8]">L</span
              ><span class="avatar bg-[#a9b7e5]">M</span
              ><span class="avatar bg-[#c4d5bf]">R</span></span
            ><span
              ><strong class="text-[#19253d]">+2.400 estudantes</strong> já estão
              conectados</span
            >
          </div>
        </div>

        <div class="relative mx-auto h-[440px] w-full max-w-[520px] lg:h-[520px]">
          <div
            class="absolute inset-x-8 top-5 h-[390px] rotate-[-5deg] rounded-[2.5rem] bg-[#d9def0] lg:inset-x-12 lg:h-[450px]"
          ></div>
          <div
            class="absolute inset-x-0 top-0 rounded-[2.5rem] border border-white/80 bg-white p-5 shadow-2xl shadow-[#263b73]/10 sm:p-7"
          >
            <div class="flex items-center justify-between border-b border-[#edf0f5] pb-5">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[.18em] text-[#98a0b3]"
                >
                  sua comunidade
                </p>
                <h2 class="mt-1 text-xl font-bold">Perto de você</h2>
              </div>
              <span
                class="grid h-10 w-10 place-items-center rounded-full bg-[#eef0fb] text-[#263b73]"
                ><Users :size="19"
              /></span>
            </div>
            <div class="mt-5 space-y-3">
              <div class="flex items-center gap-4 rounded-2xl bg-[#f8f7f4] p-4">
                <div
                  class="grid h-11 w-11 place-items-center rounded-xl bg-[#f5d7d0] text-[#b95b48]"
                >
                  <HeartHandshake :size="21" />
                </div>
                <div class="flex-1">
                  <p class="font-bold">Ansiedade na faculdade</p>
                  <p class="mt-1 text-xs text-[#98a0b3]">428 pessoas conversando agora</p>
                </div>
                <MessageCircle :size="18" class="text-[#98a0b3]" />
              </div>
              <div class="flex items-center gap-4 rounded-2xl bg-[#f8f7f4] p-4">
                <div
                  class="grid h-11 w-11 place-items-center rounded-xl bg-[#dce7ef] text-[#41657b]"
                >
                  <BookOpen :size="21" />
                </div>
                <div class="flex-1">
                  <p class="font-bold">Foco para provas</p>
                  <p class="mt-1 text-xs text-[#98a0b3]">Sala de estudo • 86 online</p>
                </div>
                <MessageCircle :size="18" class="text-[#98a0b3]" />
              </div>
              <div class="flex items-center gap-4 rounded-2xl bg-[#f8f7f4] p-4">
                <div
                  class="grid h-11 w-11 place-items-center rounded-xl bg-[#e5def2] text-[#725e9b]"
                >
                  <PenLine :size="21" />
                </div>
                <div class="flex-1">
                  <p class="font-bold">Primeiro semestre</p>
                  <p class="mt-1 text-xs text-[#98a0b3]">Conversas • 1.204 membros</p>
                </div>
                <MessageCircle :size="18" class="text-[#98a0b3]" />
              </div>
            </div>
          </div>
          <div
            class="absolute -bottom-2 -left-2 flex max-w-[250px] items-center gap-3 rounded-2xl border border-white bg-[#263b73] p-4 text-white shadow-xl sm:-left-8"
          >
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#5369a3]"
              ><MessageCircle :size="18"
            /></span>
            <div>
              <p class="text-sm font-bold">Você está acompanhado.</p>
              <p class="mt-1 text-xs text-[#c8d1ed]">Uma conversa pode mudar o dia.</p>
            </div>
          </div>
          <div
            class="absolute -right-2 top-32 hidden items-center gap-2 rounded-full border border-[#dfe2eb] bg-white px-4 py-3 text-xs font-bold shadow-lg sm:flex"
          >
            <span class="h-2 w-2 rounded-full bg-[#6eaa83]"></span> ambiente acolhedor
          </div>
        </div>
      </section>

      <section
        id="por-que"
        class="border-y border-[#e5e6eb] bg-white/60 px-6 py-20 lg:px-10 lg:py-28"
      >
        <div class="mx-auto max-w-7xl">
          <div class="max-w-xl">
            <p class="eyebrow">Mais do que um servidor</p>
            <h2 class="section-title mt-4">
              Um lugar para você ser você, sem precisar dar conta de tudo.
            </h2>
          </div>
          <div class="mt-14 grid gap-5 md:grid-cols-3">
            <article
              v-for="beneficio in beneficios"
              :key="beneficio.title"
              class="rounded-3xl border border-[#e5e6eb] bg-[#f8f7f4] p-7 transition-transform hover:-translate-y-1"
            >
              <div
                class="mb-12 grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#263b73] shadow-sm"
              >
                <component :is="beneficio.icon" :size="22" />
              </div>
              <h3 class="text-xl font-bold">{{ beneficio.title }}</h3>
              <p class="mt-3 leading-7 text-[#667087]">{{ beneficio.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="como-funciona" class="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-32">
        <div class="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <p class="eyebrow select-none">Do seu jeito</p>
            <h2 class="section-title mt-4 select-none">Conexão que cabe na sua rotina.</h2>
            <p class="mt-6 leading-7 text-[#667087] select-none">
              Você decide quando falar, o que compartilhar e quais comunidades fazem
              sentido para o seu momento.
            </p>
            <a
              href="#comunidade"
              class="mt-8 inline-flex items-center gap-2 font-bold text-[#263b73] select-none hover:text-[#ec765d]"
              >Começar agora <ArrowRight :size="17"
            /></a>
          </div>
          <div class="space-y-9">
            <div
              v-for="passo in passos"
              :key="passo.number"
              class="flex gap-6 border-b border-[#e5e6eb] pb-9"
            >
              <span class="font-mono text-sm font-bold text-[#ec765d]">{{
                passo.number
              }}</span>
              <div>
                <h3 class="text-xl font-bold">{{ passo.title }}</h3>
                <p class="mt-2 leading-7 text-[#667087]">{{ passo.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="seguranca" class="px-6 pb-20 lg:px-10 lg:pb-28">
        <div
          class="mx-auto grid max-w-7xl items-center gap-10 rounded-[2rem] bg-[#e9ecf8] p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:p-16"
        >
          <div>
            <div class="flex items-center gap-3 text-[#263b73]">
              <ShieldCheck :size="22" />
              <p class="eyebrow !text-[#263b73] select-none">Cuidado em primeiro lugar</p>
            </div>
            <h2
              class="mt-5 select-none max-w-2xl text-3xl font-semibold tracking-tight text-[#19253d] sm:text-4xl"
            >
              Um espaço seguro para conversas reais.
            </h2>
            <p class="mt-5 max-w-2xl leading-7 text-[#667087] select-none">
              O Conecta promove apoio entre pares, mas não substitui ajuda profissional.
              Se você estiver em risco, procure o CVV (188) ou um serviço de emergência.
            </p>
          </div>
          <div
            class="grid h-20 w-20 place-items-center rounded-3xl bg-white text-[#263b73] shadow-sm"
          >
            <LockKeyhole :size="28" />
          </div>
        </div>
      </section>

      <section id="comunidade" class="px-6 pb-20 lg:px-10 lg:pb-28">
        <div
          class="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#263b73] px-8 py-14 text-center text-white sm:px-12 lg:py-20"
        >
          <p class="font-mono select-none text-sm uppercase tracking-[.2em] text-[#bfc9e7]">
            Seu próximo capítulo começa aqui
          </p>
          <h2
            class="mx-auto select-none mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Faculdade é difícil. Você não precisa torná-la solitária.
          </h2>
          <button
            class="mt-9 cursor-pointer inline-flex items-center gap-3 rounded-full bg-[#ec765d] px-7 py-4 font-bold text-white transition-transform hover:-translate-y-1"
            @click="aviso = 'Você entrou na lista. Em breve, o Conecta estará com você.'"
          >
            Entrar na comunidade <ArrowRight :size="18" />
          </button>
        </div>
      </section>
    </main>

    <footer
      class="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-10 text-sm text-[#98a0b3] sm:flex-row sm:items-center sm:justify-between lg:px-10"
    >
      <span class="font-mono font-semibold text-[#263b73]"
        >conecta<span class="text-[#ec765d]">.</span></span
      ><span>Feito para estudantes, por estudantes.</span><span>© 2026 Conecta</span>
    </footer>

    <div
      v-if="aviso"
      class="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-[#19253d] px-5 py-4 text-sm text-white shadow-2xl"
    >
      <span>{{ aviso }}</span
      ><button
        class="text-[#bfc9e7] hover:text-white"
        aria-label="Fechar aviso"
        @click="fecharAviso"
      >
        <X :size="18" />
      </button>
    </div>
  </div>
</template>
