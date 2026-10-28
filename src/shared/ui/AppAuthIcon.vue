<script setup lang="ts">
import { computed } from 'vue'

/**
 * Figma — Components > Auth Icons (754:403)
 *
 *   lock   = 754:402  (Propriedade 1 = lock-keyhole)
 *   mail   = 754:401  (Propriedade 1 = mail)
 *   person = 754:420  (Propriedade 1 = Pessoa)
 *
 * Todos 14 × 14, stroke de 1px, sem fill, cantos arredondados — o glifo é
 * decorativo e acompanha a cor do texto (`currentColor`). Nos frames do Figma
 * ele fica a 13px da esquerda dentro de inputs de 710 × 50, e o texto começa
 * em x=32.
 *
 * Onde o Figma usa: telas de recuperação de senha (Esqueci minha senha
 * 760:611 → mail; Criar nova senha 760:666 → lock) e, no projeto, também nos
 * campos de Login/Register (person, mail e lock).
 */
type AuthIconVariant = 'person' | 'mail' | 'lock'

const props = withDefaults(
  defineProps<{
    variant?: AuthIconVariant
    /** Largura em px. Sem valor, usa o tamanho do Figma (14). */
    width?: number
  }>(),
  {
    variant: 'mail',
  },
)

const GLIFOS = {
  lock: {
    width: 14,
    height: 14,
    /** 754:402 — lock-keyhole */
    path: 'M4.08333 5.83324V4.0831C4.08333 3.30949 4.39062 2.56757 4.93761 2.02054C5.48459 1.47352 6.22645 1.1662 7 1.1662C7.77355 1.1662 8.51541 1.47352 9.06239 2.02054C9.60938 2.56757 9.91667 3.30949 9.91667 4.0831V5.83324M4.08333 5.83324H2.91667C2.27233 5.83324 1.75 6.35562 1.75 7V11.667C1.75 12.3114 2.27233 12.8338 2.91667 12.8338H11.0833C11.7277 12.8338 12.25 12.3114 12.25 11.667V7C12.25 6.35562 11.7277 5.83324 11.0833 5.83324H9.91667M4.08333 5.83324H9.91667M7.58333 9.33352C7.58333 9.65571 7.32217 9.9169 7 9.9169C6.67783 9.9169 6.41667 9.65571 6.41667 9.33352C6.41667 9.01133 6.67783 8.75014 7 8.75014C7.32217 8.75014 7.58333 9.01133 7.58333 9.33352Z',
  },
  mail: {
    width: 14,
    height: 14,
    /** 754:401 */
    path: 'M12.8338 4.08362L7.58863 7.42404C7.41064 7.5274 7.20846 7.58185 7.00263 7.58185C6.79679 7.58185 6.59461 7.5274 6.41662 7.42404L1.1662 4.08362M12.8338 4.08362V3.50035C12.8338 2.85608 12.3114 2.3338 11.667 2.3338H2.33296C1.68858 2.3338 1.1662 2.85608 1.1662 3.50035V4.08362M12.8338 4.08362V10.4996C12.8338 11.1439 12.3114 11.6662 11.667 11.6662H2.33296C1.68858 11.6662 1.1662 11.1439 1.1662 10.4996V4.08362',
  },
  person: {
    width: 14,
    height: 14,
    /** 754:420 — Pessoa (contorno) */
    path: 'M2.333 12.25V11.083C2.333 9.472 3.639 8.167 5.25 8.167H8.75C10.361 8.167 11.667 9.472 11.667 11.083V12.25M9.333 4.083C9.333 4.70175 9.0872 5.29516 8.64968 5.73268C8.21216 6.1702 7.61875 6.416 7 6.416C6.38125 6.416 5.78784 6.1702 5.35032 5.73268C4.9128 5.29516 4.667 4.70175 4.667 4.083C4.667 3.46425 4.9128 2.87084 5.35032 2.43332C5.78784 1.9958 6.38125 1.75 7 1.75C7.61875 1.75 8.21216 1.9958 8.64968 2.43332C9.0872 2.87084 9.333 3.46425 9.333 4.083Z',
  },
} satisfies Record<AuthIconVariant, { width: number; height: number; path: string }>

const glifo = computed(() => GLIFOS[props.variant])
const width = computed(() => props.width ?? glifo.value.width)
const height = computed(() => (width.value * glifo.value.height) / glifo.value.width)
</script>

<template>
  <svg
    :viewBox="`0 0 ${glifo.width} ${glifo.height}`"
    :style="{ width: `${width}px`, height: `${height}px` }"
    fill="none"
    stroke="currentColor"
    stroke-width="1"
    aria-hidden="true"
    class="block shrink-0"
  >
    <path :d="glifo.path" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
