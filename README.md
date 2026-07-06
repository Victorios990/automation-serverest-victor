# automation-serverest-victor

Suíte de automação de testes construída com [Cypress](https://www.cypress.io/) para a aplicação pública [ServeRest](https://serverest.dev), cobrindo:

- **3 cenários E2E (GUI)** contra `front.serverest.dev`
- **3 cenários de API** contra `serverest.dev`

Projeto desenvolvido como desafio técnico de QA.

## Stack

- [Cypress](https://www.cypress.io/) (JavaScript)
- [@faker-js/faker](https://fakerjs.dev/) para massa de dados dinâmica
- ESLint (`eslint-plugin-cypress`) + Prettier para padronização de código
- GitHub Actions para execução da suíte em CI

## Como rodar

```bash
npm install
npx cypress open   # modo interativo
npm run cy:run      # headless, toda a suíte
npm run cy:run:gui   # apenas os testes de interface
npm run cy:run:api   # apenas os testes de API
npm run lint         # checagem de estilo
```

> A suíte roda contra os ambientes públicos (`front.serverest.dev` e `serverest.dev`), não é necessário subir nada localmente.

## Arquitetura

```
cypress/
├── e2e/
│   ├── GUI/        # cenários E2E de interface
│   └── API/        # cenários de API
├── fixtures/
│   └── pages/      # mapa de seletores por tela (data-testid do ServeRest)
├── support/
│   ├── actions/    # ações reaproveitáveis por tela (login, cadastro, home)
│   ├── factories/  # geração de massa de dados (Faker)
│   ├── mensagens.js  # textos/mensagens esperadas, centralizados
│   ├── imports.js    # barrel de imports usados pelos specs
│   ├── commands.js   # comandos customizados (setup/teardown via API)
│   └── e2e.js
└── ...
```

**Decisões de arquitetura:**

- Seletores ficam isolados em `fixtures/pages/*.json`, nunca hardcoded nos specs — qualquer mudança de layout se resolve em um único lugar. Sempre que disponível, usamos os atributos `data-testid` expostos pelo próprio ServeRest (mais estáveis que classes/ids de CSS).
- `support/actions/` encapsula as interações de cada tela (preencher formulário, submeter, logout etc.) como funções nomeadas, para não duplicar sequências de `cy.get().type()...` em cada spec.
- `support/factories/` gera dados únicos por execução (e-mail com timestamp), evitando testes frágeis por colisão de dados no ambiente público e compartilhado do ServeRest.
- Testes de GUI fazem sua própria limpeza de massa de dados (via API, no `afterEach`) para não acumular usuários de teste no ambiente.
- Testes de API usam `cy.request` diretamente, sem depender da camada de UI.

## Suíte de testes

_Será detalhada conforme as etapas forem implementadas._

## CI

_Será adicionado no fechamento do projeto (GitHub Actions)._
