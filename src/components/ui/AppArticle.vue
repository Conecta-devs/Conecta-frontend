<script setup lang="ts">
import AppIcon from './AppIcon.vue'

/**
 * Figma — Components > Article (491:427)
 *
 *   Article 0 (307:11) → hover → Article 1 (491:428)
 *   Article 1 (491:428) → mouse leave → Article 0 (307:11)
 *   Smart Animate de 300ms Ease Out.
 *
 * 420x200, raio 16, borda 2, padding 28, gap 12.
 * Base: borda traceline. Hover: borda coral 50% + sombra 0 20 25 rgba(0,0,0,.05).
 * O ícone é o AppIcon (hands | book | coletive) dentro do quadrado 45x45.
 */
type IconVariant = 'hands' | 'book' | 'coletive'

withDefaults(
  defineProps<{
    icon?: IconVariant
    title?: string
    text?: string
  }>(),
  {
    icon: 'hands',
    title: 'Text',
    text: 'Text',
  },
)
</script>

<template>
  <article
    class="flex h-[200px] w-[420px] flex-col items-start gap-3 rounded-[16px] border-2 border-traceline bg-co-white p-[28px] transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0,0,0.58,1)] hover:border-[rgba(236,118,93,0.5)] hover:shadow-[0_20px_25px_0_rgba(0,0,0,0.05)] motion-reduce:transition-none"
  >
    <div
      class="flex size-[45px] shrink-0 items-center justify-center rounded-[12px] bg-s-coral p-[13px] text-co-coral"
    >
      <AppIcon :variant="icon" />
    </div>

    <h3 class="w-full font-sans text-[20px] leading-[normal] font-semibold text-text-1">
      {{ title }}
    </h3>

    <p class="w-full font-sans text-[16px] leading-[normal] font-medium text-text-2">
      {{ text }}
    </p>
  </article>
</template>
