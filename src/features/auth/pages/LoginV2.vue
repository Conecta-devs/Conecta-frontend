<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { LoginUser, registerUser } from '../services/auth'
import { saveSession } from '../../../shared/services/session'
import AppArrowIcon from '../../../shared/ui/AppArrowIcon.vue'
import AppAuthTabs from '../../../shared/ui/AppAuthTabs.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppLink from '../../../shared/ui/AppLink.vue'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import CanvasLayout from '../../../shared/ui/CanvasLayout.vue'
import coletiveIcon from '../../../assets/icons/coletive-white.svg'
import orbitOuter from '../../../assets/decorations/orbit2.svg'
import orbitInner from '../../../assets/decorations/orbit.svg'

/**
 * Figma — Login / Register (446:109, 468:187, 506:1651, 506:1917, 506:1739)
 *
 * O fluxo do Figma vive em 5 frames, mas todos compartilham o mesmo layout
 * (painel azul 750x910 à esquerda + formulário 1170x910 à direita). Por isso
 * aqui tudo é um único componente com estados:
 *
 *   - modo:      'login' | 'register'
 *   - erro:      erro da API, exibido dentro do frame do campo
 *                (login 506:1939 → "Email ou senha incorretos.";
 *                 register 506:1693 → "As senhas devem coincidir entre si.")
 *   - erroSenha: erro inline no confirmar senha (frame 506:1693)
 *   - criado:    frame 506:1739 → tela "Conta criada com sucesso!"
 *
 * Tokens do Figma: gap 32 no form, 5 no label→input, inputs 50px raio 10,
 * botão coral 50px raio 10 com seta 16x12 a 15px do label, aba ativa em co-blue
 * com underline de 3px, eyebrow 14 (coral + azul), título 32 SemiBold.
 */

const router = useRouter()
const route = useRoute()

type Modo = 'login' | 'register'

const props = withDefaults(
  defineProps<{
    /** Abre já no estado de sucesso (frame 506:1739). */
    estadoInicial?: 'login' | 'register' | 'criado'
  }>(),
  {
    estadoInicial: 'login',
  },
)

const modo = ref<Modo>(props.estadoInicial === 'register' ? 'register' : 'login')
const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const mostrarSenha = ref(false)
const erro = ref('')
const erroSenha = ref('')
const enviando = ref(false)
const criado = ref(props.estadoInicial === 'criado')

/**
 * Transição formulário → "Conta criada com sucesso!".
 *
 * O protótipo do Figma define, no botão `468:230`:
 *   Ação      → Mudar para (Change to)
 *   Animação  → Animação inteligente (Smart Animate)
 *   Suavização→ Desaceleração (Ease out)
 *   Duração   → 300 ms
 *
 * O Smart Animate casa as camadas de mesmo nome e interpola posição, tamanho,
 * cor e opacidade. Do frame Register (468:187) para o sucesso (506:1739) as
 * camadas casadas são:
 *
 *   Painel   azul 750x910  →  verde 1920x910   (largura + cor)
 *   Logo     100x55 (91,22) → 100x55 (91,22)    (fica no lugar, troca a cor)
 *   Orbitais esquerdo (597,836) → igual        (ficam no lugar)
 *   Orbitais direito  ausente   → (1843,140)    (entram)
 *   Textos   intro do form   →  intro do sucesso (cross-fade)
 *
 * Por isso as camadas casadas vivem numa única "shell" e animam via CSS; só os
 * blocos de texto/formulário fazem cross-fade em vez de trocar de árvore.
 */
const transicionando = ref(false)

/** A Landpage manda `?modo=register` (Inscreva-se / Quero participar / Começar agora). */
onMounted(() => {
  const pedido = route.query.modo
  if (pedido === 'register' || pedido === 'login') {
    modo.value = pedido
  }
})

