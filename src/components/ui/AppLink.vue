<script setup lang="ts">
/**
 * Figma — Components > Links (385:195)
 *
 *   blue  = Link 1 (385:194) → Link 2 (385:196) no hover
 *   coral = Link 2 (385:196) → Link 1 (385:194) no hover
 *
 * Roboto Medium 18, gap 8, seta 15.999 x 12.005 herdando currentColor.
 * A troca é um Smart Animate de 300ms Ease Out (mesma curva dos botões).
 */
type LinkVariant = 'blue' | 'coral'
type LinkSize = 'h4' | 'h5' | 'h6'

withDefaults(
  defineProps<{
    href?: string
    variant?: LinkVariant
    /** Tamanho do texto: h4 (18px, padrão), h5 (16px) ou h6 (14px). */
    size?: LinkSize
    /** Exibe a seta à direita (ligada por padrão). */
    arrow?: boolean
  }>(),
  {
    href: '#',
    variant: 'blue',
    size: 'h4',
    arrow: true,
  },
)
</script>

<template>
  <a
    :href="href"
    class="inline-flex items-center gap-2 font-sans font-medium whitespace-nowrap transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
    :class="[
      size === 'h6'
        ? 'text-h6 leading-[normal]'
        : size === 'h5'
          ? 'text-h5 leading-[normal]'
          : 'text-[18px] leading-[21px]',
      variant === 'coral'
        ? 'text-co-coral hover:text-co-blue focus-visible:text-co-blue'
        : 'text-co-blue hover:text-co-coral focus-visible:text-co-coral',
    ]"
  >
    <slot>Text</slot>

    <svg
      v-if="arrow"
      class="h-[12.005px] w-[15.999px] shrink-0"
      viewBox="0 0 15.9992 12.0047"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M15.7063 6.70859C16.0969 6.31797 16.0969 5.68359 15.7063 5.29297L10.7063 0.292969C10.3156 -0.0976562 9.68125 -0.0976562 9.29062 0.292969C8.9 0.683594 8.9 1.31797 9.29062 1.70859L12.5844 5.00234H1C0.446875 5.00234 0 5.44922 0 6.00234C0 6.55547 0.446875 7.00234 1 7.00234H12.5844L9.29062 10.2961C8.9 10.6867 8.9 11.3211 9.29062 11.7117C9.68125 12.1023 10.3156 12.1023 10.7063 11.7117L15.7063 6.71172V6.70859Z"
      />
    </svg>
  </a>
</template>
