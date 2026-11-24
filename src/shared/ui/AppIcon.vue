<script setup lang="ts">
import { computed } from 'vue'

import { BOOK_PATH, COLETIVE_PATH, HANDS_PATH } from './icons'

/**
 * Figma — Components > Icons (307:15)
 *
 *   hands    = 307:12  (18 × 14.003)
 *   book     = 307:13  (16 × 15.165)
 *   coletive = 307:14  (20 × 14.5)
 *
 * A marca gráfica do wordmark não é um ícone: use o AppLogo
 * (variantes logo-1 | logo-2 | logo-3 | conecta).
 *
 * O glifo herda a cor do texto (`currentColor`) — no Figma os ícones
 * aparecem tanto em co-coral quanto em co-white, então a cor vem do contexto.
 */
type IconVariant = 'hands' | 'book' | 'coletive'

const props = withDefaults(
  defineProps<{
    variant?: IconVariant
    /** Largura em px. Sem valor, usa o tamanho do Figma. */
    width?: number
  }>(),
  {
    variant: 'hands',
  },
)

const GLIFOS = {
  hands: {
    width: 18,
    height: 14.0031,
    path: HANDS_PATH,
  },
  book: {
    width: 16,
    height: 15.1648,
    path: BOOK_PATH,
  },
  coletive: {
    width: 20,
    height: 14.5,
    path: COLETIVE_PATH,
  },
} satisfies Record<IconVariant, { width: number; height: number; path: string }>

const glifo = computed(() => GLIFOS[props.variant])
const width = computed(() => props.width ?? glifo.value.width)
const height = computed(() => (width.value * glifo.value.height) / glifo.value.width)
</script>

<template>
  <svg
    :viewBox="`0 0 ${glifo.width} ${glifo.height}`"
    :style="{ width: `${width}px`, height: `${height}px` }"
    fill="none"
    aria-hidden="true"
    class="block shrink-0"
  >
    <path :d="glifo.path" fill="currentColor" />
  </svg>
</template>