const titulo = computed(() =>
  modo.value === 'register' ? 'Que bom ter você aqui.' : 'Que bom ter você aqui de volta!',
)
const subtitulo = computed(() =>
  modo.value === 'register'
    ? 'Comece a se conectar com outros estudantes.'
    : 'Entre para continuar de onde parou.',
)

function trocarModo(novo: Modo) {
  modo.value = novo
  erro.value = ''
  erroSenha.value = ''
}

async function enviar() {
  erro.value = ''
  erroSenha.value = ''

  if (modo.value === 'register' && senha.value !== confirmarSenha.value) {
    erroSenha.value = 'As senhas devem coincidir entre si.'
    return
  }

  enviando.value = true

  try {
    if (modo.value === 'register') {
      await registerUser({ name: nome.value, email: email.value, password: senha.value })
      // Smart Animate: "Mudar para" a tela de sucesso (ease out, 300ms).
      // `criado` dispara a interpolação das camadas casadas (painel, logo,
      // orbitais); `transicionando` só marca o bloqueio de input.
      transicionando.value = true
      criado.value = true
      window.setTimeout(() => {
        transicionando.value = false
      }, 320)
    } else {
      const resposta = await LoginUser({ email: email.value, password: senha.value })
      const token = resposta.accessToken ?? resposta.token ?? null
      saveSession(resposta.user, token)
      router.push('/dashboard')
    }
  } catch {
    // Cada modo tem o seu frame de erro no Figma (506:1939 e 506:1693).
    erro.value =
      modo.value === 'register'
        ? 'As senhas devem coincidir entre si.'
        : 'Email ou senha incorretos.'
  } finally {
    enviando.value = false
  }
}

function irParaLogin() {
  criado.value = false
  transicionando.value = false
  modo.value = 'login'
  nome.value = ''
  email.value = ''
  senha.value = ''
  confirmarSenha.value = ''
  erro.value = ''
  erroSenha.value = ''
}

function voltarAoInicio() {
  router.push('/landpage-v2')
}

/** Classes compartilhadas dos campos (frame: label 14, input 50px raio 10). */
const inputBase =
  'flex h-[50px] w-full items-center rounded-[10px] border border-[rgba(0,0,0,0.16)] bg-[rgba(255,255,255,0.8)] px-3 text-h6 text-text-1 outline-none placeholder:text-text-2/50 focus:border-co-coral'
</script>

