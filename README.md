# TechX Todo List — Frontend

Aplicação web responsiva para cadastro, autenticação e gerenciamento de tarefas. O frontend foi desenvolvido com Angular, integra-se ao backend NestJS por HTTP com cookies e oferece renderização SSR com hidratação.

## Sumário

- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Configuração da API](#configuração-da-api)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Autenticação e navegação](#autenticação-e-navegação)
- [SSR](#renderização-ssr)
- [Testes](#testes)
- [Solução de problemas](#solução-de-problemas)

## Visão geral

A interface permite:

- cadastrar e autenticar usuários;
- consultar a sessão autenticada;
- listar, criar, editar, concluir, reabrir e excluir tarefas;
- filtrar tarefas por status e pesquisar por texto;
- acompanhar contagens e o percentual de conclusão;
- confirmar exclusões e apresentar estados de carregamento e erro.

Os dados de título, descrição e conclusão são persistidos pelo backend. Área, prioridade e prazo são atualmente campos da interface do dashboard; o contrato real da API não contém esses campos e eles não são enviados nas operações HTTP.

## Demonstração visual

Adicione aqui screenshots reais do projeto, sem links externos ou imagens inexistentes:

```text
docs/screenshots/login.png
 docs/screenshots/dashboard.png
docs/screenshots/register.png
```

> As imagens ainda não estão presentes neste diretório. Capture a aplicação em execução e adicione arquivos PNG ou WebP em uma pasta `docs/screenshots/` antes de incluir os links nesta seção.

## Tecnologias

| Tecnologia | Uso confirmado |
|---|---|
| Angular 21.2 | Aplicação standalone, roteamento, formulários reativos, Signals e componentes lazy-loaded |
| Angular SSR | Renderização do servidor por `@angular/ssr` e hidratação com replay de eventos |
| TypeScript 5.9 | Tipagem dos componentes, serviços, DTOs locais e modelos |
| RxJS 7.8 | Observables das chamadas HTTP |
| Angular HttpClient | Comunicação REST com o backend |
| ngx-sonner 3.1 | Toasts de sucesso nas autenticações |
| Tailwind CSS 4 | Ferramentas disponíveis no projeto; os estilos da aplicação estão principalmente em CSS |
| Express 5 | Servidor responsável pelo bundle SSR |
| Vitest 4 | Execução dos testes configurada pelo Angular Build |

## Pré-requisitos

- Node.js compatível com Angular 21 e o pacote Angular CLI instalado pelo projeto.
- npm; o projeto registra `npm@11.6.2` como `packageManager`.
- Backend disponível em `http://localhost:3000` para os fluxos autenticados.
- Navegador moderno com suporte às funcionalidades utilizadas pela aplicação.

Não há arquivo `.nvmrc` ou `engines` confirmado no frontend. O projeto foi validado localmente com Node.js 24.11.1; versões anteriores podem ser compatíveis, mas não estão declaradas pelo projeto.

## Instalação e execução

```bash
cd frontend-tech-x
npm install
npm start
```

A aplicação será iniciada pelo Angular CLI em `http://localhost:4200/` por padrão.

O backend também precisa estar em execução:

```bash
cd backend-tech-x
npm install
npm run dev
```

Configure primeiro o PostgreSQL, o arquivo `.env` e o CORS do backend.

## Configuração da API

A URL base está centralizada em `src/app/core/api.config.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:3000';
```

Não existe um mecanismo de variáveis de ambiente Angular configurado neste projeto. Para conectar o frontend a outro host, altere essa constante e, se necessário, ajuste `CORS_ORIGINS` no backend.

Todas as requisições usam `withCredentials: true`. Isso permite que o navegador envie o cookie HTTP-only criado pelo backend:

```typescript
provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor]))
```

O frontend não lê nem armazena o JWT. A sessão é consultada por `GET /auth/me` e os guards aguardam essa consulta antes de decidir o acesso às rotas.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor de desenvolvimento Angular em `http://localhost:4200/` |
| `npm run build` | Gera os bundles de browser e SSR em `dist/tech-x/` |
| `npm run watch` | Executa o build em modo de desenvolvimento e observação |
| `npm test -- --watch=false` | Executa os testes Vitest configurados pelo Angular Build uma vez |
| `npm run serve:ssr:tech-x` | Executa o servidor SSR produzido pelo build |

Não há script de lint configurado no `package.json`.

## Estrutura do projeto

```text
src/
├── app/
│   ├── core/                 # Configuração HTTP e guards de autenticação
│   ├── domain/
│   │   ├── auth/             # Serviço, tipos e constantes relacionados à sessão
│   │   └── tasks/            # Modelos e serviço de comunicação com tarefas
│   ├── pages/                # Login, cadastro e dashboard
│   ├── app.config.ts         # Providers do Angular e HttpClient
│   ├── app.routes.ts         # Rotas da aplicação
│   └── app.routes.server.ts  # Estratégia de renderização por rota
├── main.ts                   # Bootstrap da aplicação no navegador
├── main.server.ts            # Bootstrap da aplicação SSR
└── server.ts                 # Servidor Express para o bundle SSR
```

## Funcionalidades confirmadas

### Autenticação

- validação reativa de cadastro e login;
- cadastro com nome, e-mail, senha e confirmação no frontend;
- login com tratamento de credenciais inválidas;
- estado centralizado de usuário e inicialização da sessão;
- logout que limpa o estado local e retorna à tela de login;
- proteção de dashboard e páginas públicas para usuários já autenticados.

### Tarefas

- carregamento da lista após abrir o dashboard;
- criação e edição de título e descrição;
- alternância entre concluída e pendente;
- exclusão com confirmação;
- filtros, busca, contagens e percentual de conclusão;
- bloqueios de operação duplicada durante mutações.

### Notificações

Login e cadastro exibem toasts somente após resposta de sucesso da API. Em caso de erro, permanece a mensagem inline no formulário, sem toast de sucesso duplicado.

## Autenticação e navegação

A sessão é validada por `GET /auth/me` no serviço `AuthService`.

- `authGuard` protege o dashboard e envia o usuário não autenticado para `/login`, preservando `returnUrl`.
- `guestGuard` impede acesso às páginas de login e cadastro por usuários já autenticados.
- após login ou cadastro, o frontend navega para a rota solicitada ou para `/`.
- cookies devem ser aceitos pelo navegador; `http://localhost` e `localhost` precisam respeitar a origem configurada no CORS do backend.

## Renderização SSR

Todas as rotas estão configuradas com `RenderMode.Client`. As telas autenticadas não são pré-renderizadas porque dependem da sessão do usuário.

Cuidados preservados na implementação:

- o estado de autenticação não é presumido no servidor;
- `window`, `document` e `localStorage` não são usados pela integração atual;
- o toaster é renderizado somente quando executado no navegador;
- não há cache público configurado para respostas personalizadas.

## Testes

```bash
npm test -- --watch=false
npm run build
```

O teste atual verifica a criação do shell da aplicação. A infraestrutura ainda não possui cobertura automatizada dedicada para todos os fluxos HTTP, guards ou formulários.

## Solução de problemas

### A API não responde

Confirme que o backend está executando em `http://localhost:3000` e que a porta corresponde à constante de `src/app/core/api.config.ts`.

### Erro de CORS ou cookie não enviado

No backend, `CORS_ORIGINS` deve incluir `http://localhost:4200`. O backend precisa estar configurado com `credentials: true`; a implementação já mantém essa configuração e o frontend usa `withCredentials`.

### Redirecionamento constante para login

Confirme que `/auth/me` está acessível e que o cookie `access_token` está sendo enviado pelo navegador. Não basta consultar o estado local; o cookie e o backend precisam validar a sessão.

### Dependências do frontend não instalam

Use uma versão moderna de Node.js compatível e npm 11 quando possível. As versões exatas não são declaradas pelo frontend, por isso conflitos devem ser investigados antes de alterar dependências.
