# Conecta — Frontend

Interface web do **Conecta**, uma iniciativa dos estudantes de Engenharia da Computação da PUC-Campinas. A plataforma centraliza a integração entre universitários: grupos de estudo, mentorias com veteranos, agenda, publicações e conversas em um só lugar.

Este repositório contém apenas o frontend. A API é servida pelo [Conecta-backend](../Conecta-backend).

## 🎨 Protótipo no Figma

[Acessar o protótipo do Conecta](https://www.figma.com/proto/j1htYumH1zO0BRIc78refj/Conecta?node-id=310-2&t=E3oaqARwVfQCzYsY-1&scaling=contain&content-scaling=responsive&page-id=0%3A1&starting-point-node-id=310%3A2)

> A visualização pode exigir login em uma conta Figma.

## 🧰 Stack

| Tecnologia   | Versão  | Uso                                                            |
| ------------ | ------- | -------------------------------------------------------------- |
| Vue 3        | ^3.5.40 | Composition API com `<script setup lang="ts">`                 |
| Vue Router   | ^5.2.0  | Rotas em history mode e guarda de autenticação                 |
| TypeScript   | ~6.0.2  | Tipagem estática                                               |
| Vite         | ^8.2.0  | Dev server e build                                             |
| Tailwind CSS | ^4.3.3  | Estilos utilitários via `@tailwindcss/vite` (config CSS-first) |
| Font Awesome | ^7.3.1  | Ícones, expostos globalmente como `<font-awesome-icon>`        |
| Prettier     | ^3.9.6  | Formatação (sem ponto e vírgula, aspas simples, 100 colunas)   |

Não há Sass/SCSS: os estilos globais e os tokens ficam em `src/app/styles/tailwind.css`.

## ✅ Requisitos

- **Node.js 22 LTS** (ou superior) e npm.
- **Conecta-backend** rodando em `http://localhost:3000` para login, cadastro e dados do dashboard.

O frontend não usa variáveis de ambiente. A base da API é sempre `/api` e o Vite faz proxy para o backend em desenvolvimento (veja abaixo).

## 📋 Instalação

```bash
git clone <URL_DO_REPOSITORIO>
cd Conecta-frontend
npm install
```

Execute `npm install` novamente sempre que as dependências mudarem.

## 🚀 Rodando em desenvolvimento

```bash
npm run dev
```

O Vite sobe em `http://localhost:5173` (porta padrão) com HMR. O proxy de desenvolvimento está em `vite.config.ts`:

```
/api/*  →  http://localhost:3000/*   (o prefixo /api é removido)
```

Ou seja, `fetch('/api/auth/login')` chega ao backend como `POST /auth/login`.

> **Importante:** login, cadastro, renovação de sessão e logout usam cookies (`credentials: 'include'`) e enviam o header `X-CSRF-Protection: 1`, exigido pelo backend. O backend precisa estar no ar e aceitar a origem do Vite.

## 🔨 Scripts

| Comando                | O que faz                                                       |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento com HMR                             |
| `npm run build`        | Checagem de tipos (`vue-tsc -b`) + build de produção em `dist/` |
| `npm run preview`      | Serve o build de produção localmente                            |
| `npm run format`       | Formata todo o projeto com Prettier                             |
| `npm run format:check` | Verifica a formatação sem alterar arquivos                      |

## 🗺️ Rotas

### Públicas

| Rota                | Tela                                                         |
| ------------------- | ------------------------------------------------------------ |
| `/` e `/landpage`   | Landing page                                                 |
| `/catalog`          | Catálogo                                                     |
| `/login`            | Login e criação de conta (abas)                              |
| `/conta-criada`     | Login no estado de sucesso da criação de conta               |
| `/forgot-password`  | Solicitação de recuperação de senha                          |
| `/reset-password`   | Redefinição de senha (token recebido via query `?token=...`) |
| `/senha-redefinida` | Estado de sucesso da redefinição                             |

### Autenticadas

| Rota                     | Tela                      |
| ------------------------ | ------------------------- |
| `/dashboard`             | Visão geral               |
| `/dashboard/chat`        | Conversas (header oculto) |
| `/dashboard/communities` | Comunidades               |
| `/dashboard/agenda`      | Agenda                    |
| `/dashboard/posts`       | Publicações               |

Rotas desconhecidas caem em `/landpage`. A guarda em `src/router/index.ts`:

- usuário autenticado em `/login` vai para `/dashboard`;
- rotas do dashboard exigem sessão; sem sessão, redireciona para `/login`;
- as rotas de recuperação de senha (`/forgot-password` e `/reset-password`) são sempre acessíveis.

## 🔌 Integração com a API

Os serviços ficam em `src/features/*/services` e usam caminhos relativos (`/api/...`), então funcionam tanto no dev (proxy) quanto em produção atrás do mesmo domínio.

- **`features/auth/services/auth.ts`** — login, cadastro, recuperação/redefinição de senha, perfil (`GET /auth/profile`, `PUT|PATCH /auth/edit`) e `fetchProtected`, que injeta o Bearer token, tenta renovar via `POST /auth/refresh` em caso de 401 e redireciona para `/login` quando a sessão não pode ser recuperada.
- **`features/dashboard/services/posts.ts`** — `/api/posts`.
- **`features/dashboard/services/agenda.ts`** — `/api/agenda` (inclui participação e cancelamento).

### Sessão

`src/shared/services/session.ts` é a única fonte de leitura/escrita da sessão:

- usuário em `localStorage` (`conecta_session`);
- access token em `localStorage` (`conecta_access_token`), com fallback para os cookies `accessToken`, `token` e `jwt`;
- `currentUser` é um objeto reativo; `isAuthenticated()` exige usuário **e** token;
- `clearSession()` limpa o storage e os cookies legados.

Não há biblioteca de estado global (Pinia/Vuex): a sessão é um módulo reativo compartilhado.

## 📁 Estrutura do projeto

```
public/                 Logo e robots.txt
src/
├── app/                App.vue, main.ts e styles/tailwind.css
├── assets/             decorações, ícones, imagens e logos
├── features/
│   ├── auth/           pages, components, services e successTexts
│   ├── catalog/
│   ├── dashboard/      components, pages e services
│   ├── landpage/
│   └── profile/        modal de configuração de perfil
├── layouts/            DashboardLayout
├── router/             rotas e guarda de autenticação
└── shared/
    ├── composables/    useBodyScrollLock
    ├── services/       session
    ├── types/          auth
    └── ui/             componentes reutilizáveis (AppButton, AppLogo, ...)
```

Cada `feature` mantém suas páginas, componentes e serviços próximos. Componentes usados por mais de uma feature vivem em `shared/ui`.

## 🎨 Design system

- **Tailwind CSS 4 (CSS-first):** os tokens do Figma ficam no bloco `@theme` de `src/app/styles/tailwind.css` e a base global em `@layer base`.
- **Cores:** `co-coral`, `co-blue`, `co-white`, `tree-green`, `s-coral`, `s-blue`, `tree-bg`, `s-green`, `traceline`, `text-1`, `text-2`.
- **Tipografia:** tokens `h1`–`h6`, `title` (32px) e `arrow` (seta "←" em DM Sans), com família `Roboto` para texto e `Space Grotesk` para display.
- **Componentes-base:** `AppButton`, `AppLink`, `AppLogo`, `AppIcon`, `AppAuthTabs`, entre outros em `shared/ui`.
- **Telas de autenticação:** painel de apresentação com largura `clamp(480px, 45vw, 750px)` e formulário à direita a partir de `lg`; intro e órbitas escalam com o painel e a tela não tem rolagem horizontal.
- **Breakpoints:** os padrões do Tailwind — `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Na Landpage, o menu recolhido dá lugar à navegação desktop em `xl`.

## ♿ Acessibilidade e SEO

- `lang="pt-BR"` e meta description em `index.html`; `public/robots.txt` libera o rastreamento.
- Um `<h1>` por tela de formulário e intro do painel em `<h2>`.
- Campos com `aria-invalid` e `aria-describedby` apontando para a mensagem; erros com `role="alert"` e sucessos com `role="status"`.
- Botão de envio com `aria-busy` e botão de mostrar/ocultar senha com `aria-label`.
- O contraste da paleta ainda não foi ajustado — é o único item pendente no Lighthouse de acessibilidade.

## 🌳 Git e contribuição

Não trabalhe diretamente na `main`. Cada tarefa em uma branch própria:

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-feature
```

Prefixos usados: `feature/` para funcionalidades, `fix/` para correções e `chore/` para manutenção.

Antes de abrir o PR:

```bash
npm run build
git status
git add .
git commit -m "feat: descreve a mudança"
git push origin feature/nome-da-feature
```

Depois, abra um Pull Request para a `main` e aguarde a revisão. Se a `main` avançar, atualize sua branch:

```bash
git checkout main
git pull origin main
git checkout feature/nome-da-feature
git merge main
```

Boas práticas:

- commits pequenos e com mensagens claras (preferencialmente Conventional Commits);
- rode `npm run build` antes de enviar;
- resolva conflitos localmente antes do merge;
- nunca faça commit direto na `main`.

## 📄 Licença

Projeto desenvolvido pelos estudantes de Engenharia da Computação da PUC-Campinas.
