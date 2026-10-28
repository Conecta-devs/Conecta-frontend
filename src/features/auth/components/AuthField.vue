<script setup lang="ts">
import AppAuthIcon from '../../../shared/ui/AppAuthIcon.vue'

/**
 * Figma — campo das telas de recuperação de senha (760:651 / 760:706 / 760:711).
 *
 * Rótulo H6 (14, text-2), gap 5, entrada de 710 × 50 com raio 10, borda
 * `traceline` e fundo branco. O ícone tem 14px e fica a 13px da esquerda
 * (754:403); com o gap de 5, o texto começa em x=32 — igual ao Login.
 *
 * O slot existe para a mensagem de erro/sucesso da API, que no Figma ocupa o
 * mesmo frame do campo (5px abaixo do input), nunca uma linha nova acima do
 * botão.
 */
withDefaults(
  defineProps<{
    id: string
    label: string
    icon?: 'person' | 'mail' | 'lock'
    type?: string
    placeholder?: string
    autocomplete?: string
    minlength?: number
    maxlength?: number
    required?: boolean
    disabled?: boolean
  }>(),
  {
    icon: 'mail',
    type: 'text',
    required: true,
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })

/** Entrada do Figma: 50px, raio 10, borda traceline, texto a 32px. */
const inputBase =
  'h-[50px] w-full rounded-[10px] border border-traceline bg-white pr-3 pl-[32px] font-sans text-h6 text-text-1 outline-none placeholder:text-text-2/50 focus:border-co-coral disabled:cursor-not-allowed disabled:opacity-60'

/** Ícone decorativo dentro do input: 14px a 13px da esquerda. */
const inputIcon =
  'pointer-events-none absolute left-[13px] text-text-2 transition-colors group-focus-within:text-co-coral'
</script>

<template>
  <div class="flex w-full shrink-0 flex-col gap-[5px]">
    <label :for="id" class="text-h6 leading-[normal] text-text-2">{{ label }}</label>

    <span class="group relative flex w-full items-center">
      <AppAuthIcon :variant="icon" :class="inputIcon" />
      <input
        :id="id"
        v-model="model"
        :type="type"
        :class="inputBase"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :minlength="minlength"
        :maxlength="maxlength"
        :required="required"
        :disabled="disabled"
      />
    </span>

    <slot />
  </div>
</template>
