<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'

import AppArticle from '../../../shared/ui/AppArticle.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCartaz from '../../../shared/ui/AppCartaz.vue'
import AppLink from '../../../shared/ui/AppLink.vue'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import BlurReveal from '../../../shared/ui/BlurReveal.vue'
import heroTree from '../../../assets/images/hero-tree.svg'

/**
 * Figma — Landpage (310:2)
 *
 * Blocos do Figma, agora em fluxo normal (e não mais em canvas fixo de 1920):
 *   Navigation      310:3   header fixo
 *   Hero            333:344 título + texto + CTA + árvore
 *   Por que Conecta 385:157 faixa verde com 3 cards
 *   Como Funciona   385:199 texto + 3 passos
 *   Cartaz          399:278 bloco azul com CTA
 *   Footer          402:291
 *
 * O layout empilha no mobile e vira grid a partir de `lg`, mantendo as cores,
 * tipografia e componentes do Figma (AppArticle, AppCartaz, AppButton, AppLink).
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

const router = useRouter()

const menuAberto = ref(false)
const secaoAtiva = ref<string | null>(null)
const headerElevado = ref(false)

/**
 * Os CTAs da Landpage levam ao fluxo de autenticação:
 *   Entrar / Conecte-se                        → modo login
 *   Inscreva-se / Quero participar / Começar    → modo cadastro
 */
function irParaAuth(modo: 'login' | 'register') {
  menuAberto.value = false
  router.push({ path: '/login', query: { modo } })
}

/** Rolagem suave até a âncora, descontando o header fixo via `scroll-mt`. */
function rolarPara(id: string) {
  menuAberto.value = false

  if (id === 'topo') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    secaoAtiva.value = null
    return
  }

  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  secaoAtiva.value = id
}

// "seguranca" entra na lista para quando a seção/tela existir.
const secoes = ['por-que-conecta', 'como-funciona', 'seguranca']

let observer: IntersectionObserver | null = null

function aoRolar() {
  headerElevado.value = window.scrollY > 8
  if (window.scrollY < 80) secaoAtiva.value = null
}

