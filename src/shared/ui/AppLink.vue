<script setup lang="ts">
import AppArrowIcon from './AppArrowIcon.vue'

/**
 * Figma — Components > Links (385:195)
 *
 *   blue  = Link 1 (385:194) → Link 2 (385:196) no hover
 *   coral = Link 2 (385:196) → Link 1 (385:194) no hover
 *
 * Roboto Medium 18 (text-h4), gap 8, seta 15.999 x 12.005 herdando currentColor.
 * O tamanho vem dos tokens de tipografia do Tailwind (text-h4 | text-h5 | text-h6).
 * A troca é um Smart Animate de 300ms Ease Out (mesma curva dos botões).
 */
type LinkVariant = 'blue' | 'coral'
type LinkSize = 'h4' | 'h5' | 'h6'

withDefaults(
  defineProps<{
    href?: string
    variant?: LinkVariant
    /** Tamanho do texto: h4 (18px, padrão), h5 (16px) ou h6 (14px). */
    size?: LinkSize
    /** Exibe a seta à direita (ligada por padrão). */
    arrow?: boolean
  }>(),
  {
    href: '#',
    variant: 'blue',
    size: 'h4',
    arrow: true,
  },
)
</script>

<template>
  <a
    :href="href"
    class="inline-flex items-center gap-2 font-sans whitespace-nowrap transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
    :class="[
      size === 'h6' ? 'text-h6' : size === 'h5' ? 'text-h5' : 'text-h4',
      variant === 'coral'
        ? 'text-co-coral hover:text-co-blue focus-visible:text-co-blue'
        : 'text-co-blue hover:text-co-coral focus-visible:text-co-coral',
    ]"
  >
    <slot>Text</slot>

    <AppArrowIcon v-if="arrow" />
  </a>
</template>
