<script setup>
import { computed } from 'vue'

/**
 * Vue port of Spell UI's <BlurReveal>.
 * Same idea as the React version: split the text into words/characters
 * and stagger each character from blur(12px) + y:10 + opacity:0
 * to blur(0) + y:0 + opacity:1.
 */
const props = defineProps({
  text: { type: String, required: true },
  as: { type: String, default: 'p' },
  // seconds before the animation starts
  delay: { type: Number, default: 0 },
  // higher = characters appear closer together (stagger)
  speedReveal: { type: Number, default: 1.5 },
  // higher = each character animates faster
  speedSegment: { type: Number, default: 0.5 },
})

const stagger = computed(() => 0.03 / props.speedReveal)
const duration = computed(() => 0.3 / props.speedSegment)

// Build words -> chars while keeping a running (global) index so the
// stagger flows continuously across the whole sentence.
const words = computed(() => {
  let index = 0
  return props.text.split(' ').map((word) => ({
    chars: word.split('').map((char) => ({ char, index: index++ })),
  }))
})
</script>

<template>
  <component :is="as" class="blur-reveal">
    <template v-for="(word, wordIndex) in words" :key="`w-${wordIndex}`">
      <span class="blur-reveal-word">
        <span
          v-for="item in word.chars"
          :key="`c-${item.index}`"
          class="blur-reveal-char"
          :style="{
            '--br-delay': `${delay + item.index * stagger}s`,
            '--br-duration': `${duration}s`,
          }"
          >{{ item.char }}</span
        >
      </span>
      <span v-if="wordIndex < words.length - 1" class="blur-reveal-space">{{ ' ' }}</span>
    </template>
  </component>
</template>

<style scoped>
.blur-reveal-word {
  display: inline-block;
  white-space: nowrap;
}

.blur-reveal-space {
  display: inline-block;
  white-space: pre;
}

.blur-reveal-char {
  display: inline-block;
  opacity: 0;
  filter: blur(12px);
  transform: translateY(10px);
  will-change: opacity, filter, transform;
  animation: blur-reveal-in var(--br-duration, 0.6s) ease forwards;
  animation-delay: var(--br-delay, 0s);
}

@keyframes blur-reveal-in {
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .blur-reveal-char {
    animation: none;
    opacity: 1;
    filter: none;
    transform: none;
  }
}
</style>
