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
import { LoginUser, registerUser } from '../../services/auth'
import { saveSession } from '../../services/session'
const router = useRouter()
const modoCadastro = ref(false)
const mostrarSenha = ref(false)
const nome = ref('')
const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)

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
    } else {
      const loginResponse = await LoginUser({
        email: email.value,
        password: senha.value,
      })

      saveSession(loginResponse.user, loginResponse.accessToken)
    }

    router.push('/dashboard')
  } catch (error) {
    erro.value = error instanceof Error ? error.message : 'Erro ao criar sua conta.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <main
    class="login-page grid min-h-screen bg-[#f8f7f4] font-['DM_Sans',sans-serif] text-[#172238] lg:grid-cols-[.82fr_1.18fr]"
  >
    <section
      class="login-intro relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-[#253b73] px-7 py-8 text-white sm:px-12 lg:min-h-screen lg:px-[clamp(40px,7vw,105px)] lg:py-12"
    >
      <div
        class="intro-orbit absolute -bottom-32 -right-28 size-[390px] rounded-full border border-white/10 shadow-[0_0_0_30px_rgba(255,255,255,.025),0_0_0_60px_rgba(255,255,255,.025)]"
      ></div>
      <a
        class="relative z-10 flex w-fit items-center gap-2.5 text-white no-underline"
        href="/"
        aria-label="Voltar para o início"
      >
        <span
          class="grid size-9 place-items-center rounded-xl bg-white/15 font-['Space_Grotesk',sans-serif] text-lg font-bold"
          >C</span
        >
        <span class="font-['Space_Grotesk',sans-serif] text-xl font-bold tracking-[-.7px]"
          >conecta<span class="text-[#f29a83]">.</span></span
        >
      </a>

      <div class="relative z-10 max-w-[440px] py-8 lg:py-0">
        <p class="mb-4 text-[10px] font-bold uppercase tracking-[1.5px] text-[#b9c5e8]">
          Um lugar para pertencer(text a decidir)
        </p>
        <h1
          class="max-w-[430px] font-['Space_Grotesk',sans-serif] text-4xl font-semibold leading-[1.05] tracking-[-1.5px] sm:text-5xl"
        >
          texto aleatorio sujeito a mudança apenas layout mesmo...
        </h1>
        <p class="mt-5 max-w-[390px] text-sm leading-6 text-[#c7d0e9]">
          Conecte-se com estudantes, encontre seu grupo e construa novas histórias dentro e fora da
          sala de aula.(texto aleatorio sujeito a mudança)
        </p>
        <div class="mt-8 flex items-center gap-3 text-xs font-semibold text-[#dbe2f3]">
          <span class="grid size-8 place-items-center rounded-full bg-[#e8755f] text-white"
            ><font-awesome-icon :icon="faUser"
          /></span>
          Comunidade feita para você(text a decidir)
        </div>
      </div>

      <p class="relative z-10 m-0 hidden text-[11px] text-[#aebadd] lg:block">
        Conversa que aproxima. Conecta que transforma.(text a decidir)
      </p>
    </section>

    <section class="login-panel flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
      <div class="login-box w-full max-w-[430px]">
        <a
          class="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#7d8798] no-underline transition-colors hover:text-[#253b73]"
          href="/"
          ><font-awesome-icon :icon="faArrowLeft" /> Voltar para o início</a
        >
        <div class="mb-8">
          <p class="mb-2 text-[10px] font-bold uppercase tracking-[1.4px] text-[#e8755f]">
            Bem-vindo ao <span class="span-wel text-[#263b73] text-[12px]">Conecta</span>
            <span class="spawn-wel text-[13px] text[#8755f]">.</span>
          </p>
          <h2 class="font-['Space_Grotesk',sans-serif] text-3xl font-semibold tracking-[-1px]">
            {{
              modoCadastro
                ? 'Crie sua conta. (text a decidir)'
                : 'Que bom ter você aqui. (text a decidir)'
            }}
          </h2>
          <p class="mt-3 text-sm leading-6 text-[#7d8798]">
            {{
              modoCadastro
                ? 'Preencha seus dados e comece a fazer novas conexões. (text a decidir)'
                : 'Entre para continuar de onde parou. (text a decidir)'
            }}
          </p>
        </div>

        <div class="mb-7 grid grid-cols-2 border-b border-[#e4e7ed]">
          <button
            class="auth-tab cursor-pointer border-0 border-b-2 bg-transparent pb-3 text-sm font-bold transition-colors"
            :class="
              modoCadastro ? 'border-transparent text-[#929aaa]' : 'border-[#253b73] text-[#253b73]'
            "
            @click="modoCadastro = false"
          >
            Entrar
          </button>
          <button
            class="border-0 cursor-pointer border-b-2 bg-transparent pb-3 text-sm font-bold transition-colors"
            :class="
              modoCadastro ? 'border-[#253b73] text-[#253b73]' : 'border-transparent text-[#929aaa]'
            "
            @click="modoCadastro = true"
          >
            Criar conta
          </button>
        </div>

        <form class="auth-form flex flex-col gap-5" @submit.prevent="enviarFormulario">
          <label
            v-if="modoCadastro"
            class="form-field flex flex-col gap-2 text-xs font-bold text-[#53617a]"
            ><span>Nome completo</span>
            <div
              class="field-input flex h-12 items-center gap-2.5 rounded-[9px] border border-[#e1e5ec] px-3.5 text-[#9aa3b1] transition-[border-color,box-shadow] focus-within:border-[#536bad] focus-within:shadow-[0_0_0_3px_rgba(83,107,173,.1)]"
            >
              <font-awesome-icon :icon="faUser" /><input
                class="w-full border-0 bg-transparent text-[13px] text-[#172238] outline-none placeholder:text-[#a7afbb]"
                type="text"
                placeholder="Como podemos chamar você?"
                autocomplete="name"
                v-model="nome"
                maxlength="100"
                required
              /></div
          ></label>
          <label class="form-field flex flex-col gap-2 text-xs font-bold text-[#53617a]"
            ><span>E-mail</span>
            <div
              class="field-input flex h-12 items-center gap-2.5 rounded-[9px] border border-[#e1e5ec] px-3.5 text-[#9aa3b1] transition-[border-color,box-shadow] focus-within:border-[#536bad] focus-within:shadow-[0_0_0_3px_rgba(83,107,173,.1)]"
            >
              <font-awesome-icon :icon="faEnvelope" /><input
                class="w-full border-0 bg-transparent text-[13px] text-[#172238] outline-none placeholder:text-[#a7afbb]"
                type="email"
                placeholder="voce@email.com"
                autocomplete="email"
                v-model="email"
                maxlength="150"
                required
              /></div
          ></label>
          <label class="form-field flex flex-col gap-2 text-xs font-bold text-[#53617a]"
            ><span>Senha</span>
            <div
              class="field-input flex h-12 items-center gap-2.5 rounded-[9px] border border-[#e1e5ec] px-3.5 text-[#9aa3b1] transition-[border-color,box-shadow] focus-within:border-[#536bad] focus-within:shadow-[0_0_0_3px_rgba(83,107,173,.1)]"
            >
              <font-awesome-icon :icon="faLock" /><input
                class="w-full border-0 bg-transparent text-[13px] text-[#172238] outline-none placeholder:text-[#a7afbb]"
                :type="mostrarSenha ? 'text' : 'password'"
                placeholder="Digite sua senha"
                :autocomplete="modoCadastro ? 'new-password' : 'current-password'"
                v-model="senha"
                maxlength="20"
                minlength="8"
                required
              /><button
                type="button"
                class="border-0 bg-transparent p-1 text-[#9aa3b1]"
                aria-label="Mostrar senha"
                @click="mostrarSenha = !mostrarSenha"
              >
                <font-awesome-icon :icon="faEye" />
              </button></div
          ></label>
          <div v-if="!modoCadastro" class="-mt-2 flex justify-end">
            <a class="text-xs font-bold text-[#536bad] no-underline hover:text-[#253b73]" href="#"
              >Esqueci minha senha</a
            >
          </div>
          <button
            class="auth-submit cursor-pointer mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg border-0 bg-[#253b73] text-sm font-bold text-white transition-colors hover:bg-[#1d2f61]"
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

        <p v-if="erro" class="mt-4 text-center text-xs text-red-600" role="alert">{{ erro }}</p>

        <p class="mt-8 text-center text-xs text-[#858f9f]">
          {{ modoCadastro ? 'Já possui uma conta?' : 'Ainda não possui uma conta?' }}
          <button
            class="border-0 bg-transparent p-0 font-bold text-[#e8755f]"
            @click="modoCadastro = !modoCadastro"
          >
            {{ modoCadastro ? 'Entrar' : 'Criar conta' }}
          </button>
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

:global(*) {
  box-sizing: border-box;
}
:global(body) {
  margin: 0;
}
</style>
