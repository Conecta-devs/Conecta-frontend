<script setup lang="ts">
/**
 * Figma — intro do painel de autenticação (446:109 / 468:187 / 506:1794 /
 * 760:611 / 760:666 / 760:726).
 *
 * Título 72 (32 abaixo de `sm`) e descrição 18 (16 no mobile) em `s-coral`,
 * gap 20. A quebra do título é sempre visível; a da descrição só a partir de
 * `sm` — abaixo disso o texto flui naturalmente, como nos frames responsivos.
 *
 * Os textos padrão são a intro dos formulários (Login, cadastro, recuperação).
 * O sucesso da criação de conta troca só o título; o da redefinição troca
 * título e descrição.
 */
withDefaults(
  defineProps<{
    titulo?: string
    /** Segunda linha do título (quebra fixa). Passe `''` para título de uma linha só. */
    titulo2?: string
    descricao?: string
    /** Segunda linha da descrição (quebra a partir de `sm`). */
    descricao2?: string
  }>(),
  {
    titulo: 'Conecte-se com',
    titulo2: 'quem entende você.',
    descricao: 'Conheça novos estudantes, encontre seu grupo',
    descricao2: 'e construa novas histórias dentro e fora da sala.',
  },
)
</script>

<template>
  <div class="flex w-full flex-col items-start gap-4 sm:gap-5">
    <p
      class="text-[32px] leading-[1.05] tracking-[-1.5px] text-co-white sm:text-[48px] sm:tracking-[-2.5px] lg:text-h1"
    >
      {{ titulo }}<template v-if="titulo2"><br />{{ titulo2 }}</template>
    </p>
    <p class="text-h5 leading-[1.4] text-s-coral sm:text-h4 sm:leading-[normal]">
      {{ descricao }}<span v-if="descricao2" class="sm:block">{{ ` ${descricao2}` }}</span>
    </p>
  </div>
</template>
