Guia de Instalação e Fluxo de Trabalho
Instalação do projeto

Após clonar o repositório, instale todos os pacotes necessários:

git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>
npm install

Executando o projeto

Para iniciar o ambiente de desenvolvimento web:

npm run dev


O projeto ficará disponível no endereço informado pelo terminal.

Finalização do projeto

Atenção: o comando npm run build deve ser utilizado somente quando o desenvolvimento estiver finalizado, para realizar a build de produção e verificar se o projeto está pronto para ser publicado.

npm run build

Fluxo de trabalho com Git

Para evitar conflitos de versionamento, não trabalhe diretamente na branch main.

Antes de começar uma nova tarefa, atualize seu repositório:

git checkout main
git pull origin main


Depois, crie uma branch específica para sua tarefa:

git checkout -b feature/nome-da-feature


Exemplos:

git checkout -b feature/tela-login
git checkout -b feature/cadastro-usuario
git checkout -b fix/correcao-login

Salvando alterações

Verifique os arquivos modificados:

git status


Adicione as alterações:

git add .


Crie um commit com uma mensagem clara:

git commit -m "feat: adiciona tela de login"


Envie sua branch para o repositório remoto:

git push origin feature/nome-da-feature

Atualizando sua branch

Antes de continuar o trabalho, é recomendado atualizar a branch com as alterações mais recentes da main:

git checkout main
git pull origin main
git checkout feature/nome-da-feature
git merge main


Caso ocorram conflitos, resolva os arquivos indicados pelo Git e depois:

git add .
git commit -m "chore: resolve conflitos com main"

Pull Request

Após finalizar a tarefa:

Faça o push da sua branch.
Abra um Pull Request (PR) para a branch main.
Aguarde a revisão do código.
Após a aprovação, faça o merge conforme o fluxo definido pela equipe.
Fluxo resumido
main
  │
  ├── git pull
  │
  └── feature/minha-tarefa
          │
          ├── desenvolvimento
          ├── git add .
          ├── git commit
          └── git push
                  │
                  ▼
             Pull Request
                  │
                  ▼
                main


Importante: evite fazer commits diretamente na main. Cada tarefa deve ser desenvolvida em sua própria branch para reduzir conflitos e facilitar a revisão do código.
