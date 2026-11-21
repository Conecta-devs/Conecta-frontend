<script setup lang="ts">
import { useBodyScrollLock } from '../composables/useBodyScrollLock'

withDefaults(
  defineProps<{
    /** ID usado pelas páginas para consultar/rolar o wrapper. */
    id: string
    /** Largura do canvas fixo em px. */
    width?: number
    /** Centraliza o canvas quando a viewport é maior que ele. */
    centered?: boolean
  }>(),
  {
    width: 1920,
    centered: true,
  },
)

useBodyScrollLock()
</script>

<template>
  <!-- Preview em tamanho real; em telas menores a faixa rola na horizontal,
       sem barras de rolagem visíveis. -->
  <div
    :id="id"
    class="h-screen w-screen overflow-auto bg-co-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
  >
    <div :class="{ 'mx-auto': centered }" :style="{ width: `${width}px` }">
      <slot />
    </div>
  </div>
</template>
