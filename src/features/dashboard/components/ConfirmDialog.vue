<script setup lang="ts">
import AppModal from './AppModal.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel: string
    cancelLabel?: string
    danger?: boolean
    busy?: boolean
    labelledBy?: string
    describedBy?: string
  }>(),
  {
    description: '',
    cancelLabel: 'Cancelar',
    danger: false,
    busy: false,
    labelledBy: undefined,
    describedBy: undefined,
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <AppModal
    role="alertdialog"
    :labelled-by="labelledBy"
    :described-by="describedBy"
    max-width="md"
    @backdrop="emit('cancel')"
  >
    <div class="p-6">
      <div
        v-if="$slots.icon"
        class="mb-4 grid size-12 place-items-center rounded-icon bg-s-coral text-co-coral"
      >
        <slot name="icon" />
      </div>

      <h2 :id="labelledBy" class="text-h3 font-semibold text-co-blue">{{ title }}</h2>

      <p :id="describedBy" class="mt-3 break-words text-h6 font-medium leading-6 text-text-2">
        <slot name="description">{{ description }}</slot>
      </p>

      <footer class="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="h-[50px] rounded-button border border-traceline bg-co-white px-4 text-h5 font-medium text-text-2 transition-colors hover:bg-s-blue/30 hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
          :disabled="busy"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="h-[50px] rounded-button px-4 text-h5 font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            danger
              ? 'bg-danger hover:bg-danger-hover focus-visible:outline-danger'
              : 'bg-co-blue hover:bg-co-blue/90 focus-visible:outline-co-blue'
          "
          :disabled="busy"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </footer>
    </div>
  </AppModal>
</template>
