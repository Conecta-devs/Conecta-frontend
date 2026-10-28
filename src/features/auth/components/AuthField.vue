<script setup lang="ts">
import { computed, ref } from 'vue'

import AppAuthIcon from '../../../shared/ui/AppAuthIcon.vue'

/**
 * Figma — campo das telas de autenticação (760:651 / 760:706 / 506:1672).
 *
 * Rótulo H6 (14, text-2), gap 5, entrada de 710 × 50 com raio 10, borda
 * `traceline` e fundo branco (AMInput, 506:1681). O ícone tem 14px e fica a
 * 13px da esquerda (754:403); com o gap de 5, o texto começa em x=32.
 *
 * O slot existe para a mensagem de erro/sucesso da API, que no Figma ocupa o
 * mesmo frame do campo (5px abaixo do input), nunca uma linha nova acima do
 * botão. `revelavel` adiciona o "ver/ocultar" dos campos de senha.
 */
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    icon?: 'person' | 'mail' | 'lock'
    type?: string
    placeholder?: string
    autocomplete?: string
    minlength?: number
    maxlength?: number
    /** Mostra o botão "ver/ocultar" (campos de senha). */
    revelavel?: boolean
    required?: boolean
    disabled?: boolean
  }>(),
  {
    icon: 'mail',
    type: 'text',
    revelavel: false,
    required: true,
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })

const visivel = ref(false)
const tipoEfetivo = computed(() => (props.revelavel && visivel.value ? 'text' : props.type))

/** Entrada do Figma: 50px, raio 10, borda traceline, texto a 32px. */
const inputBase =
  'h-[50px] w-full rounded-[10px] border border-traceline bg-white pl-[32px] font-sans text-h6 text-text-1 outline-none placeholder:text-text-2/50 focus:border-co-coral disabled:cursor-not-allowed disabled:opacity-60'

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
        :type="tipoEfetivo"
        :class="[inputBase, revelavel ? 'pr-16' : 'pr-3']"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :minlength="minlength"
        :maxlength="maxlength"
        :required="required"
        :disabled="disabled"
      />
      <button
        v-if="revelavel"
        type="button"
        class="absolute right-3 cursor-pointer border-0 bg-transparent p-0 font-sans text-h6 leading-[normal] text-text-2 transition-colors hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
        :aria-label="visivel ? 'Ocultar senha' : 'Mostrar senha'"
        @click="visivel = !visivel"
      >
        {{ visivel ? 'ocultar' : 'ver' }}
      </button>
    </span>

    <slot />
  </div>
</template>
