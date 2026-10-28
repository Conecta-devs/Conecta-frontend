<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { requestPasswordReset } from '../services/auth'
import AuthField from '../components/AuthField.vue'
import AuthFormColumn from '../components/AuthFormColumn.vue'
import AuthShowcase from '../components/AuthShowcase.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppLink from '../../../shared/ui/AppLink.vue'

/**
 * Figma — Esqueci minha senha (760:611).
 *
 * Painel azul de 750px + coluna de recuperação por e-mail (760:644):
 * "Voltar ao login", eyebrow 14, título 32, orientação 14, divisor de 1px,
 * campo de e-mail (ícone `mail`), botão coral de 250 × 50 e link de volta.
 *
 * A resposta da API (sucesso ou erro) aparece dentro do frame do campo,
 * 5px abaixo do input — nunca numa linha nova acima do botão.
 */
const router = useRouter()

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

function voltarAoLogin() {
  void router.push('/login')
}
</script>

<template>
  <div class="relative flex min-h-dvh flex-col bg-co-white lg:block">
    <AuthShowcase @cta="voltarAoLogin">
      <div class="grid w-full">
        <div
          class="col-start-1 row-start-1 flex w-full flex-col items-start gap-4 transition-opacity duration-300 ease-out motion-reduce:transition-none sm:gap-5"
        >
          <p
            class="text-[32px] leading-[1.05] tracking-[-1.5px] text-co-white sm:text-[48px] sm:tracking-[-2.5px] lg:text-h1"
          >
            Conecte-se com<br />quem entende você.
          </p>
          <p class="text-h5 leading-[1.4] text-s-coral sm:text-h4 sm:leading-[normal]">
            Conheça novos estudantes, encontre seu grupo<br class="hidden sm:block" />
            e construa novas histórias dentro e fora da sala.
          </p>
        </div>
      </div>
    </AuthShowcase>

    <AuthFormColumn @submit="submitRequest">
      <!-- 760:646 — seta DM Sans Bold 13 + Roboto 14 em text-2. -->
      <button
        type="button"
        class="group inline-flex shrink-0 cursor-pointer items-center gap-[3px] border-0 bg-transparent p-0 font-sans text-h6 leading-[normal] whitespace-nowrap text-text-2 transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
        @click="voltarAoLogin"
      >
        <span
          class="inline-block font-arrow text-arrow transition-transform duration-300 ease-[cubic-bezier(0,0,0.58,1)] group-hover:-translate-x-1 motion-reduce:transition-none"
          >←</span
        >
        Voltar ao login
      </button>

      <!-- 760:647 -->
      <p class="text-h6 leading-[normal] text-co-coral">
        RECUPERAÇÃO DE CONTA <span class="text-co-blue">CONECTA.</span>
      </p>

      <!-- 760:648 -->
      <h1 class="text-title leading-[normal] text-text-1">Esqueceu sua senha?</h1>

      <!-- 760:649 -->
      <p class="text-h6 leading-[normal] text-text-2">
        Informe o e-mail associado à sua conta para receber as instruções de redefinição.
      </p>

      <!-- 760:650 — divisor de 710 × 1 -->
      <div class="h-px w-full shrink-0 bg-traceline" aria-hidden="true" />

      <!-- 760:651 — campo + mensagem da API -->
      <AuthField
        id="recovery-email"
        v-model="email"
        label="E-mail"
        icon="mail"
        type="email"
        autocomplete="email"
        placeholder="voce@email.com"
        :maxlength="150"
      >
        <p
          v-if="errorMessage"
          class="text-h6 leading-[normal] text-[rgba(255,0,4,0.65)]"
          role="alert"
        >
          {{ errorMessage }}
        </p>
        <p v-else-if="successMessage" class="text-h6 leading-[normal] text-[#2b6e4f]" role="status">
          {{ successMessage }}
        </p>
      </AuthField>

      <!-- 760:656 — botão coral 250 × 50 + link, gap 3 -->
      <div class="flex w-full shrink-0 flex-col items-center gap-[5px]">
        <AppButton
          type="submit"
          variant="coral"
          :disabled="isSubmitting"
          :width="250"
          :padding-left="40"
          :gap="15"
          :gap-hover="23"
        >
          {{ isSubmitting ? 'Enviando...' : 'Enviar instruções' }}
        </AppButton>

        <AppLink href="/login" size="h6" @click.prevent="voltarAoLogin">
          Voltar ao login
        </AppLink>
      </div>
    </AuthFormColumn>
  </div>
</template>