<template>
  <CanvasLayout id="login-scroll" :centered="false">
    <!--
      Uma única "shell" persistente. O Figma faz Smart Animate ("Mudar para",
      ease out, 300ms) entre o frame Register (468:187) e o sucesso (506:1739):
      as camadas casadas (painel, logo, orbitais) interpolam no lugar, e apenas
      os blocos de conteúdo (form × intro de sucesso) fazem cross-fade.
    -->
    <div
      class="auth-shell relative h-screen overflow-hidden bg-co-white"
      :class="{ 'auth-shell--criado': criado, 'auth-shell--saindo': transicionando }"
    >
      <!-- ========== Painel (468:187 azul 750x910 → 506:1739 verde 1920x910) ========== -->
      <div
        class="absolute top-0 left-0 flex h-screen flex-col items-start gap-[250px] overflow-hidden pt-[22px] pl-[91px]"
        :class="criado ? 'w-[1920px] bg-tree-green' : 'w-[750px] bg-co-blue'"
      >
        <!-- Logo (100x55 em (91,22)) — camada casada: fica no lugar, troca a cor -->
        <button
          type="button"
          class="relative h-[55px] w-[100px] shrink-0 cursor-pointer"
          aria-label="Voltar ao início"
          @click="voltarAoInicio"
        >
          <AppLogo
            variant="logo-2"
            :width="100"
            :height="55"
            alt=""
            class="absolute inset-0 transition-opacity duration-300 ease-out"
            :class="criado ? 'opacity-0' : 'opacity-100'"
          />
          <AppLogo
            variant="logo-1"
            :width="100"
            :height="55"
            alt=""
            class="absolute inset-0 transition-opacity duration-300 ease-out"
            :class="criado ? 'opacity-100' : 'opacity-0'"
          />
        </button>

        <!--
        Blocos de conteúdo do painel — cross-fade.
        No sucesso o painel é a tela inteira (1920), então o texto ocupa
        w-full; no formulário ele fica contido nos 750px.
      -->
        <div class="relative w-full shrink-0">
          <!-- Intro do formulário (446:109 / 468:187) -->
          <div
            class="flex w-full flex-col items-start justify-center gap-5 overflow-hidden transition-all duration-[300ms] ease-out"
            :class="
              criado ? 'pointer-events-none absolute inset-x-0 top-0 opacity-0' : 'opacity-100'
            "
          >
            <p class="text-h1 whitespace-nowrap text-co-white">
              Conecte-se com<br />quem entende você.
            </p>
            <p class="text-h4 leading-[normal] whitespace-nowrap text-s-coral">
              Conheça novos estudantes, encontre seu grupo<br />e construa novas histórias dentro e
              fora da sala.
            </p>
            <div class="flex shrink-0 items-center justify-center gap-[10px] overflow-hidden">
              <img :src="coletiveIcon" alt="" class="size-[50px] shrink-0" draggable="false" />
              <p class="text-h6 leading-[normal] whitespace-nowrap text-s-blue">
                Comunidade feita para você
              </p>
            </div>
          </div>

          <!-- Intro do sucesso (506:1794) -->
          <div
            class="flex w-full flex-col items-start justify-center gap-5 overflow-hidden transition-all duration-[300ms] ease-out"
            :class="
              criado ? 'opacity-100' : 'pointer-events-none absolute inset-x-0 top-0 opacity-0'
            "
          >
            <p class="text-h1 whitespace-nowrap text-co-white">
              Conta criada com sucesso!
            </p>
            <p class="text-h4 leading-[normal] whitespace-nowrap text-s-coral">
              Conheça novos estudantes, encontre seu grupo<br />e construa novas histórias dentro e
              fora da sala.
            </p>
            <div class="flex shrink-0 items-center justify-center gap-[10px] overflow-hidden">
              <img :src="coletiveIcon" alt="" class="size-[50px] shrink-0" draggable="false" />
              <p class="text-h6 leading-[normal] whitespace-nowrap text-s-blue">
                Comunidade feita para você
              </p>
            </div>
          </div>
        </div>

        <!-- Rodapé do painel: frase (form) × botão (sucesso) -->
        <div class="relative w-full shrink-0">
          <p
            class="text-h6 leading-[normal] whitespace-nowrap text-s-blue transition-opacity duration-300 ease-out"
            :class="
              criado ? 'pointer-events-none absolute inset-x-0 top-0 opacity-0' : 'opacity-100'
            "
          >
            Conversa que aproxima. Conexão que transforma.
          </p>
          <div
            class="flex shrink-0 items-center justify-end transition-opacity duration-300 ease-out"
            :class="
              criado
                ? 'w-[1599px] opacity-100'
                : 'pointer-events-none absolute inset-x-0 top-0 w-full opacity-0'
            "
          >
            <button
              type="button"
              class="flex h-[50px] w-[260px] shrink-0 cursor-pointer items-center gap-[15px] rounded-[10px] bg-co-blue px-10 font-sans text-h5 leading-[normal] whitespace-nowrap text-co-white transition-colors hover:bg-co-blue/90"
              @click="irParaLogin"
            >
              Entrar na minha conta
              <AppArrowIcon />
            </button>
          </div>
        </div>
      </div>

      <!--
      Orbitais — camadas casadas do Smart Animate.
      Os SVGs têm 40px de padding interno (canvas 590/670 para anéis de 510/590),
      então posicionamos o canvas 40px antes do frame do Figma:
        - anel interno 510 (468:204) → canvas 590 em (302, 541)
        - anel externo 590 (468:205) → canvas 670 em (262, 501)
      Par esquerdo presente em todos os frames, mesmo centro (597, 836).
      Par direito (506:1846/506:1847): existe só no sucesso — entra com fade.
    -->
      <img
        :src="orbitInner"
        alt=""
        class="pointer-events-none absolute top-[541px] left-[302px] h-[590px] w-[590px] transition-opacity duration-300 ease-out"
        draggable="false"
      />
      <img
        :src="orbitOuter"
        alt=""
        class="pointer-events-none absolute top-[501px] left-[262px] h-[670px] w-[670px] transition-opacity duration-300 ease-out"
        draggable="false"
      />
      <img
        :src="orbitInner"
        alt=""
        class="pointer-events-none absolute top-[-155px] left-[1548px] h-[590px] w-[590px] transition-opacity duration-300 ease-out"
        :class="criado ? 'opacity-100' : 'opacity-0'"
        draggable="false"
      />
      <img
        :src="orbitOuter"
        alt=""
        class="pointer-events-none absolute top-[-195px] left-[1508px] h-[670px] w-[670px] transition-opacity duration-300 ease-out"
        :class="criado ? 'opacity-100' : 'opacity-0'"
        draggable="false"
      />

      <!-- ========== Formulário (454:99 / 468:206) — sai no Smart Animate ========== -->
      <form
        class="absolute top-0 left-[750px] flex h-screen w-[1170px] flex-col items-start gap-8 px-[230px] py-[123px] transition-all duration-[300ms] ease-out"
        :class="criado ? 'pointer-events-none translate-y-[-12px] opacity-0' : 'opacity-100'"
        @submit.prevent="enviar"
      >
        <button
          type="button"
          class="group inline-flex shrink-0 cursor-pointer items-center gap-[3px] border-0 bg-transparent p-0 font-sans text-h6 leading-[normal] whitespace-nowrap text-text-2 transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
          @click="voltarAoInicio"
        >
          <span
            class="inline-block font-arrow text-arrow transition-transform duration-300 ease-[cubic-bezier(0,0,0.58,1)] group-hover:-translate-x-1 motion-reduce:transition-none"
            >←</span
          >
          Voltar para o início
        </button>

        <p class="text-h6 leading-[normal] whitespace-nowrap text-co-coral">
          BEM-VINDO AO <span class="text-co-blue">CONECTA.</span>
        </p>

        <p class="text-title whitespace-nowrap text-text-1">
          {{ titulo }}
        </p>

        <p class="text-h6 leading-[normal] whitespace-nowrap text-text-2">{{ subtitulo }}</p>

        <!-- Tabs Entrar / Criar conta (554:177) — componente compartilhado -->
        <AppAuthTabs :mode="modo" @select="trocarModo" />

        <!-- Separador (454:105 / 468:218) — linha de 710x1 em traceline -->
        <div class="h-px w-full shrink-0 bg-traceline" aria-hidden="true" />

        <!-- Campos -->
        <label
          v-if="modo === 'register'"
          class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2"
        >
          Nome completo
          <input
            v-model="nome"
            type="text"
            class="font-sans"
            :class="inputBase"
            placeholder="Como podemos chamar você?"
            autocomplete="name"
            maxlength="100"
            required
          />
        </label>

        <label class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2">
          E-mail
          <input
            v-model="email"
            type="email"
            class="font-sans"
            :class="inputBase"
            placeholder="✉ voce@email.com"
            autocomplete="email"
            maxlength="150"
            required
          />
        </label>

        <label class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2">
          Senha
          <span class="relative flex w-full items-center">
            <input
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              class="font-sans"
              :class="inputBase"
              placeholder="▣ Digite sua senha"
              :autocomplete="modo === 'register' ? 'new-password' : 'current-password'"
              maxlength="20"
              minlength="8"
              required
            />
            <button
              type="button"
              class="absolute right-3 cursor-pointer border-0 bg-transparent p-0 text-h6 text-text-2"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
              @click="mostrarSenha = !mostrarSenha"
            >
              {{ mostrarSenha ? 'ocultar' : 'ver' }}
            </button>
          </span>
          <p
            v-if="modo === 'login' && erro"
            class="text-h6 leading-[normal] whitespace-nowrap text-[rgba(255,0,4,0.65)]"
          >
            {{ erro }}
          </p>
        </label>

        <label
          v-if="modo === 'register'"
          class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2"
        >
          Confirmar Senha
          <input
            v-model="confirmarSenha"
            :type="mostrarSenha ? 'text' : 'password'"
            class="font-sans"
            :class="inputBase"
            placeholder="▣ Digite novamente sua senha"
            autocomplete="new-password"
            maxlength="20"
            minlength="8"
            required
          />
          <p
            v-if="erroSenha || erro"
            class="text-h6 leading-[normal] whitespace-nowrap text-[rgba(255,0,4,0.65)]"
          >
            {{ erroSenha || erro }}
          </p>
        </label>

        <!-- "Esqueci minha senha" só existe no Login (468:97); o Register não tem. -->
        <div v-if="modo === 'login'" class="flex w-full shrink-0 items-center justify-end">
          <AppLink href="#" size="h5" :arrow="false" @click.prevent>Esqueci minha senha</AppLink>
        </div>

        <!-- Botão principal + link alternativo -->
        <div class="flex w-full shrink-0 flex-col items-center gap-[5px]">
          <AppButton
            type="submit"
            variant="coral"
            :disabled="enviando"
            :width="modo === 'register' ? 225 : 250"
            :padding-left="40"
            :gap="15"
            :gap-hover="23"
          >
            {{
              enviando
                ? 'Enviando...'
                : modo === 'register'
                  ? 'Criar a minha conta'
                  : 'Entrar na minha conta'
            }}
          </AppButton>

          <div
            v-if="modo === 'login' || (!erro && !erroSenha)"
            class="flex items-center justify-center gap-[3px] text-h6 leading-[normal]"
          >
            <p class="whitespace-nowrap text-text-2">
              {{ modo === 'register' ? 'Já possui uma conta?' : 'Ainda não possui uma conta?' }}
            </p>
            <AppLink
              href="#"
              size="h6"
              :arrow="false"
              :variant="modo === 'register' ? 'blue' : 'coral'"
              @click.prevent="trocarModo(modo === 'register' ? 'login' : 'register')"
            >
              {{ modo === 'register' ? 'Entrar agora' : 'Criar Conta' }}
            </AppLink>
          </div>
        </div>
      </form>
    </div>
  </CanvasLayout>
</template>

<style scoped>
/*
 * Smart Animate do protótipo: "Mudar para" (Change to) + Animação inteligente,
 * Suavização Desaceleração (ease out), 300 ms.
 *
 * As camadas casadas (painel azul→verde, logo, orbitais do par esquerdo) ficam
 * no mesmo lugar e interpolam largura/cor/opacidade; os conteúdos (intro do
 * formulário × intro do sucesso, frase × botão) fazem cross-fade. Todas as
 * transições usam `ease-out` e 300ms, como no Figma.
 */
.auth-shell {
  --smart-animate: 300ms;
  --smart-ease: ease-out;

  /* Entrada da página: fade ao vir da LandpageV2 (roda uma vez no mount). */
  animation: auth-entrar 380ms cubic-bezier(0, 0, 0.58, 1) both;
}

@keyframes auth-entrar {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* O painel interpola largura (750 → 1920) e cor (azul → verde). */
.auth-shell > div:first-of-type {
  transition:
    width var(--smart-animate) var(--smart-ease),
    background-color var(--smart-animate) var(--smart-ease);
}

.auth-shell--saindo {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell {
    animation: none;
  }
  .auth-shell,
  .auth-shell * {
    transition-duration: 0.01ms !important;
  }
}
</style>
