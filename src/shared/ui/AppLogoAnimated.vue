<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import AppLogo from './AppLogo.vue'

/**
 * Figma — Components > Logo Animation (802:377)
 *
 * Duas variantes de 209×55:
 *   802:375 (Frame 3) — só a marca, centralizada (padding-left 56)
 *   802:376 (Frame 2) — marca à esquerda + wordmark "conecta." à direita
 *
 * A troca é um Smart Animate de 300ms Ease Out, disparado após 300ms:
 * a marca desliza 56px para a esquerda e o wordmark aparece.
 * `prefers-reduced-motion` mostra o estado final imediatamente.
 */
const props = withDefaults(
  defineProps<{
    /** Largura total do conjunto em px. A altura acompanha a proporção 209×55. */
    width?: number
  }>(),
  {
    width: 209,
  },
)

const BASE_WIDTH = 209
const BASE_HEIGHT = 55
const REVEAL_DELAY = 300

const scale = computed(() => props.width / BASE_WIDTH)
const height = computed(() => BASE_HEIGHT * scale.value)
const revealed = ref(false)

let revealTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) {
    revealed.value = true
    return
  }

  revealTimer = setTimeout(() => {
    revealed.value = true
  }, REVEAL_DELAY)
})

onBeforeUnmount(() => {
  if (revealTimer) clearTimeout(revealTimer)
})
</script>

<template>
  <div
    class="relative shrink-0 select-none"
    :style="{ width: `${width}px`, height: `${height}px` }"
    role="img"
    aria-label="Conecta"
  >
    <div
      class="absolute top-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
      :style="{
        width: `${100 * scale}px`,
        height: `${55 * scale}px`,
        transform: `translateX(${revealed ? 0 : 56 * scale}px)`,
      }"
    >
      <AppLogo variant="logo-3" :width="100 * scale" :height="55 * scale" />
    </div>

    <div
      class="absolute top-1/2 -translate-y-1/2 transition-opacity duration-300 ease-out motion-reduce:transition-none"
      :class="revealed ? 'opacity-100' : 'opacity-0'"
      :style="{ left: `${105 * scale}px` }"
    >
      <AppLogo variant="conecta" :font-size="24 * scale" />
    </div>
  </div>
</template>
