<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '../../services/auth'

const route = useRoute()
const router = useRouter()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const isTokenValid = computed(() => /^[A-Za-z0-9_-]{43}$/.test(token.value))
const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function submitReset() {
  if (isSubmitting.value) return

  errorMessage.value = ''
  successMessage.value = ''

  if (!isTokenValid.value) {
    errorMessage.value = 'Este link é inválido ou expirou. Solicite outro link.'
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = 'A senha precisa ter pelo menos 8 caracteres.'
    return
  }
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'As senhas não coincidem.'
    return
  }

  isSubmitting.value = true
  try {
    successMessage.value = await resetPassword(token.value, password.value)
    password.value = ''
    passwordConfirmation.value = ''
    await router.replace({ path: route.path })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível redefinir a senha agora.'
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
          Segurança da conta
        </p>
        <h1 class="font-['Space_Grotesk',sans-serif] text-2xl font-semibold text-[#172238]">
          Criar nova senha
        </h1>

        <template v-if="isTokenValid && !successMessage">
          <p class="mt-3 text-sm leading-6 text-[#7d8798]">
            Escolha uma senha com pelo menos 8 caracteres.
          </p>
          <form class="mt-7 flex flex-col gap-5" @submit.prevent="submitReset">
            <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]" for="new-password">
              Nova senha
              <input
                id="new-password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="h-12 w-full rounded-lg border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.1)]"
              />
            </label>
            <label
              class="flex flex-col gap-2 text-xs font-bold text-[#53617a]"
              for="confirm-password"
            >
              Confirmar nova senha
              <input
                id="confirm-password"
                v-model="passwordConfirmation"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="h-12 w-full rounded-lg border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.1)]"
              />
            </label>

            <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex h-12 items-center justify-center rounded-lg bg-[#253b73] px-5 text-sm font-bold text-white transition hover:bg-[#1d2f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? 'Salvando...' : 'Redefinir senha' }}
            </button>
          </form>
        </template>

        <p v-else-if="successMessage" class="mt-4 text-sm leading-6 text-[#28704f]" role="status">
          {{ successMessage }}
        </p>
        <p v-else class="mt-4 text-sm leading-6 text-red-600" role="alert">
          Este link é inválido ou expirou. Solicite outro link.
        </p>

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