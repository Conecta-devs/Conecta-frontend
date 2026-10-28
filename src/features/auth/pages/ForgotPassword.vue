<script setup lang="ts">
import { ref } from 'vue'
import { requestPasswordReset } from '../services/auth'

const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function submitRequest() {
  if (isSubmitting.value) return

  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    successMessage.value = await requestPasswordReset(email.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível solicitar a redefinição agora. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-[#f8f7f4] px-5 py-10 font-['DM_Sans',sans-serif] text-[#172238]"
  >
    <section class="w-full max-w-[430px]">
      <RouterLink
        class="mb-10 inline-flex items-center gap-2.5 text-xl font-bold text-[#253b73] no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#536bad]"
        to="/login"
        aria-label="Conecta, voltar ao login"
      >
        <span class="grid size-9 place-items-center rounded-lg bg-[#253b73] text-white">C</span>
        <span class="font-['Space_Grotesk',sans-serif]">conecta<span class="text-[#e8755f]">.</span></span>
      </RouterLink>

      <div class="rounded-xl border border-[#e4e7ed] bg-white p-6 shadow-sm sm:p-9">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-[1.4px] text-[#e8755f]">
          Recuperação de conta
        </p>
        <h1 class="font-['Space_Grotesk',sans-serif] text-2xl font-semibold text-[#172238]">
          Esqueceu sua senha?
        </h1>
        <p class="mt-3 text-sm leading-6 text-[#7d8798]">
          Informe o e-mail associado à sua conta para receber as instruções de redefinição.
        </p>

        <form class="mt-7 flex flex-col gap-5" @submit.prevent="submitRequest">
          <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]" for="recovery-email">
            E-mail
            <input
              id="recovery-email"
              v-model.trim="email"
              type="email"
              autocomplete="email"
              maxlength="150"
              required
              class="h-12 w-full rounded-lg border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.1)]"
              placeholder="voce@email.com"
            />
          </label>

          <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
            {{ errorMessage }}
          </p>
          <p v-if="successMessage" class="text-sm leading-6 text-[#28704f]" role="status">
            {{ successMessage }}
          </p>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex h-12 items-center justify-center rounded-lg bg-[#253b73] px-5 text-sm font-bold text-white transition hover:bg-[#1d2f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isSubmitting ? 'Enviando...' : 'Enviar instruções' }}
          </button>
        </form>

        <RouterLink
          class="mt-6 inline-block text-sm font-bold text-[#536bad] no-underline hover:text-[#253b73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
          to="/login"
        >
          Voltar ao login
        </RouterLink>
      </div>
    </section>
  </main>
</template>