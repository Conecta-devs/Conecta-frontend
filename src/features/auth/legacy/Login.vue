<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  faArrowLeft,
  faArrowRight,
  faEnvelope,
  faEye,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { LoginUser, registerUser } from '../services/auth'
import { saveSession } from '../../../shared/services/session'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import ProfileSetupModal from '../../profile/ProfileSetupModal.vue'

const router = useRouter()
const modoCadastro = ref(false)
const mostrarSenha = ref(false)
const nome = ref('')
const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)
const conta = ref('')
const modalPerfilAberto = ref(false)
const perfilCriado = ref(false)

async function enviarFormulario() {
  erro.value = ''

  enviando.value = true

  try {
    if (modoCadastro.value) {
      await registerUser({
        name: nome.value,
        email: email.value,
        password: senha.value,
      })

      const loginResponse = await LoginUser({
        email: email.value,
        password: senha.value,
      })
      saveSession(loginResponse.user, loginResponse.accessToken)

      conta.value = 'conta criada com sucesso!'
      perfilCriado.value = true
      modalPerfilAberto.value = true
      modoCadastro.value = false
      nome.value = ''
      email.value = ''
      senha.value = ''
    } else {
      const loginResponse = await LoginUser({
        email: email.value,
        password: senha.value,
      })

      saveSession(loginResponse.user, loginResponse.accessToken)
      router.push('/dashboard')
    }
  } catch (error) {
    erro.value = error instanceof Error ? error.message : 'Erro ao criar sua conta.'
  } finally {
    enviando.value = false
  }
}

function finalizarPerfil(payload: { name: string; image: string; gen: string; bio: string }) {
  console.log('Perfil configurado:', payload)
  modalPerfilAberto.value = false
  router.push('/dashboard')
}
</script>

