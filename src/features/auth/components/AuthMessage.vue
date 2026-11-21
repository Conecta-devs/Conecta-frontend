<script setup lang="ts">
/**
 * Mensagem da API dentro do frame do campo (5px abaixo do input), como nos
 * frames de erro/sucesso do Figma (506:1693 / 506:1939 / 760:651).
 *
 * Erro em vermelho translúcido com `role="alert"`; sucesso no verde da
 * paleta (`tree-green`) com `role="status"` — sem cor hardcoded.
 */
withDefaults(
  defineProps<{
    /** Permite vincular a mensagem ao input via `aria-describedby`. */
    id?: string
    variante?: 'erro' | 'sucesso'
  }>(),
  {
    id: undefined,
    variante: 'erro',
  },
)
</script>

<template>
  <p
    :id="id"
    class="text-h6 leading-[normal]"
    :class="variante === 'sucesso' ? 'text-tree-green' : 'text-[rgba(255,0,4,0.65)]'"
    :role="variante === 'sucesso' ? 'status' : 'alert'"
  >
    <slot />
  </p>
</template>
