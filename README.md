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

---

## 🚀 Iniciando o Projeto

Copie `.env.example` para `.env.local` e ajuste as URLs conforme o ambiente:

```env
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://localhost:3000
```

`VITE_API_BASE_URL` é pública e incluída no bundle; informe somente a URL base da API. O valor padrão usa o proxy local do Vite. `API_PROXY_TARGET` configura apenas o destino desse proxy e não é exposta ao navegador. Tokens privados, credenciais do MongoDB e chaves administrativas devem permanecer no back-end.

Para iniciar o ambiente de desenvolvimento web, utilize:

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

```bash
git add .
git commit -m "chore: resolve conflitos com main"
```

### 🔗 Pull Request

Após finalizar sua tarefa:

1. Faça o push da sua branch
2. Abra um Pull Request (PR) para a branch `main`
3. Aguarde a revisão do código
4. Após a aprovação, faça o merge conforme o fluxo definido pela equipe

### 📊 Fluxo Recomendado

```
main
│
├── git pull
│
└── feature/minha-tarefa
    ├── Desenvolver
    ├── git add .
    ├── git commit
    └── git push
           │
           ▼
       Pull Request
           │
           ▼
         main
```

---

## 📁 Estrutura do Projeto

### Dependências Principais

- **Vue 3** (^3.5.40) - Framework progressivo para interfaces de usuário
- **Vue Router** (^5.2.0) - Roteamento para aplicações Vue
- **TypeScript** (~6.0.2) - Tipagem estática para JavaScript
- **Vite** (^8.2.0) - Servidor de desenvolvimento rápido
- **Tailwind CSS** (^4.3.3) - Framework CSS utilitário
- **Sass** (^1.103.1) - Pré-processador CSS
- **FontAwesome** (^7.3.1) - Biblioteca de ícones

### Estrutura de Pastas

```
src/
├── assets/          # Imagens e recursos estáticos
├── components/      # Componentes Vue reutilizáveis
├── App.vue         # Componente raiz
├── main.ts         # Ponto de entrada
├── style.css       # Estilos globais
├── style.scss      # Estilos Sass
└── tailwind.css    # Importação do Tailwind CSS
```

## 💬 Integração do chat

O front-end reutiliza o access token e o fluxo de refresh já existentes. HTTP envia `Authorization: Bearer <accessToken>`; Socket.IO usa o namespace padrão e `auth: { token }` (o token nunca é enviado em query string). A URL HTTP é definida por `VITE_API_BASE_URL` (padrão `/api`); em desenvolvimento, `API_PROXY_TARGET` encaminha HTTP e `/socket.io` ao backend.

Endpoints autenticados utilizados:

- `GET /chat/users?search=<prefixo>&page=1&limit=24` — descobre usuários; a resposta inclui `users` com `id`, `name` e `image`, além de `page`, `limit` e `hasMore`. A busca é pelo prefixo do nome (o modelo não possui `username`), exclui o usuário atual e suporta paginação.
- `GET /chat/conversations` — lista conversas, membros, última mensagem e contagem de não lidas.
- `POST /chat/conversations/direct` com `{ "participantId": "<userId>" }` — cria ou recupera a conversa individual idempotente.
- `POST /chat/conversations/groups` com `{ "name": "...", "memberIds": ["<userId>"] }` — cria um grupo; o backend inclui o criador e aceita até 49 outros participantes.
- `GET /chat/conversations/:id` — carrega detalhes e membros; `GET /chat/conversations/:id/messages?limit=50&before=<sequence>` carrega histórico ordenado por `sequence`. `nextCursor` é exclusivo e deve ser enviado como `before` para carregar mensagens anteriores.
- `POST /chat/conversations/:id/read`, `POST /chat/conversations/:id/members`, `DELETE /chat/conversations/:id/members/:memberId` e `POST /chat/conversations/:id/leave` — leitura e administração de grupos, conforme as permissões verificadas pelo servidor.

As mensagens são enviadas por `chat:message:send` com `conversationId`, UUID v4 `clientMessageId` e `content`. A interface mantém o mesmo UUID ao tentar novamente após falha/timeout e reconcilia a mensagem otimista pelo UUID tanto no acknowledgement `ok: true` quanto no evento `chat:message:new`. O status de leitura usa `chat:message:read` e o cursor do servidor; envio não é tratado como entrega ou leitura.

O cliente participa das salas autorizadas com `chat:conversation:join` e acompanha `chat:message:new`, `chat:conversation:update`, `chat:unread:update`, `chat:message:read`, `chat:conversation:available`, `chat:conversation:members` e `chat:conversation:removed`. Ao reconectar, atualiza a lista e recarrega o histórico aberto via HTTP. A descoberta retorna somente dados públicos (`id`, `name`, `image`); a autenticação e as permissões permanecem sob responsabilidade do backend. Antes de validar persistência real, confirme com o time do backend que as migrações necessárias já foram aplicadas ao ambiente; o front-end não acessa MongoDB.

Erros HTTP preservam o status e o formato NestJS (`statusCode`, `message`, `error`). Respostas `401` seguem o refresh/login já existente; respostas `403` ou `404` para a conversa aberta removem essa conversa da lista local e limpam seu histórico, oferecendo uma atualização da lista. O socket é encerrado e seus listeners são removidos quando a sessão autenticada muda ou a tela é desmontada.

“Remover conversa” no menu de contexto apenas oculta a conversa de Recentes neste navegador e para o usuário atual; não chama uma rota de exclusão, não remove amizades e não apaga o histórico no servidor. Conversas individuais podem ser restauradas ao iniciar a conversa pela aba Pessoas.

---

## 🤝 Contribuindo

Ao contribuir para este projeto, siga as guidelines acima e mantenha a qualidade do código. Certifique-se de:

- Criar branches descritivas
- Fazer commits com mensagens claras
- Solicitar revisão de código através de Pull Requests
- Resolver conflitos antes de fazer merge
- Evitar fazer commits diretamente na `main`

> **Importante:** Cada tarefa deve ser desenvolvida em sua própria branch para reduzir conflitos e facilitar a revisão do código.

---

## 📄 Licença

Projeto desenvolvido pelos estudantes de Engenharia da Computação da PUC-Campinas.
