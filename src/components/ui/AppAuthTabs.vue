<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * Figma — Components > Login/Register (554:212)
 *
 * Abas de 710x16 usadas no topo dos formulários de Login e Register.
 * A versão ativa fica em co-blue; a inativa em text-2.
 * Indicador: linha de 355x3 (metade da largura) centralizada na base.
 *
 * Hover (nas abas inativas): o azul e o indicador migram para a aba
 * apontada via Smart Animate de 150ms Ease Out; ao sair, voltam.
 * Ex.: Login (Entrar ativo) → hover em "Criar conta" → Register;
 *      Register (Criar conta ativo) → hover em "Entrar" → Login.
 */
type AuthMode = 'login' | 'register'

const props = withDefaults(defineProps<{ mode?: AuthMode }>(), { mode: 'login' })

const emit = defineEmits<{ select: [mode: AuthMode] }>()

const hovered = ref<AuthMode | null>(null)

/** O visual segue o hover; o estado real (mode) só muda no clique. */
const shown = computed<AuthMode>(() => hovered.value ?? props.mode)

watch(
  () => props.mode,
  () => {
    hovered.value = null
  },
)

function enter(tab: AuthMode) {
  if (tab !== props.mode) hovered.value = tab
}

function leave() {
  hovered.value = null
}

/** No Figma a aba ativa não tem clique; só a inativa navega. */
function select(tab: AuthMode) {
  if (tab !== props.mode) emit('select', tab)
}
</script>

<template>
  <div class="relative flex h-4 w-[710px] items-center">
    <button
      type="button"
      class="flex h-4 w-1/2 items-center justify-center border-0 bg-transparent p-0 text-center text-h6 transition-colors duration-150 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none"
      :class="[
        shown === 'login' ? 'text-co-blue' : 'text-text-2',
        mode === 'login' ? 'cursor-default' : 'cursor-pointer',
      ]"
      :aria-pressed="mode === 'login'"
      @mouseenter="enter('login')"
      @mouseleave="leave"
      @click="select('login')"
    >
      Entrar
    </button>

    <button
      type="button"
      class="flex h-4 w-1/2 items-center justify-center border-0 bg-transparent p-0 text-center text-h6 transition-colors duration-150 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none"
      :class="[
        shown === 'register' ? 'text-co-blue' : 'text-text-2',
        mode === 'register' ? 'cursor-default' : 'cursor-pointer',
      ]"
      :aria-pressed="mode === 'register'"
      @mouseenter="enter('register')"
      @mouseleave="leave"
      @click="select('register')"
    >
      Criar conta
    </button>

    <span
      aria-hidden="true"
      class="absolute bottom-0 h-[3px] w-1/2 translate-y-1/2 bg-co-blue transition-[left] duration-150 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none"
      :class="shown === 'login' ? 'left-0' : 'left-1/2'"
    />
  </div>
</template>