<template>
  <main
    class="login-page grid min-h-screen bg-co-white text-text-1 lg:grid-cols-[.82fr_1.18fr]"
  >
    <section
      class="login-intro relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-co-blue px-7 py-8 text-co-white sm:px-12 lg:min-h-screen lg:px-[clamp(40px,7vw,105px)] lg:py-12"
    >
      <div
        class="intro-orbit absolute -bottom-32 -right-28 size-[390px] rounded-full border border-co-white/10 shadow-[0_0_0_30px_var(--color-co-white)]"
      ></div>
      <a
        class="relative z-10 flex w-fit items-center gap-2.5 text-co-white no-underline"
        href="/"
        aria-label="Voltar para o início"
      >
        <span
          class="grid size-9 place-items-center rounded-xl bg-co-white/15 text-lg font-bold"
          >C</span
        >
        <AppLogo
          variant="conecta"
          tone="light"
          :font-size="20"
          class="tracking-[-.7px]"
          alt=""
        />
      </a>

      <div class="relative z-10 max-w-[440px] py-8 lg:py-0">
        <p class="mb-4 text-[10px] font-bold uppercase tracking-[1.5px] text-s-blue">
          Um lugar para pertencer
        </p>
        <h1
          class="text-h2 max-w-[430px]"
        >
          CONECTE-SE
        </h1>
        <p class="mt-5 max-w-[390px] text-sm leading-6 text-s-blue">
          Conecte-se com estudantes, encontre seu grupo e construa novas histórias dentro e fora da
          sala de aula.
        </p>
        <div class="mt-8 flex items-center gap-3 text-xs font-semibold text-s-blue">
          <span class="grid size-8 place-items-center rounded-full bg-co-coral text-co-white"
            ><font-awesome-icon :icon="faUser"
          /></span>
          Comunidade feita para você
        </div>
      </div>

      <p class="relative z-10 m-0 hidden text-[11px] text-s-blue lg:block">
        Conversa que aproxima. Conecta que transforma.
      </p>
    </section>

    <section class="login-panel flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
      <div class="login-box w-full max-w-[430px]">
        <a
          class="mb-10 inline-flex items-center gap-2 text-xs font-bold text-text-2 no-underline transition-colors hover:text-co-blue"
          href="/"
          ><font-awesome-icon :icon="faArrowLeft" /> Voltar para o início</a
        >
        <div class="mb-8">
          <p class="mb-2 text-[10px] font-bold uppercase tracking-[1.4px] text-co-coral">
            Bem-vindo ao <span class="span-wel text-co-blue text-[12px]">Conecta</span>
            <span class="spawn-wel text-[13px] text-co-coral">.</span>
          </p>
          <h2 class="text-h2">
            {{
              modoCadastro
                ? 'Crie sua conta. '
                : 'Que bom ter você aqui. '
            }}
          </h2>
          <p class="mt-3 text-sm leading-6 text-text-2">
            {{
              modoCadastro
                ? 'Preencha seus dados e comece a fazer novas conexões.'
                : 'Entre para continuar de onde parou.'
            }}
          </p>
        </div>

        <div class="mb-7 grid grid-cols-2 border-b border-traceline">
          <button
            class="auth-tab cursor-pointer border-0 border-b-2 bg-transparent pb-3 text-sm font-bold transition-colors"
            :class="
              modoCadastro ? 'border-transparent text-text-2' : 'border-co-blue text-co-blue'
            "
            @click="modoCadastro = false"
          >
            Entrar
          </button>
          <button
            class="border-0 cursor-pointer border-b-2 bg-transparent pb-3 text-sm font-bold transition-colors"
            :class="
              modoCadastro ? 'border-co-blue text-co-blue' : 'border-transparent text-text-2'
            "
            @click="modoCadastro = true"
          >
            Criar conta
          </button>
        </div>

        <form class="auth-form flex flex-col gap-5" @submit.prevent="enviarFormulario">
          <label
            v-if="modoCadastro"
            class="form-field flex flex-col gap-2 text-xs font-bold text-text-2"
            ><span>Nome completo</span>
            <div
              class="field-input flex h-12 items-center gap-2.5 rounded-[9px] border border-traceline px-3.5 text-text-2 transition-[border-color,box-shadow] focus-within:border-s-blue focus-within:shadow-co-blue/10"
            >
              <font-awesome-icon :icon="faUser" /><input
                class="w-full border-0 bg-transparent text-[13px] text-text-1 outline-none placeholder:text-text-2"
                type="text"
                placeholder="Como podemos chamar você?"
                autocomplete="name"
                v-model="nome"
                maxlength="100"
                required
              /></div
          ></label>
          <label class="form-field flex flex-col gap-2 text-xs font-bold text-text-2"
            ><span>E-mail</span>
            <div
              class="field-input flex h-12 items-center gap-2.5 rounded-[9px] border border-traceline px-3.5 text-text-2 transition-[border-color,box-shadow] focus-within:border-s-blue focus-within:shadow-co-blue/10"
            >
              <font-awesome-icon :icon="faEnvelope" /><input
                class="w-full border-0 bg-transparent text-[13px] text-text-1 outline-none placeholder:text-text-2"
                type="email"
                placeholder="voce@email.com"
                autocomplete="email"
                v-model="email"
                maxlength="150"
                required
              /></div
          ></label>
          <label class="form-field flex flex-col gap-2 text-xs font-bold text-text-2"
            ><span>Senha</span>
            <div
              class="field-input flex h-12 items-center gap-2.5 rounded-[9px] border border-traceline px-3.5 text-text-2 transition-[border-color,box-shadow] focus-within:border-s-blue focus-within:shadow-co-blue/10"
            >
              <font-awesome-icon :icon="faLock" /><input
                class="w-full border-0 bg-transparent text-[13px] text-text-1 outline-none placeholder:text-text-2"
                :type="mostrarSenha ? 'text' : 'password'"
                placeholder="Digite sua senha"
                :autocomplete="modoCadastro ? 'new-password' : 'current-password'"
                v-model="senha"
                maxlength="20"
                minlength="8"
                required
              /><button
                type="button"
                class="border-0 bg-transparent p-1 text-text-2"
                aria-label="Mostrar senha"
                @click="mostrarSenha = !mostrarSenha"
              >
                <font-awesome-icon :icon="faEye" />
              </button></div
          ></label>
          <div v-if="!modoCadastro" class="-mt-2 flex justify-end">
            <RouterLink
              class="text-xs font-bold text-s-blue no-underline hover:text-co-blue"
              to="/forgot-password"
            >
              Esqueci minha senha
            </RouterLink>
          </div>
          <button
            class="auth-submit cursor-pointer mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg border-0 bg-co-blue text-sm font-bold text-co-white transition-colors hover:bg-co-blue/90"
            type="submit"
            :disabled="enviando"
          >
            {{
              enviando
                ? 'Enviando...'
                : modoCadastro
                  ? 'Criar minha conta'
                  : 'Entrar na minha conta'
            }}
            <font-awesome-icon :icon="faArrowRight" />
          </button>
        </form>

        <p v-if="erro" class="mt-4 text-center text-xs text-co-coral" role="alert">{{ erro }}</p>
        <p v-if="modoCadastro" class="mt-4 text-center text-xs text-co-coral" role="alert">{{ conta }}</p>
        <p class="mt-8 text-center text-xs text-text-2">
          {{ modoCadastro ? 'Já possui uma conta?' : 'Ainda não possui uma conta?' }}
          <button
            class="border-0 bg-transparent p-0 font-bold text-co-coral"
            @click="modoCadastro = !modoCadastro"
          >
            {{ modoCadastro ? 'Entrar' : 'Criar conta' }}
          </button>
        </p>
      </div>
    </section>
  </main>

  <ProfileSetupModal
    :model-value="modalPerfilAberto"
    @update:model-value="modalPerfilAberto = $event"
    @save="finalizarPerfil"
  />
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
</style>
