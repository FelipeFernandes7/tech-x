# TechX — Tarefas

Aplicação responsiva para organizar tarefas do time TechX, construída com Angular 21, componentes standalone, Signals e renderização no servidor com hidratação.

## Funcionalidades

- Criar e editar tarefas com validação, área, prioridade e prazo.
- Marcar tarefas como concluídas ou pendentes e confirmar antes de excluí-las.
- Filtrar por status, buscar por texto e acompanhar o progresso.
- Persistir tarefas neste dispositivo, com estados de carregamento, erro e lista vazia.

## Desenvolvimento

```bash
npm start
```

Abra `http://localhost:4200/` no navegador.

## Build e testes

```bash
npm run build
npm test
```

O build de produção inclui o bundle do servidor SSR. Para executá-lo após o build, use `npm run serve:ssr:tech-x`.