onMounted(() => {
  window.addEventListener('scroll', aoRolar, { passive: true })
  aoRolar()

  // Mantém o item ativo do menu sincronizado com a seção visível.
  observer = new IntersectionObserver(
    (entries) => {
      const visiveis = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (visiveis.length) {
        secaoAtiva.value = visiveis[0].target.id
      }
    },
    { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
  )

  secoes.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer?.observe(el)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', aoRolar)
  observer?.disconnect()
})
</script>

<template>
  <div class="min-h-dvh overflow-x-hidden bg-co-white text-text-1">
    <!-- ========== Navigation (310:3) — fixa no topo ========== -->
    <header
      class="fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none"
      :class="
        headerElevado
          ? 'border-traceline bg-co-white/90 shadow-[0_10px_30px_-18px_rgba(25,37,61,0.45)] backdrop-blur-[10px]'
          : 'border-transparent bg-co-white/75 backdrop-blur-[10px]'
      "
    >
      <div
        class="mx-auto flex h-[72px] w-full max-w-[1920px] items-center justify-between gap-4 px-5 sm:h-[88px] sm:px-8 lg:h-[100px] lg:px-10 xl:px-[90px]"
      >
        <button
          type="button"
          class="flex shrink-0 cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0"
          aria-label="Conecta, ir para o topo"
          @click="rolarPara('topo')"
        >
          <AppLogo variant="logo-3" :width="72" :height="40" alt="" class="xl:hidden" />
          <AppLogo variant="logo-3" :width="100" :height="55" alt="" class="hidden xl:block" />
          <AppLogo variant="conecta" :font-size="20" alt="" class="sm:hidden" />
          <AppLogo variant="conecta" :font-size="24" alt="" class="hidden sm:inline" />
        </button>

        <!-- Figma (310:3): o menu NÃO é centralizado. Logo à esquerda e o bloco
             "Menu & Login" (780px) à direita — menu com gap de 30px e, entre o
             último item e os botões, o padding-left de 30px do bloco de botões. -->
        <div class="hidden items-center xl:flex">
          <nav class="flex items-center gap-[30px]" aria-label="Navegação principal">
            <button
              type="button"
              class="cursor-pointer border-0 bg-transparent p-0 text-h4 whitespace-nowrap leading-[normal] transition-colors duration-300 motion-reduce:transition-none"
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
              class="cursor-pointer border-0 bg-transparent p-0 text-h4 whitespace-nowrap leading-[normal] transition-colors duration-300 motion-reduce:transition-none"
              :class="
                secaoAtiva === 'como-funciona' ? 'text-co-coral' : 'text-text-1 hover:text-co-coral'
              "
              @click="rolarPara('como-funciona')"
            >
              Como funciona
            </button>
            <!-- Segurança ainda não tem seção própria: quando a tela chegar,
                 basta dar o id "seguranca" ao destino (ou trocar por router.push). -->
            <button
              type="button"
              class="cursor-pointer border-0 bg-transparent p-0 text-h4 whitespace-nowrap leading-[normal] transition-colors duration-300 motion-reduce:transition-none"
              :class="
                secaoAtiva === 'seguranca' ? 'text-co-coral' : 'text-text-1 hover:text-co-coral'
              "
              @click="rolarPara('seguranca')"
            >
              Segurança
            </button>
          </nav>

          <!-- 380px no Figma: 30px de padding em cada lado + 150 + 20 + 150. -->
          <div class="flex shrink-0 items-center gap-5 px-[30px]">
            <AppButton variant="coral-outline" @click="irParaAuth('login')">Entrar</AppButton>
            <AppButton variant="blue" :padding-left="15" @click="irParaAuth('register')">
              Inscreva-se
            </AppButton>
          </div>
        </div>

        <button
          type="button"
          class="grid size-11 cursor-pointer place-items-center rounded-xl border-0 bg-transparent p-0 text-co-blue transition-colors hover:bg-s-blue/30 xl:hidden"
          :aria-expanded="menuAberto"
          aria-controls="menu-mobile"
          :aria-label="menuAberto ? 'Fechar menu' : 'Abrir menu'"
          @click="menuAberto = !menuAberto"
        >
          <font-awesome-icon :icon="menuAberto ? faXmark : faBars" class="size-5" />
        </button>
      </div>

      <!-- Menu mobile -->
      <div
        v-if="menuAberto"
        id="menu-mobile"
        class="absolute inset-x-0 top-full border-b border-traceline bg-co-white px-5 pb-6 pt-2 shadow-[0_24px_40px_-24px_rgba(25,37,61,0.45)] sm:px-8 xl:hidden"
      >
        <nav class="flex flex-col" aria-label="Navegação principal (mobile)">
          <button
            type="button"
            class="cursor-pointer border-0 border-b border-traceline bg-transparent px-0 py-4 text-left text-h4 text-text-1"
            @click="rolarPara('por-que-conecta')"
          >
            Por que Conecta
          </button>
          <button
            type="button"
            class="cursor-pointer border-0 border-b border-traceline bg-transparent px-0 py-4 text-left text-h4 text-text-1"
            @click="rolarPara('como-funciona')"
          >
            Como funciona
          </button>
          <button
            type="button"
            class="cursor-pointer border-0 border-b border-traceline bg-transparent px-0 py-4 text-left text-h4 text-text-1"
            @click="rolarPara('seguranca')"
          >
            Segurança
          </button>
        </nav>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <AppButton
            variant="coral-outline"
            :width="140"
            :padding-left="30"
            @click="irParaAuth('login')"
          >
            Entrar
          </AppButton>
          <AppButton variant="blue" :width="150" :padding-left="30" @click="irParaAuth('register')">
            Inscreva-se
          </AppButton>
        </div>
      </div>
    </header>

    <main id="topo" class="pt-[72px] sm:pt-[88px] lg:pt-[100px]" aria-label="Landpage">
      <!-- ========== Hero (333:344) ========== -->
      <section
        class="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16"
      >
        <div class="flex flex-col items-start gap-6 sm:gap-7">
          <p class="text-h6 leading-[normal] text-co-coral">
            BEM-VINDO AO <span class="text-co-blue">CONECTA.</span>
          </p>

          <h1
            class="text-[38px] leading-[0.98] tracking-[-2px] text-co-blue select-none sm:text-[52px] sm:tracking-[-3px] lg:text-h1"
          >
            <BlurReveal as="span" text="Um Lugar Amigável" />
            <br />
            <BlurReveal as="span" class="hero-title-tail" text="para Aprender." :delay="0.5" />
          </h1>

          <p class="max-w-[551px] text-h5 leading-[1.5] text-text-2 sm:text-h4 sm:leading-[1.4]">
            Conheça seus veteranos, tire dúvidas pertinentes e encontre ajuda no início da sua
            jornada de estudos!
          </p>

          <AppButton
            variant="coral"
            :width="170"
            :padding-left="14"
            :gap="13"
            :gap-hover="21"
            label-variant="h3"
            @click="irParaAuth('login')"
          >
            Conecte-se
          </AppButton>
        </div>

        <img
          :src="heroTree"
          alt=""
          class="mx-auto block h-auto w-full max-w-[320px] shrink-0 sm:max-w-[420px] lg:max-w-[556px]"
          draggable="false"
        />
      </section>

      <!-- ========== Por que Conecta (385:157) ========== -->
      <section
        id="por-que-conecta"
        class="scroll-mt-[72px] border-y border-traceline bg-tree-bg px-5 py-16 sm:scroll-mt-[88px] sm:px-8 sm:py-20 lg:scroll-mt-[100px] lg:px-10 lg:py-24"
      >
        <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-10 lg:gap-[90px]">
          <div class="flex max-w-[672px] flex-col items-start gap-5">
            <p class="text-h2 leading-[1.1] text-co-coral">Por que usar o Conecta?</p>
            <h2
              class="text-h2 leading-[1.2] tracking-[-0.2px] text-text-1 lg:text-h3 lg:leading-[1.15]"
            >
              A vida universitária fica mais leve quando se é compartilhada
            </h2>
            <p class="text-h5 leading-[1.5] text-text-2 lg:text-h4 lg:leading-[1.4]">
              Encontre pessoas que entendem sua rotina, seus desafios e as pequenas dúvidas do dia a
              dia na universidade.
            </p>
          </div>

          <!-- Cards: centralizados abaixo de lg (o terceiro card ocupa as duas
               colunas no tablet para não ficar sozinho à esquerda). -->
          <div class="grid justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
            <AppArticle
              v-for="(item, index) in beneficios"
              :key="item.title"
              :icon="item.icon"
              :title="item.title"
              :text="item.text"
              :class="
                index === beneficios.length - 1 ? 'sm:col-span-2 sm:w-full lg:col-span-1' : ''
              "
            />
          </div>
        </div>
      </section>

      <!-- ========== Como Funciona (385:199) ========== -->
      <section
        id="como-funciona"
        class="scroll-mt-[72px] px-5 py-16 sm:scroll-mt-[88px] sm:px-8 sm:py-20 lg:scroll-mt-[100px] lg:px-10 lg:py-24"
      >
        <div
          class="mx-auto grid w-full max-w-[1215px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24"
        >
          <div class="flex flex-col items-start gap-4">
            <p class="text-h5 leading-[normal] text-text-1">Como funciona</p>
            <h2 class="text-h2 leading-[1.2] text-text-1 sm:text-[28px]">
              Você usa o Conecta do seu jeito.
            </h2>
            <p class="text-h5 leading-[1.5] text-text-2">
              Você escolhe quando participar, com quem conversar e quais assuntos fazem sentido para
              você.
            </p>
            <AppLink
              href="/login?modo=register"
              class="mt-2"
              @click.prevent="irParaAuth('register')"
            >
              Começar agora
            </AppLink>
          </div>

          <div class="flex w-full flex-col gap-9">
            <div
              v-for="passo in passos"
              :key="passo.number"
              class="flex w-full items-start gap-5 border-b border-traceline pb-9 sm:gap-6"
            >
              <span class="text-h6 text-co-coral">{{ passo.number }}</span>
              <div class="flex flex-col items-start gap-2">
                <p class="text-h3 text-text-1">{{ passo.title }}</p>
                <p class="text-h5 leading-[1.45] text-text-2">{{ passo.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== Cartaz (399:278) ========== -->
      <section class="px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <AppCartaz class="mx-auto" @cta="irParaAuth('register')" />
      </section>
    </main>

    <!-- ========== Footer (402:291) ========== -->
    <footer class="border-t border-traceline">
      <div
        class="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-4 px-5 py-8 text-center text-h6 leading-[normal] text-text-2 sm:flex-row sm:justify-between sm:px-8 sm:text-left lg:px-10"
      >
        <AppLogo variant="conecta" :font-size="20" alt="" />
        <p>Feito por estudantes, para estudantes.</p>
        <p>© 2026 Conecta</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* O ponto final continua coral mesmo dentro do BlurReveal (último caractere). */
.hero-title-tail :deep(.blur-reveal-word:last-child .blur-reveal-char:last-child) {
  color: var(--color-co-coral);
}
</style>
