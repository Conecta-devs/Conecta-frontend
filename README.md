# Conecta

## Descrição

Conecta é uma iniciativa dos estudantes da PUC-Campinas do curso de Engenharia da Computação. O projeto se trata numa plataforma estudantil que facilita a integração e colaboração entre alunos universitários a grupos de estudo, mentorias com veteranos e entre outras funcionalidades de forma centralizada.

## Tecnologias

- **CSS** - 55.4%
- **Vue** - 31.7%
- **TypeScript** - 8.8%
- **HTML** - 3.9%
- **SCSS** - 0.2%

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
