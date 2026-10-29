<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '../../../shared/ui/AppButton.vue'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import coletiveIcon from '../../../assets/icons/coletive-white.svg'
import orbitInner from '../../../assets/decorations/orbit.svg'
import orbitOuter from '../../../assets/decorations/orbit2.svg'

/**
 * Figma — painel de apresentação das telas de autenticação.
 *
 *   form    = 760:612 / 760:667 / 468:187 (azul, 750 × 911)
 *   sucesso = 760:726 / 506:1739 (verde, 1920 × 911)
 *
 * Nos dois estados o painel é uma coluna com três blocos separados por 250px:
 * marca (91, 22), mensagem (91, 327.45) e rodapé — assinatura em 877.45 no
 * azul, botão em 793.45 no verde. O `justify-between` reproduz essas posições
 * exatamente num frame de 911px e comprime em janelas mais baixas, sem scroll.
 * Como o padding inferior acompanha o rodapé (18 + 16 no azul, 68 + 50 no
 * verde), a mensagem fica em 327 nos dois estados, como no Smart Animate.
 *
 * Os halos são os mesmos SVGs da Landpage: 590px (orbit.svg) e 670px
 * (orbit2.svg) com o frame de 590/510 do Figma. O par inferior fica sempre
 * visível; o par superior direito só entra no estado de sucesso.
 *
 * A mensagem tem um slot (o Login usa para as duas intros em cross-fade) e o
 * rodapé é assinatura no azul e CTA no verde (`cta-label` + evento `cta`).
 * Sem slot, o painel mostra as telas de recuperação de senha
 * (760:611/760:666/760:726).
 */
const props = withDefaults(
  defineProps<{
    /** 'form' = painel azul de 750px; 'sucesso' = tela cheia verde. */
    estado?: 'form' | 'sucesso'
    /** Texto do CTA da tela de sucesso. */
    ctaLabel?: string
  }>(),
  {
    estado: 'form',
    ctaLabel: 'Voltar ao login',
  },
)

defineEmits<{ cta: [] }>()

const sucesso = computed(() => props.estado === 'sucesso')

/** Título e descrição da recuperação de senha (760:635/760:742). */
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
</script>

<template>
  <section
    class="auth-showcase flex shrink-0 flex-col justify-between overflow-hidden px-5 pt-4 pb-6 text-co-white sm:px-8 sm:pt-6 sm:pb-8 lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:pl-10 lg:pr-0 lg:pt-[30px] lg:transition-[width,background-color] lg:duration-300 lg:ease-out xl:pl-[90px] xl:pt-[22px] motion-reduce:transition-none"
    :class="
      sucesso
        ? 'auth-showcase--sucesso fixed inset-0 z-40 w-auto bg-tree-green lg:w-full lg:pb-[68px]'
        : 'relative bg-co-blue lg:w-[750px] lg:pb-[18px]'
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

    <!-- Mensagem (760:634 / 760:741): conteúdo (slot), depois a comunidade,
         gap 20. No Login o slot traz as duas intros em cross-fade. -->
    <div class="relative z-10 flex w-full shrink-0 flex-col gap-5 py-6 sm:py-8 lg:py-0">
      <slot>
        <div
          class="text-[32px] leading-[1.05] tracking-[-1.5px] sm:text-[48px] sm:tracking-[-2.5px] lg:text-h1 lg:leading-[normal] lg:tracking-[-5px]"
        >
          <p v-for="linha in textos.titulo" :key="linha" class="leading-[normal]">{{ linha }}</p>
        </div>
        <div
          class="text-h5 leading-[1.4] sm:text-h4 sm:leading-[normal]"
          :class="sucesso ? 'text-s-coral' : 'text-co-white'"
        >
          <p v-for="linha in textos.descricao" :key="linha" class="leading-[inherit]">
            {{ linha }}
          </p>
        </div>
      </slot>

      <div class="hidden shrink-0 items-center justify-start gap-[10px] sm:flex">
        <img :src="coletiveIcon" alt="" class="size-[50px] shrink-0" draggable="false" />
        <p class="text-h6 leading-[normal] text-s-blue">Comunidade feita para você</p>
      </div>
    </div>

    <!-- Rodapé: assinatura (azul) ou CTA (verde, 260 × 50 a 230px da borda
         direita). O slot permite ao Login trocar o texto do botão. -->
    <div class="relative z-10 flex w-full shrink-0 items-end">
      <p v-if="!sucesso" class="hidden text-h6 leading-[normal] text-s-blue lg:block">
        Conversa que aproxima. Conexão que transforma.
      </p>
      <div v-else class="flex w-full justify-end">
        <AppButton variant="blue" :width="260" class="lg:mr-[230px]" @click="$emit('cta')">
          {{ ctaLabel }}
        </AppButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Abaixo de lg o painel vira a tela de sucesso inteira: fade/scale de 300ms
   (no desktop a expansão do painel já faz o Smart Animate). */
@media (max-width: 63.999rem) {
  .auth-showcase--sucesso {
    animation: auth-sucesso 300ms ease-out both;
  }
}

@keyframes auth-sucesso {
  from {
    opacity: 0;
    transform: scale(1.02);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-showcase--sucesso {
    animation: none;
  }
}
</style>
