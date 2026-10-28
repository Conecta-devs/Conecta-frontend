<script setup lang="ts">
/**
 * Figma — coluna do formulário nas telas de autenticação
 * (760:644 / 760:699 / 506:1659).
 *
 * A partir de `lg` a coluna ocupa a direita do painel de 750px (left 750,
 * largura 1170) e o conteúdo começa a 124px do topo num frame de 911px.
 * Como no Login, o `padding-top` encolhe em janelas mais baixas para a tela
 * caber inteira, sem scroll.
 *
 * O formulário de 710px (gap 32) fica aqui dentro: assim Login, cadastro e
 * recuperação de senha compartilham a mesma largura e o mesmo `justify-center`
 * — a 1920px ele cai em x=980, exatamente como no Figma.
 */
withDefaults(
  defineProps<{
    /** Fade + translateY(-12px) de 300ms (Smart Animate para a tela verde). */
    escondido?: boolean
  }>(),
  {
    escondido: false,
  },
)

defineEmits<{ submit: [] }>()
</script>

<template>
  <section
    class="auth-form-column flex flex-1 items-center justify-center px-6 py-10 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none sm:px-10 lg:absolute lg:inset-y-0 lg:left-[750px] lg:right-0 lg:z-0 lg:flex-none lg:items-start lg:px-16"
    :class="escondido ? 'pointer-events-none -translate-y-3 opacity-0' : 'opacity-100'"
    :aria-hidden="escondido ? 'true' : undefined"
    :inert="escondido ? true : undefined"
  >
    <form
      class="flex w-full max-w-[710px] flex-col items-start gap-6 lg:gap-8"
      @submit.prevent="$emit('submit')"
    >
      <slot />
    </form>
  </section>
</template>

<style scoped>
/* Figma: o formulário começa a 124px do topo num frame de 911px. Em janelas
   mais baixas o padding encolhe para a tela caber inteira, sem scroll. */
@media (min-width: 64rem) {
  .auth-form-column {
    padding-top: clamp(16px, calc(100dvh - 800px), 123px);
    padding-bottom: 16px;
  }
}
</style>
