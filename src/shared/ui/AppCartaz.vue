<script setup lang="ts">
import AppButton from './AppButton.vue'

/**
 * Figma — Components > Cartaz (399:258)
 * Instância real na Landpage: 399:278.
 *
 * 1280x350, fundo co-blue, raio 16, padding 48/80, gap 20, conteúdo centralizado.
 * Eyebrow 14/500 text-2; headline 72/600 tracking -5 em três cores
 * (coral, co-white e s-blue); CTA usa o Button 1 (coral) em 180x50,
 * alinhado à esquerda.
 *
 * O componente do Figma posiciona o placeholder "Text" a 60px da borda;
 * na instância da Landpage o texto real entra a 18px. Por isso o catálogo
 * passa 60 e a landing usa o default de 18.
 *
 * Sem variantes nem animações próprias — o único movimento é o hover do Button.
 */
withDefaults(
  defineProps<{
    eyebrow?: string
    titleStart?: string
    titleMiddle?: string
    titleEnd?: string
    cta?: string
    /** Distância do label do CTA à borda esquerda, em px. */
    ctaPaddingLeft?: number
  }>(),
  {
    eyebrow: 'Conheça o Conecta',
    titleStart: 'Estude,',
    titleMiddle: 'converse',
    titleEnd: 'e compartilhe',
    cta: 'Quero participar',
    ctaPaddingLeft: 18,
  },
)

const emit = defineEmits<{ cta: [] }>()
</script>

<template>
  <section
    class="flex w-full max-w-[1280px] flex-col items-center gap-5 overflow-hidden rounded-[16px] bg-co-blue px-12 py-20"
  >
    <p class="text-h6 leading-[normal] text-text-2">{{ eyebrow }}</p>

    <h2 class="text-h1 text-center">
      <span class="text-co-coral">{{ titleStart }}</span>
      {{ ' ' }}
      <span class="text-co-white">{{ titleMiddle }}</span>
      {{ ' ' }}
      <span class="text-s-blue">{{ titleEnd }}</span>
    </h2>

    <AppButton
      size="lg"
      variant="coral"
      :padding-left="ctaPaddingLeft"
      @click="emit('cta')"
    >
      {{ cta }}
    </AppButton>
  </section>
</template>
