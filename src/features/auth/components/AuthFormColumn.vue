<script setup lang="ts">
/**
 * Figma — coluna do formulário nas telas de autenticação
 * (760:644 / 760:699 / 506:1659).
 *
 * A partir de `lg` a coluna ocupa a direita do painel (`margin-left` = largura
 * do painel, `--auth-panel-width`) e o conteúdo começa a 124px do topo num
 * frame de 911px. Como no Login, o `padding-top` encolhe em janelas mais baixas
 * para a tela caber inteira, sem scroll.
 *
 * A coluna fica no fluxo (e não `absolute`) de propósito: assim ela define a
 * altura da casca, e o painel azul — que é `absolute inset-y-0` — estica junto
 * quando o formulário é mais alto que a janela (ex.: celular deitado). Com
 * `absolute` nos dois, o painel parava na altura da janela e sobrava uma faixa
 * branca embaixo à esquerda.
 *
 * No mobile o form cola no topo (`items-start`): com `items-center` ele ficava
 * centralizado no espaço que sobrava e descia em telas altas.
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
  <main
    class="auth-form-column flex flex-1 items-start justify-center px-6 py-10 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none sm:px-10 lg:relative lg:ml-[var(--auth-panel-width)] lg:z-0 lg:flex-none lg:items-start lg:px-10"
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
  </main>
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
