<script setup lang="ts">
import { computed, ref } from 'vue'

import AppArrowIcon from './AppArrowIcon.vue'

/**
 * Figma — Components > Buttons
 *
 * Cada variante é uma dupla base → hover (Smart Animate de 300ms Ease Out):
 *   coral         = Button 1 (435:92) → Button 5 (435:96)
 *   blue          = Button 2 (435:90) → Button 6 (435:95)
 *   coral-outline = Button 3 (435:91) → Button 7 (435:94)
 *   blue-outline  = Button 4 (435:93) → Button 8 (435:97)
 *
 * Base: 150x50, raio 10, Roboto Medium 16, padding-left 40, seta 16x12.
 * No hover: borda aparece/some, sombra colorida entra e o gap vai de 15 para 23.
 */
type ButtonVariant = 'coral' | 'blue' | 'coral-outline' | 'blue-outline'
type ButtonSize = 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    /** Distância do conteúdo à borda esquerda, em px. */
    paddingLeft?: number
    /** Sobrescreve a largura do tamanho (px). */
    width?: number
    /** Sobrescreve a altura do tamanho (px). */
    height?: number
    /** Espaçamento entre label e seta no estado base (px). Padrão: 15. */
    gap?: number
    /** Espaçamento entre label e seta no hover (px). Padrão: 23. */
    gapHover?: number
    /** Variante tipográfica do label (tokens text-h* do Tailwind). Padrão: h5 (16px). */
    labelVariant?: 'h3' | 'h4' | 'h5' | 'h6'
    /**
     * Centraliza label + seta e ignora o `paddingLeft`.
     * Usado nos estados de carregamento ("Enviando...", "Redefinindo...").
     */
    centered?: boolean
    /** Anuncia o estado de carregamento (`aria-busy`). */
    busy?: boolean
  }>(),
  {
    variant: 'coral',
    size: 'md',
    type: 'button',
    labelVariant: 'h5',
    centered: false,
    busy: false,
  },
)

/**
 * md = 150x50 (botões padrão; conteúdo a 40px da esquerda)
 * lg = 180x50 (CTA do Cartaz; padding esquerdo configurável)
 *
 * No Figma, o componente Cartaz usa 60px para o label "Text"; a instância
 * da Landpage usa 18px, onde o texto real é inserido.
 */
const sizes: Record<ButtonSize, { root: string; paddingLeft: number; height: number }> = {
  md: { root: 'w-[150px]', paddingLeft: 40, height: 50 },
  lg: { root: 'w-[180px]', paddingLeft: 60, height: 50 },
}

const contentPaddingLeft = computed(() => props.paddingLeft ?? sizes[props.size].paddingLeft)
const rootWidth = computed(() => (props.width ? `${props.width}px` : undefined))
const rootHeight = computed(() => `${props.height ?? sizes[props.size].height}px`)

const active = ref(false)

const surfaces: Record<ButtonVariant, { base: string; hover: string }> = {
  coral: {
    base: 'border-transparent bg-co-coral shadow-none',
    hover:
      'border-co-coral bg-[rgba(236,118,93,0.01)] shadow-[0px_20px_25px_-5px_rgba(236,118,93,0.2)]',
  },
  blue: {
    base: 'border-transparent bg-co-blue shadow-none',
    hover:
      'border-co-blue bg-[rgba(38,59,115,0.01)] shadow-[0px_20px_25px_-5px_rgba(38,59,115,0.2)]',
  },
  'coral-outline': {
    base: 'border-co-coral bg-[rgba(236,118,93,0.01)] shadow-none',
    hover: 'border-transparent bg-co-coral shadow-[0px_20px_25px_-5px_rgba(236,118,93,0.2)]',
  },
  'blue-outline': {
    base: 'border-co-blue bg-[rgba(38,59,115,0.01)] shadow-none',
    hover: 'border-transparent bg-co-blue shadow-[0px_20px_25px_-5px_rgba(38,59,115,0.2)]',
  },
}

const contents: Record<ButtonVariant, { base: string; hover: string }> = {
  coral: { base: 'text-co-white', hover: 'text-co-coral' },
  blue: { base: 'text-co-white', hover: 'text-co-blue' },
  'coral-outline': { base: 'text-co-coral', hover: 'text-co-white' },
  'blue-outline': { base: 'text-co-blue', hover: 'text-co-white' },
}

const surfaceClasses = computed(() =>
  active.value ? surfaces[props.variant].hover : surfaces[props.variant].base,
)
const contentClasses = computed(() =>
  active.value ? contents[props.variant].hover : contents[props.variant].base,
)

/** Tamanhos do label vêm exclusivamente dos tokens de tipografia do Tailwind. */
const labelClasses: Record<NonNullable<typeof props.labelVariant>, string> = {
  h3: 'text-h3',
  h4: 'text-h4',
  h5: 'text-h5',
  h6: 'text-h6',
}
</script>

<template>
  <button
    :type="type"
    class="relative shrink-0 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
    :class="sizes[size].root"
    :style="{ width: rootWidth, height: rootHeight }"
    :aria-busy="busy ? 'true' : undefined"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @focus="active = true"
    @blur="active = false"
  >
    <!-- Camada de fundo (431:120 / 435:71 e equivalentes) -->
    <span
      aria-hidden="true"
      class="absolute inset-0 rounded-[10px] border transition-[background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none"
      :class="surfaceClasses"
    />

    <!-- Conteúdo (431:128 / 435:72 e equivalentes) -->
    <span
      class="absolute inset-0 flex items-center transition-[gap,color] duration-300 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none"
      :class="[contentClasses, centered ? 'justify-center' : 'justify-start']"
      :style="{
        paddingLeft: centered ? '0px' : `${contentPaddingLeft}px`,
        gap: `${active ? (gapHover ?? 23) : (gap ?? 15)}px`,
      }"
    >
      <span class="whitespace-nowrap" :class="labelClasses[labelVariant]"><slot>Text</slot></span>

      <AppArrowIcon />
    </span>
  </button>
</template>
