<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    confirmLabel: string
    busyLabel: string
    error?: string
    loading: boolean
    labelledBy: string
    describedBy: string
  }>(),
  {
    error: '',
  },
)

const emit = defineEmits<{
  (event: 'confirm'): void
  (event: 'cancel'): void
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)
const submitButton = ref<HTMLButtonElement | null>(null)

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const cancel = cancelButton.value
  const submit = submitButton.value
  if (!cancel || !submit) return

  if (event.shiftKey && document.activeElement === cancel) {
    event.preventDefault()
    submit.focus()
  } else if (!event.shiftKey && document.activeElement === submit) {
    event.preventDefault()
    cancel.focus()
  }
}

onMounted(() => {
  void nextTick(() => cancelButton.value?.focus())
})

function handleCancel() {
  if (props.loading) return
  emit('cancel')
}

function handleConfirm() {
  if (props.loading) return
  emit('confirm')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-overlay/40 p-4"
    @click.self="handleCancel"
  >
    <section
      class="w-full max-w-sm rounded-card bg-white p-5 shadow-2xl"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      @keydown="handleKeydown"
    >
      <h2 :id="labelledBy" class="m-0 text-base font-semibold text-text-1">
        {{ title }}
      </h2>
      <p :id="describedBy" class="mb-0 mt-2 text-xs leading-5 text-text-1">
        {{ description }}
      </p>
      <p v-if="error" class="mb-0 mt-3 text-xs text-danger" role="alert">
        {{ error }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button
          ref="cancelButton"
          class="rounded-lg border border-traceline bg-white px-3 py-2 text-xs font-semibold text-text-2 transition-colors hover:bg-co-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-co-blue disabled:opacity-50"
          type="button"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          ref="submitButton"
          class="rounded-lg border-0 bg-danger px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-danger-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-wait disabled:opacity-60"
          type="button"
          :disabled="loading"
          @click="handleConfirm"
        >
          {{ loading ? busyLabel : confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>
