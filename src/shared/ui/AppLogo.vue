<script setup lang="ts">
import { computed } from 'vue'

import logo1 from '../../assets/logos/logo-1.svg'
import logo2 from '../../assets/logos/logo-2.svg'
import logo3 from '../../assets/logos/logo-3.svg'

/**
 * Figma — Components > Logos (307:96)
 *
 *   logo-1  = 307:93  azul + off-white
 *   logo-2  = 307:94  coral + off-white
 *   logo-3  = 307:92  coral + azul
 *   conecta = 307:95  wordmark em Space Grotesk Bold 48px
 *
 * As três marcas gráficas usam 200.586 x 110.881 por padrão; o wordmark,
 * 207 x 61. A prop `width` escala a variação mantendo a proporção; `height`
 * força uma altura exata (no Figma os logos aparecem em 100 x 55).
 */
type LogoVariant = 'logo-1' | 'logo-2' | 'logo-3' | 'conecta'
type LogoWordmarkTone = 'blue' | 'light'

const props = withDefaults(
  defineProps<{
    variant?: LogoVariant
    /** Largura em px. Sem valor, usa o tamanho do Figma. */
    width?: number
    /** Altura em px. Sem valor, mantém a proporção natural da marca. */
    height?: number
    /** Tamanho da fonte do wordmark em px (mantém a proporção da largura). */
    fontSize?: number
    /** Cores do wordmark: azul em fundo claro ou branco em fundo azul. */
    tone?: LogoWordmarkTone
    alt?: string
  }>(),
  {
    variant: 'conecta',
    tone: 'blue',
    alt: 'Conecta',
  },
)

const NATURAL_WIDTH: Record<LogoVariant, number> = {
  'logo-1': 200.586,
  'logo-2': 200.586,
  'logo-3': 200.586,
  conecta: 207,
}

const LOGO_RATIO = 110.881 / 200.586
const WORDMARK_SIZE = 48

const sources: Record<Exclude<LogoVariant, 'conecta'>, string> = {
  'logo-1': logo1,
  'logo-2': logo2,
  'logo-3': logo3,
}

const width = computed(() => props.width ?? NATURAL_WIDTH[props.variant])
const height = computed(() => props.height ?? width.value * LOGO_RATIO)
const source = computed(() => (props.variant === 'conecta' ? null : sources[props.variant]))
const fontSize = computed(
  () => props.fontSize ?? (WORDMARK_SIZE * width.value) / NATURAL_WIDTH.conecta,
)
const wordmarkColors = computed(() =>
  props.tone === 'light'
    ? { wordmark: 'text-co-white', dot: 'text-s-coral' }
    : { wordmark: 'text-co-blue', dot: 'text-co-coral' },
)
</script>

<template>
  <img
    v-if="source"
    :src="source"
    :alt="alt"
    :style="{ width: `${width}px`, height: `${height}px` }"
    class="block max-w-none"
    draggable="false"
  />
  <span
    v-else
    class="font-display leading-[normal] font-bold whitespace-nowrap"
    :class="wordmarkColors.wordmark"
    :style="{ fontSize: `${fontSize}px` }"
    >conecta<span :class="wordmarkColors.dot">.</span></span
  >
</template>
