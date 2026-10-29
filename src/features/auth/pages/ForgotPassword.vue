<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { requestPasswordReset } from '../services/auth'
import AuthField from '../components/AuthField.vue'
import AuthFormColumn from '../components/AuthFormColumn.vue'
import AuthIntro from '../components/AuthIntro.vue'
import AuthShowcase from '../components/AuthShowcase.vue'
import AppBackLink from '../../../shared/ui/AppBackLink.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppDivider from '../../../shared/ui/AppDivider.vue'
import AppEyebrow from '../../../shared/ui/AppEyebrow.vue'
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
      <AuthIntro />
    </AuthShowcase>

    <AuthFormColumn @submit="submitRequest">
      <AppBackLink @click="voltarAoLogin" />

      <!-- 760:647 -->
      <AppEyebrow texto="RECUPERAÇÃO DE CONTA" />

      <!-- 760:648 -->
      <h1 class="text-title leading-[normal] text-text-1">Esqueceu sua senha?</h1>

      <!-- 760:649 -->
      <p class="text-h6 leading-[normal] text-text-2">
        Informe o e-mail associado à sua conta para receber as instruções de redefinição.
      </p>

      <!-- 760:650 — divisor de 710 × 1 -->
      <AppDivider />

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
        :erro="errorMessage"
        :sucesso="successMessage"
      />

      <!-- 760:656 — botão coral 250 × 50 + link, gap 5 -->
      <div class="flex w-full shrink-0 flex-col items-center gap-[5px]">
        <AppButton
          type="submit"
          variant="coral"
          :disabled="isSubmitting"
          :busy="isSubmitting"
          :centered="isSubmitting"
          :width="250"
        >
          {{ isSubmitting ? 'Enviando...' : 'Enviar instruções' }}
        </AppButton>

        <AppLink href="/login" size="h6" @click.prevent="voltarAoLogin"> Voltar ao login </AppLink>
      </div>
    </AuthFormColumn>
  </div>
</template>
