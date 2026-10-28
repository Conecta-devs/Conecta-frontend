<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '../../../shared/ui/AppButton.vue'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import coletiveIcon from '../../../assets/icons/coletive-white.svg'
import orbitInner from '../../../assets/decorations/orbit.svg'
import orbitOuter from '../../../assets/decorations/orbit2.svg'

/**
 * Figma — painel de apresentação das telas de recuperação de senha.
 *
 *   form    = 760:612 / 760:667 (azul, 750 × 911)
 *   sucesso = 760:726 (verde, 1920 × 911)
 *
 * Nos dois estados o painel é uma coluna com três blocos separados por 250px:
 * marca (91, 22), mensagem (91, 327.45) e rodapé — assinatura em 877.45 no
 * azul, botão em 793.45 no verde. O `justify-between` reproduz essas posições
 * exatamente num frame de 911px e comprime em janelas mais baixas, sem scroll.
 *
 * Os halos são os mesmos SVGs da Landpage/Login: 590px (orbit.svg) e 670px
 * (orbit2.svg) com o frame de 590/510 do Figma. O par inferior fica sempre
 * visível; o par superior direito só entra no estado de sucesso.
 *
 * A descrição é `co-white` nos dois frames de recuperação (760:636/760:691),
 * diferente do Login (506:1710), que usa `s-coral`.
 */
const props = withDefaults(
  defineProps<{
    /** 'form' = painel azul de 750px; 'sucesso' = tela cheia verde. */
    estado?: 'form' | 'sucesso'
  }>(),
  {
    estado: 'form',
  },
)

const router = useRouter()

const sucesso = computed(() => props.estado === 'sucesso')

/** Título e descrição de cada frame (760:635/760:636 e 760:742/760:743). */
const textos = computed(() =>
  sucesso.value
    ? {
        titulo: ['Senha redefinida com sucesso!'],
        descricao: [
          'Agora você pode entrar com sua nova senha',
          'e continuar se conectando com outros estudantes.',
        ],
      }
    : {
        titulo: ['Conecte-se com', 'quem entende você.'],
        descricao: [
          'Conheça novos estudantes, encontre seu grupo',
          'e construa novas histórias dentro e fora da sala.',
        ],
      },
)

function voltarAoLogin() {
  void router.push('/login')
}
</script>

