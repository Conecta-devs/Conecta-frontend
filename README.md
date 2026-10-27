# Conecta

## Descrição

Conecta é uma iniciativa dos estudantes da PUC-Campinas do curso de Engenharia da Computação. O projeto se trata numa plataforma estudantil que facilita a integração e colaboração entre alunos universitários a grupos de estudo, mentorias com veteranos e entre outras funcionalidades de forma centralizada.

## 🎨 Protótipo no Figma

[Acessar o protótipo do Conecta](https://www.figma.com/proto/j1htYumH1zO0BRIc78refj/Conecta?node-id=310-2&t=E3oaqARwVfQCzYsY-1&scaling=contain&content-scaling=responsive&page-id=0%3A1&starting-point-node-id=310%3A2)

> A visualização pode exigir login em uma conta Figma.

## Tecnologias

- **CSS** - 1%
- **Vue** - 91.7%
- **TypeScript** - 7.3%
- **HTML** - 1%
- **SCSS** - 1%

---

## 📋 Instalação

Após clonar o repositório, instale todos os pacotes necessários:

```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>
npm install
```

> O `npm install` deve ser executado sempre que o projeto for clonado pela primeira vez ou quando houver alterações nas dependências.

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

O projeto ficará disponível no endereço informado pelo terminal.

---

## 🔨 Build do Projeto

O comando `npm run build` deve ser utilizado somente quando o desenvolvimento estiver finalizado.

Ele serve para gerar a versão de produção e verificar se o projeto está pronto para ser finalizado/publicado.

```bash
npm run build
```

---

## 🌳 Git e Branches

Para evitar conflitos de código e problemas de versionamento, **não trabalhe diretamente na branch `main`**.

Cada nova tarefa deve ser desenvolvida em uma branch própria.

### ✅ Antes de Começar uma Tarefa

Primeiro, atualize a branch `main`:

```bash
git checkout main
git pull origin main
```

Depois, crie uma nova branch:

```bash
git checkout -b feature/nome-da-feature
```

#### Exemplos

```bash
git checkout -b feature/tela-login
git checkout -b feature/cadastro-usuario
git checkout -b feature/dashboard
```

Para correções de bugs:

```bash
git checkout -b fix/correcao-login
```

### 💾 Salvando Alterações

Verifique quais arquivos foram modificados:

```bash
git status
```

Adicione os arquivos:

```bash
git add .
```

Faça o commit com uma mensagem clara:

```bash
git commit -m "feat: adiciona tela de login"
```

Envie a branch para o Git:

```bash
git push origin feature/nome-da-feature
```

### 🔄 Atualizando a Branch

Antes de continuar trabalhando, é importante verificar se existem alterações novas na `main`.

```bash
git checkout main
git pull origin main
```

Depois, volte para sua branch:

```bash
git checkout feature/nome-da-feature
```

Atualize sua branch com as alterações da `main`:

```bash
git merge main
```

Se houver conflitos, resolva os arquivos indicados pelo Git e depois execute:

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
