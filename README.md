# automation-serverest-victor

Suíte de automação de testes construída com [Cypress](https://www.cypress.io/) para a aplicação pública [ServeRest](https://serverest.dev).

Requisito do desafio: 3 cenários E2E (GUI) + 3 cenários de API. Entregue: 4 specs de GUI e 3 specs de
API, totalizando 20 casos de teste (os 6 pedidos + cenários extras de validação, controle de acesso,
busca e logout), cobrindo fluxos de sucesso, exceção e validação de campos.

Projeto desenvolvido como desafio técnico de QA.

## Stack

- [Cypress](https://www.cypress.io/) (JavaScript)
- [@faker-js/faker](https://fakerjs.dev/) para massa de dados dinâmica
- [Allure Report](https://allurereport.org/docs/cypress/) para relatório de execução
- ESLint (`eslint-plugin-cypress`) + Prettier para padronização de código
- GitHub Actions para execução da suíte em CI

## Como rodar

```bash
npm install
npx cypress open     # modo interativo
npm run cy:run       # headless, toda a suíte
npm run cy:run:gui   # apenas os testes de interface
npm run cy:run:api   # apenas os testes de API
npm run lint         # checagem de estilo

# Relatório Allure (após rodar a suíte, gera allure-results/):
npm run allure:generate  # gera o HTML em allure-report/
npm run allure:open      # abre o relatório no navegador
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

### E2E - GUI (`cypress/e2e/GUI`)

| Spec                     | Casos                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `cadastro-usuario.cy.js` | CT01 sucesso (redireciona para a home) · CT02 e-mail já utilizado · CT03 campos obrigatórios (formulário vazio)            |
| `login.cy.js`            | CT01 sucesso · CT02 credenciais inválidas (alerta) · CT03 fechar o alerta · CT04 logout (encerra sessão e bloqueia a home) |
| `lista-de-compras.cy.js` | CT01 adicionar produto à lista · CT02 incrementar quantidade                                                               |
| `busca-produtos.cy.js`   | CT01 buscar produto pelo nome e validar que a lista filtrada só contém itens correspondentes                               |

### API (`cypress/e2e/API`)

| Spec                       | Casos                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usuarios.cy.js`           | CT01 cadastro (201 + persistência via GET) · CT02 e-mail duplicado (400) · CT03 exclusão (200) · CT04 campos obrigatórios (400)                     |
| `login.cy.js`              | CT01 autenticação com sucesso (token Bearer) · CT02 credenciais inválidas (401)                                                                     |
| `produtos-carrinhos.cy.js` | CT01 sem token (401) · CT02 cadastro como admin (201) · CT03 criação de carrinho e cálculo do total · CT04 usuário não-admin com token válido (403) |

Todos os cenários criam sua própria massa de dados (via `@faker-js/faker`) e fazem a limpeza (teardown) via API ao final, para não deixar resíduo no ambiente público compartilhado do ServeRest.

> **Nenhum spec depende de outro.** Os nomes dos arquivos não seguem numeração de ordem
> de execução de propósito: cada teste cria e limpa sua própria massa de dados, podendo
> rodar sozinho, fora de ordem ou em paralelo. Se quiser só uma ordem sugerida de leitura
> (não de execução), sugerimos: `login` → `cadastro-usuario` → `lista-de-compras` (GUI) e
> `usuarios` → `login` → `produtos-carrinhos` (API).

## CI

O workflow `.github/workflows/cypress.yml` roda no GitHub Actions a cada push/PR na branch `main`:

- **lint**: ESLint + verificação de formatação (Prettier)
- **e2e-gui**: suíte de testes de interface
- **api**: suíte de testes de API
- **allure-report**: junta os resultados dos dois jobs acima e publica o relatório HTML do Allure como artefato do workflow

Screenshots de falhas e o relatório Allure ficam disponíveis para download na aba _Actions_ do GitHub, no run correspondente.

## Defeitos e observações encontradas durante a exploração

- **Tela de carrinho (`/carrinho`) incompleta**: a página exibe apenas "Em construção aguarde" para
  o cliente autenticado, mesmo com a API de carrinho (`POST/GET/DELETE /carrinhos`) e a lista de
  compras (`/minhaListaDeProdutos`) funcionando normalmente. Isso está alinhado com o próprio
  checklist de progresso do time no repositório do front (`ServeRest/front`), que marca "Listar
  carrinho" e "Finalizar o carrinho" como pendentes. Por isso os cenários de GUI cobrem até a lista
  de compras (o que de fato está implementado) e não a tela de carrinho em si — testar uma tela
  "em construção" não agregaria valor.
- **Contrato da API**: em todos os endpoints exercitados (usuários, login, produtos, carrinhos), os
  status codes e mensagens de resposta bateram exatamente com o Swagger oficial (`serverest.dev`).
  Nenhuma divergência encontrada.
- **Fora do escopo verificado**: não foi feito teste exaustivo de segurança (XSS, SQL/NoSQL
  injection, payloads malformados), valores-limite de preço/quantidade, nem testes de carga — não
  fazem parte do escopo pedido (3 E2E + 3 API com Cypress) e, no caso de carga, a própria
  documentação do ServeRest proíbe rodar contra o ambiente público.

## Possíveis melhorias (fora do escopo deste desafio)

- Paginação de usuários e produtos (o próprio backlog do front do ServeRest já sinaliza isso como pendente).
- Validação de contrato via JSON Schema (ex.: `ajv`) para checar a resposta completa da API, não só campos pontuais.
- Testes de acessibilidade (a11y) e cross-browser/mobile (BrowserStack).
- Teste de carga com JMeter — só faria sentido rodando localmente (`npx serverest`/Docker), nunca contra `serverest.dev`.
- Cenário de resiliência do front a falha de backend via `cy.intercept` (mock de erro 500) — avaliado e descartado por decisão consciente de manter todos os cenários como testes reais de ponta a ponta.