<template>
  <section
    class="auth-showcase flex shrink-0 flex-col justify-between overflow-hidden px-5 pt-4 text-co-white sm:px-8 sm:pt-6 lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:pl-10 lg:pr-0 lg:pt-[30px] lg:transition-[width,background-color] lg:duration-300 lg:ease-out motion-reduce:transition-none xl:pl-[90px] xl:pt-[22px]"
    :class="
      sucesso
        ? 'fixed inset-0 z-40 w-auto bg-tree-green pb-6 lg:w-full lg:pb-[68px]'
        : 'relative bg-co-blue pb-6 lg:w-[750px] lg:pb-[18px]'
    "
  >
    <!-- Par inferior (760:613/760:614) — camada casada: mesmo centro nos
         dois estados. Abaixo de lg acompanha a proporção do painel. -->
    <img
      :src="orbitInner"
      alt=""
      class="pointer-events-none absolute right-[20.4%] -bottom-[8.1%] size-[min(79vw,590px)] translate-x-1/2 translate-y-1/2 lg:right-auto lg:bottom-[-221px] lg:left-[302px] lg:size-[590px] lg:translate-x-0 lg:translate-y-0"
      draggable="false"
    />
    <img
      :src="orbitOuter"
      alt=""
      class="pointer-events-none absolute right-[20.4%] -bottom-[8.1%] size-[min(89.4vw,670px)] translate-x-1/2 translate-y-1/2 lg:right-auto lg:bottom-[-261px] lg:left-[262px] lg:size-[670px] lg:translate-x-0 lg:translate-y-0"
      draggable="false"
    />

    <!-- Par superior direito (760:729/760:730) — só no sucesso, fade de 300ms. -->
    <img
      :src="orbitInner"
      alt=""
      class="pointer-events-none absolute top-[10%] right-[10%] size-[min(79vw,590px)] translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-out motion-reduce:transition-none lg:top-[-155px] lg:right-[-218px] lg:size-[590px] lg:translate-x-0 lg:translate-y-0"
      :class="sucesso ? 'opacity-100' : 'opacity-0'"
      draggable="false"
    />
    <img
      :src="orbitOuter"
      alt=""
      class="pointer-events-none absolute top-[10%] right-[10%] size-[min(89.4vw,670px)] translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-out motion-reduce:transition-none lg:top-[-195px] lg:right-[-258px] lg:size-[670px] lg:translate-x-0 lg:translate-y-0"
      :class="sucesso ? 'opacity-100' : 'opacity-0'"
      draggable="false"
    />

    <!-- Marca (760:615 / 760:731): 100 × 55.45 em (91, 22) no desktop;
         72 × 40 abaixo de xl. No sucesso troca logo-2 → logo-1 em cross-fade. -->
    <RouterLink
      to="/"
      class="relative z-10 h-10 w-[72px] shrink-0 xl:h-[55px] xl:w-[100px]"
      aria-label="Conecta, voltar ao início"
    >
      <AppLogo
        variant="logo-2"
        :width="72"
        :height="40"
        alt=""
        class="absolute inset-0 transition-opacity duration-300 ease-out motion-reduce:transition-none xl:hidden"
        :class="sucesso ? 'opacity-0' : 'opacity-100'"
      />
      <AppLogo
        variant="logo-1"
        :width="72"
        :height="40"
        alt=""
        class="absolute inset-0 transition-opacity duration-300 ease-out motion-reduce:transition-none xl:hidden"
        :class="sucesso ? 'opacity-100' : 'opacity-0'"
      />
      <AppLogo
        variant="logo-2"
        :width="100"
        :height="55"
        alt=""
        class="absolute inset-0 hidden transition-opacity duration-300 ease-out motion-reduce:transition-none xl:block"
        :class="sucesso ? 'opacity-0' : 'opacity-100'"
      />
      <AppLogo
        variant="logo-1"
        :width="100"
        :height="55"
        alt=""
        class="absolute inset-0 hidden transition-opacity duration-300 ease-out motion-reduce:transition-none xl:block"
        :class="sucesso ? 'opacity-100' : 'opacity-0'"
      />
    </RouterLink>

    <!-- Mensagem (760:634 / 760:741): título, descrição e comunidade, gap 20. -->
    <div class="relative z-10 flex w-full shrink-0 flex-col gap-5 py-6 sm:py-8 lg:py-0">
      <div
        class="text-[32px] leading-[1.05] tracking-[-1.5px] sm:text-[48px] sm:tracking-[-2.5px] lg:text-h1 lg:leading-[normal] lg:tracking-[-5px]"
      >
        <p v-for="linha in textos.titulo" :key="linha" class="leading-[normal]">{{ linha }}</p>
      </div>
      <div
        class="text-h5 leading-[1.4] sm:text-h4 sm:leading-[normal]"
        :class="sucesso ? 'text-s-coral' : 'text-co-white'"
      >
        <p v-for="linha in textos.descricao" :key="linha" class="leading-[inherit]">{{ linha }}</p>
      </div>

      <div class="hidden shrink-0 items-center justify-center gap-[10px] sm:flex">
        <img :src="coletiveIcon" alt="" class="size-[50px] shrink-0" draggable="false" />
        <p class="text-h6 leading-[normal] text-s-blue">Comunidade feita para você</p>
      </div>
    </div>

    <!-- Rodapé: assinatura (azul) ou CTA (verde, 760:750 — 260 × 50 a 230px
         da borda direita). -->
    <div
      class="relative z-10 flex w-full shrink-0 items-end"
      :class="sucesso ? 'justify-end' : 'hidden lg:flex'"
    >
      <p v-if="!sucesso" class="text-h6 leading-[normal] text-s-blue">
        Conversa que aproxima. Conexão que transforma.
      </p>
      <div v-else class="flex w-full justify-end">
        <AppButton
          variant="blue"
          :width="260"
          :padding-left="40"
          class="lg:mr-[230px]"
          @click="voltarAoLogin"
        >
          Voltar ao login
        </AppButton>
      </div>
    </div>
  </section>
</template>
