<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppArticle from '../ui/AppArticle.vue'
import AppButton from '../ui/AppButton.vue'
import AppCartaz from '../ui/AppCartaz.vue'
import AppLink from '../ui/AppLink.vue'
import AppLogo from '../ui/AppLogo.vue'
import heroTree from '../../assets/hero-tree.svg'

/**
 * Figma — Landpage (310:2)
 *
 * Frame raiz: 1920x2415. Blocos, na ordem do Figma:
 *   Navigation      310:3   y=0    1920x100
 *   Hero            333:344 y=180  1540x550
 *   Por que Conecta 385:157 y=810  1920x600
 *   Como Funciona   385:199 y=1490 1215x375
 *   Cartaz          399:278 y=1945 1280x350
 *   Footer          402:291 y=2345 1450x70
 *
 * Este arquivo substituirá o Landpage quando estiver completo.
 */
const beneficios = [
  {
    icon: 'hands' as const,
    title: 'Um lugar para conversar',
    text: 'Fale com outros estudantes que também passam pelos desafios da faculdade.',
  },
  {
    icon: 'book' as const,
    title: 'Estude com outras pessoas',
    text: 'Tire dúvidas, monte grupos de estudo e encontre quem está estudando as mesmas matérias.',
  },
  {
    icon: 'coletive' as const,
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

const secaoAtiva = ref<string | null>(null)

const router = useRouter()

/**
 * Os CTAs da Landpage levam ao fluxo de autenticação:
 *   Entrar / Conecte-se                        → modo login
 *   Inscreva-se / Quero participar / Começar    → modo cadastro
 */
function irParaAuth(modo: 'login' | 'register') {
  router.push({ path: '/login-v2', query: { modo } })
}

const offsets: Record<string, number> = {
  'por-que-conecta': 100,
  'como-funciona': 115,
  seguranca: 100,
}

/**
 * Rolagem suave até a âncora. No Figma a animação considera o header fixo
 * com offsets diferentes por seção:
 *   Por que Conecta: Y = -100
 *   Como funciona:   Y = -115
 */
function rolarPara(id: string) {
  if (id === 'topo') {
    const wrap = document.getElementById('landpage-scroll')
    if (wrap) {
      wrap.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    secaoAtiva.value = null
    return
  }

  const el = document.getElementById(id)
  if (!el) return

  const wrap = document.getElementById('landpage-scroll') as HTMLElement | null
  if (!wrap) {
    const offset = offsets[id] ?? 100
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
    secaoAtiva.value = id
    return
  }

  const offset = offsets[id] ?? 100
  const top = el.getBoundingClientRect().top + wrap.scrollTop - offset
  wrap.scrollTo({ top, behavior: 'smooth' })
  // Atualiza o estado ativo imediatamente para manter a animação
  secaoAtiva.value = id
}

let observer: IntersectionObserver | null = null
let scrollHandler: (() => void) | null = null

onMounted(() => {
  const html = document.documentElement
  const body = document.body
  html.style.overflow = 'hidden'
  html.style.height = '100vh'
  body.style.overflow = 'hidden'
  body.style.height = '100vh'
  body.style.margin = '0'

  const wrap = document.getElementById('landpage-scroll') as HTMLElement | null

  const secoes = ['por-que-conecta', 'como-funciona', 'seguranca']
    .map((id) => document.getElementById(id))
    .filter(Boolean) as HTMLElement[]

  observer = new IntersectionObserver(
    (entries) => {
      const rootEl = wrap || null
      const currentScroll = rootEl ? rootEl.scrollTop : window.scrollY

      // Se estamos no topo da página, nenhum item deve ficar ativo
      if (currentScroll < 50) {
        secaoAtiva.value = null
        return
      }

      // Pega a seção mais próxima do topo, considerando o header fixo
      const visiveis = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (visiveis.length) {
        secaoAtiva.value = visiveis[0].target.id
        return
      }

      // Se nenhuma está visível, vê qual passou pelo topo
      const posicoes = secoes
        .map((s) => ({ id: s.id, top: s.getBoundingClientRect().top }))
        .filter((s) => s.top < 200)
        .sort((a, b) => b.top - a.top)

      if (posicoes.length) {
        secaoAtiva.value = posicoes[0].id
      } else if (currentScroll < 50) {
        secaoAtiva.value = null
      }
    },
    {
      root: wrap,
      rootMargin: '-100px 0px -60% 0px',
      threshold: [0.1, 0.3, 0.6],
    },
  )

  secoes.forEach((s) => observer?.observe(s))

  // Também escuta o scroll para garantir que ao voltar ao topo limpe o estado
  scrollHandler = () => {
    const currentScroll = wrap ? wrap.scrollTop : window.scrollY
    if (currentScroll < 50) {
      secaoAtiva.value = null
    }
  }
  ;(wrap || window).addEventListener('scroll', scrollHandler, { passive: true })
})

onUnmounted(() => {
  const html = document.documentElement
  const body = document.body
  html.style.overflow = ''
  html.style.height = ''
  body.style.overflow = ''
  body.style.height = ''
  body.style.margin = ''

  const wrap = document.getElementById('landpage-scroll') as HTMLElement | null
  if (scrollHandler) {
    ;(wrap || window).removeEventListener('scroll', scrollHandler)
  }
  observer?.disconnect()
})
</script>

<template>
  <!-- Preview em tamanho real (1920); em telas menores a faixa rola na horizontal. -->
  <div
    id="landpage-scroll"
    class="h-screen w-screen overflow-auto bg-co-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
  >
    <main id="topo" class="relative mx-auto h-[2415px] w-[1920px]" aria-label="Landpage">
      <!-- ========== Navigation (310:3) — fixa no topo ========== -->
      <header
        class="fixed inset-x-0 top-0 z-50 flex h-[100px] items-center justify-center gap-[750px] bg-[rgba(248,247,244,0.75)] px-[240px] shadow-[0_20px_25px_-5px_rgba(223,226,235,0.55),0_8px_10px_-6px_rgba(223,226,235,0.55)] backdrop-blur-[10px]"
      >
        <button
          type="button"
          class="flex shrink-0 cursor-pointer items-center justify-center gap-[5px]"
          aria-label="Conecta"
          @click="rolarPara('topo')"
        >
          <AppLogo variant="logo-3" :width="100" :height="55" alt="" />
          <span
            class="font-display leading-[normal] font-bold whitespace-nowrap text-co-blue"
            :style="{ fontSize: '24px' }"
            >conecta<span class="text-co-coral">.</span></span
          >
        </button>

        <div class="flex h-[100px] w-[780px] shrink-0 items-center justify-center">
          <nav class="flex w-[400px] shrink-0 items-center justify-center gap-[30px]">
            <button
              type="button"
              class="text-h4 cursor-pointer whitespace-nowrap leading-[normal] transition-colors duration-300 motion-reduce:transition-none"
              :class="
                secaoAtiva === 'por-que-conecta'
                  ? 'text-co-coral'
                  : 'text-text-1 hover:text-co-coral'
              "
              @click="rolarPara('por-que-conecta')"
            >
              Por que Conecta
            </button>
            <button
              type="button"
              class="text-h4 cursor-pointer whitespace-nowrap leading-[normal] transition-colors duration-300 motion-reduce:transition-none"
              :class="
                secaoAtiva === 'como-funciona' ? 'text-co-coral' : 'text-text-1 hover:text-co-coral'
              "
              @click="rolarPara('como-funciona')"
            >
              Como funciona
            </button>
            <button
              type="button"
              class="text-h4 cursor-pointer whitespace-nowrap leading-[normal] transition-colors duration-300 motion-reduce:transition-none"
              :class="
                secaoAtiva === 'seguranca' ? 'text-co-coral' : 'text-text-1 hover:text-co-coral'
              "
              @click="rolarPara('seguranca')"
            >
              Segurança
            </button>
          </nav>

          <div
            class="flex h-[100px] w-[380px] shrink-0 items-center justify-center gap-5 px-[30px]"
          >
            <AppButton
              variant="coral-outline"
              :width="150"
              :padding-left="40"
              @click="irParaAuth('login')"
              >Entrar</AppButton
            >
            <AppButton variant="blue" :padding-left="15" @click="irParaAuth('register')"
              >Inscreva-se</AppButton
            >
          </div>
        </div>
      </header>

      <!-- ========== Hero (333:344) ========== -->
      <section
        class="absolute top-[180px] left-[190px] flex h-[550px] w-[1540px] items-center justify-between px-[110px]"
      >
        <div class="flex h-[550px] shrink-0 flex-col items-start justify-center gap-[30px]">
          <h1 class="text-h1 leading-[normal] text-co-blue">
            Um Lugar Amigável<br />para Aprender<span class="text-co-coral">.</span>
          </h1>
          <p class="w-[551px] text-h4 leading-[normal] text-text-2">
            Conheça seus veteranos, tire dúvidas pertinentes e encontre ajuda<br />no início da sua
            jornada de estudos!
          </p>
          <AppButton
            variant="coral"
            :width="160"
            :padding-left="13"
            :gap="13"
            :gap-hover="21"
            :label-size="20"
            @click="irParaAuth('login')"
            >Conecte-se</AppButton
          >
        </div>

        <img
          :src="heroTree"
          alt=""
          class="block h-[550px] w-[556px] shrink-0 max-w-none"
          draggable="false"
        />
      </section>

      <!-- ========== Por que Conecta (385:157) ========== -->
      <section
        id="por-que-conecta"
        class="absolute top-[810px] left-0 flex h-[600px] w-[1920px] flex-col items-start gap-[90px] bg-tree-bg px-[300px] py-[50px]"
      >
        <div class="flex w-[672px] shrink-0 flex-col items-start gap-5">
          <p class="text-h2 text-co-coral">Por que usar o Conecta?</p>
          <h2 class="text-h3 text-text-1">
            A vida universitária fica mais leve quando se é compartilhada
          </h2>
          <p class="text-h4 text-text-2">
            Encontre pessoas que entendem sua rotina, seus desafios e as pequenas<br />dúvidas do
            dia a dia na universidade
          </p>
        </div>

        <div class="flex w-full shrink-0 items-center justify-center gap-[30px]">
          <AppArticle
            v-for="item in beneficios"
            :key="item.title"
            :icon="item.icon"
            :title="item.title"
            :text="item.text"
          />
        </div>
      </section>

      <!-- ========== Como Funciona (385:199) ========== -->
      <section
        id="como-funciona"
        class="absolute top-[1490px] left-[353px] grid h-[375px] w-[1215px] grid-cols-[minmax(0,0.80fr)_minmax(0,1.20fr)] gap-[96px]"
      >
        <div class="flex shrink-0 flex-col items-start gap-4 self-start pb-[175px]">
          <p class="text-h5 leading-[normal] text-text-1">Como funciona</p>
          <p class="text-h5 leading-[normal] text-text-1">Você usa o Conecta do seu jeito.</p>
          <p class="text-h5 leading-[normal] text-text-2">
            Você escolhe quando participar, com quem conversar e quais<br />assuntos fazem sentido
            para você.
          </p>
          <AppLink href="#seguranca" @click.prevent="irParaAuth('register')">Começar agora</AppLink>
        </div>

        <div class="flex w-full flex-col gap-9">
          <div
            v-for="passo in passos"
            :key="passo.number"
            class="flex w-full items-start gap-6 border-b border-traceline pb-9"
          >
            <span class="text-h6 text-co-coral">{{ passo.number }}</span>
            <div class="flex flex-col items-start gap-2">
              <p class="text-h3 text-text-1">{{ passo.title }}</p>
              <p class="text-h5 text-text-2">{{ passo.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== Cartaz (399:278) ========== -->
      <AppCartaz class="absolute top-[1945px] left-[320px]" @cta="irParaAuth('register')" />

      <!-- ========== Footer (402:291) ========== -->
      <footer
        class="absolute top-[2345px] left-1/2 flex h-[70px] w-[1450px] -translate-x-1/2 items-center justify-center gap-[390px] whitespace-nowrap px-[520px]"
      >
        <span
          class="font-display leading-[normal] font-bold whitespace-nowrap text-co-blue"
          :style="{ fontSize: '20px' }"
          >conecta<span class="text-co-coral">.</span></span
        >
        <p class="text-h6 leading-[normal] whitespace-nowrap text-text-2">
          Feito por estudantes, para estudantes.
        </p>
        <p class="text-h6 leading-[normal] whitespace-nowrap text-text-2">© 2026 Conecta</p>
      </footer>
    </main>
  </div>
</template>
