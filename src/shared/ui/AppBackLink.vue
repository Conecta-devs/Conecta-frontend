<script setup lang="ts">
/**
 * Figma — link "Voltar" das telas de autenticação
 * (454:100 / 760:646 / 760:701).
 *
 * Seta DM Sans Bold 13 + Roboto Medium 14 em text-2, gap 3. No hover o texto
 * vai para co-blue e a seta anda 4px para a esquerda (300ms ease out).
 * É um botão para poder ser usado dentro do `<form>` (navega via handler).
 */
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'Voltar ao login',
  },
)
</script>

<template>
  <button
    type="button"
    class="group inline-flex shrink-0 cursor-pointer items-center gap-[3px] border-0 bg-transparent p-0 font-sans text-h6 leading-[normal] whitespace-nowrap text-text-2 transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
  >
    <span
      class="inline-block font-arrow text-arrow transition-transform duration-300 ease-[cubic-bezier(0,0,0.58,1)] group-hover:-translate-x-1 motion-reduce:transition-none"
      >←</span
    >
    {{ label }}
  </button>
</template>
