# automation-serverest-victor

Suíte de automação de testes construída com [Cypress](https://www.cypress.io/) para a aplicação pública [ServeRest](https://serverest.dev).

Requisito do desafio: 3 cenários E2E (GUI) + 3 cenários de API. Entregue: 4 specs de GUI e 3 specs de
API, totalizando 32 casos de teste, cobrindo fluxos de sucesso, exceção, validação de campos e a
diferença de navegação entre perfil comum e administrador. A suíte de API cobre **100% das rotas
documentadas no Swagger oficial** (`serverest.dev/swagger.json`).

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
npm run cy:run       # headless, toda a suíte (GUI + API)
npm run cy:run:gui   # apenas os testes de interface
npm run cy:run:api   # apenas os testes de API
npm run lint         # checagem de estilo

# Relatório Allure (após rodar a suíte, gera allure-results/):
npm run allure:generate  # gera o HTML em allure-report/
npm run allure:open      # abre o relatório no navegador
```

> A suíte roda contra os ambientes públicos (`front.serverest.dev` e `serverest.dev`), não é necessário subir nada localmente.

> **Compatibilidade de versão do Node:** use Node **18 ou 20 (LTS)**. Em Node 24 o `npm install`
> pode falhar ao instalar o binário do Cypress com um erro `Cannot find module './util'` em uma
> dependência transitiva (`bluebird`), independente da pasta/localização usada — é incompatibilidade
> de versão, não corrupção de arquivos. Se estiver usando `nvm`: `nvm install 20 && nvm use 20`.

## Arquitetura

```
cypress/
├── e2e/
│   ├── GUI/        # cenários E2E de interface
│   └── API/        # cenários de API
├── fixtures/
│   ├── pages/      # mapa de seletores por tela (data-testid do ServeRest, inclui
│   │                 adminHomePage.json para o painel administrativo)
│   └── dados/      # massa de dados estática (ex.: credenciais inválidas)
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
- `support/factories/` gera dados únicos por execução (e-mail/nome com timestamp e sufixo aleatório), evitando testes frágeis por colisão de dados no ambiente público e compartilhado do ServeRest. Isso inclui os produtos usados na busca (`busca-produtos.cy.js`), que passaram a ser criados pelo próprio teste em vez de depender de um nome fixo no catálogo compartilhado.
- Testes de GUI fazem sua própria limpeza de massa de dados (via API, no `afterEach`) para não acumular usuários/produtos de teste no ambiente.
- Testes de API usam `cy.request` diretamente, sem depender da camada de UI.

## Suíte de testes

### E2E - GUI (`cypress/e2e/GUI`)

| Spec                     | Casos                                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cadastro-usuario.cy.js` | CT01 sucesso (redireciona para a home) · CT02 e-mail já utilizado · CT03 campos obrigatórios (formulário vazio) · CT04 cadastro comum (checkbox de administrador desmarcado, redireciona para `/home`) · CT05 cadastro administrador (checkbox marcado, redireciona para `/admin/home`) |
| `login.cy.js`            | **Autenticação:** CT01 sucesso · CT02 credenciais inválidas (alerta) · CT03 fechar o alerta · CT04 logout (encerra sessão e bloqueia a home). **Navegação pós-login por perfil:** CT05 usuário comum vê a navegação da loja (lista de compras, carrinho) e nenhum item de admin · CT06 administrador vê a navegação do painel (cadastrar/listar usuários e produtos, relatórios) e nenhum item de shopper |
| `lista-de-compras.cy.js` | CT01 adicionar produto à lista · CT02 incrementar quantidade                                                                                                                                                             |
| `busca-produtos.cy.js`   | CT01 buscar produto pelo nome (produto cadastrado via API por um admin; a navegação e a busca são feitas por um usuário comum, já que administradores caem no painel `/admin/home`, sem busca) e validar que a lista filtrada só contém itens correspondentes |

### API (`cypress/e2e/API`)

| Spec                       | Casos                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usuarios.cy.js`           | CT01 cadastro (201 + persistência via GET) · CT02 e-mail duplicado (400) · CT03 exclusão (200) · CT04 campos obrigatórios (400) · CT05 listagem filtrada por e-mail (`GET /usuarios`) · CT06 edição de usuário (`PUT /usuarios/{_id}`)                                                                                                                 |
| `login.cy.js`              | CT01 autenticação com sucesso (token Bearer) · CT02 credenciais inválidas (401)                                                                                                                                                                                                                                                                          |
| `produtos-carrinhos.cy.js` | CT01 sem token (401) · CT02 cadastro como admin (201) · CT03 criação de carrinho e cálculo do total · CT04 usuário não-admin com token válido (403) · CT05 listagem de produtos filtrada por nome (`GET /produtos`) · CT06 edição de produto (`PUT /produtos/{_id}`) · CT07 exclusão de produto (`DELETE /produtos/{_id}`) · CT08 listagem de carrinhos por usuário (`GET /carrinhos`) · CT09 cancelamento de compra com devolução de estoque (`DELETE /carrinhos/cancelar-compra`) · CT10 conclusão de compra sem devolução de estoque (`DELETE /carrinhos/concluir-compra`) |

Todos os cenários criam sua própria massa de dados (via `@faker-js/faker`) e fazem a limpeza (teardown) via API ao final, para não deixar resíduo no ambiente público compartilhado do ServeRest.

> **Nenhum spec depende de outro.** Os nomes dos arquivos não seguem numeração de ordem
> de execução de propósito: cada teste cria e limpa sua própria massa de dados, podendo
> rodar sozinho, fora de ordem ou em paralelo. Se quiser só uma ordem sugerida de leitura
> (não de execução), sugerimos: `login` → `cadastro-usuario` → `lista-de-compras` (GUI) e
> `usuarios` → `login` → `produtos-carrinhos` (API).

### Cobertura das rotas do Swagger

| Rota                                | Método(s)         | Coberta em                                          |
| ------------------------------------ | ----------------- | ---------------------------------------------------- |
| `/login`                             | POST              | `API/login.cy.js` CT01, CT02                          |
| `/usuarios`                          | GET, POST         | `API/usuarios.cy.js` CT01, CT05                       |
| `/usuarios/{_id}`                    | GET, PUT, DELETE  | `API/usuarios.cy.js` CT01, CT03, CT06                 |
| `/produtos`                          | GET, POST         | `API/produtos-carrinhos.cy.js` CT02, CT05             |
| `/produtos/{_id}`                    | GET, PUT, DELETE  | `API/produtos-carrinhos.cy.js` CT02, CT06, CT07       |
| `/carrinhos`                         | GET, POST         | `API/produtos-carrinhos.cy.js` CT03, CT08             |
| `/carrinhos/{_id}`                   | GET               | `API/produtos-carrinhos.cy.js` CT03                   |
| `/carrinhos/cancelar-compra`         | DELETE            | `API/produtos-carrinhos.cy.js` CT09 (e teardown geral) |
| `/carrinhos/concluir-compra`         | DELETE            | `API/produtos-carrinhos.cy.js` CT10                   |

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
  de compras (o que de fato está implementado) e não a tela de carrinho em si.
- **Senha retornada em texto plano pela API**: `GET /usuarios/{_id}` inclui o campo `password` em
  texto plano na resposta. Baixo risco no contexto de treino (dado fictício, ambiente público de
  prática), mas é uma boa prática de segurança a corrigir num cenário real.
- **Sem limite de tamanho/sanitização de campos**: `POST /usuarios` aceita um `nome` de 500
  caracteres sem truncar, e um payload `<script>...</script>` é armazenado sem sanitização. O
  campo também não tem `maxLength` no front. Como o front atual é React (escapa a renderização por
  padrão), não há XSS explorável na interface hoje, mas vale como hardening da API.
- **Tentativa de injeção no login**: o payload `' OR '1'='1'` em e-mail/senha é bloqueado pela
  validação de formato de e-mail (400), antes de chegar à lógica de autenticação. Nenhuma
  vulnerabilidade de injeção encontrada.
- **Alerta de validação não se limpa automaticamente**: ao submeter o cadastro vazio e depois
  preencher os campos sem reenviar, os alertas "Nome/Password é obrigatório" continuam visíveis
  até serem fechados manualmente ou até o reenvio do formulário.
- **Responsividade**: a tela de login foi verificada em viewport mobile (375×667px) e o layout se
  adapta corretamente, sem overflow ou elementos cortados.
- **Busca de produtos dependia de dado externo (corrigido)**: a versão original de
  `busca-produtos.cy.js` buscava por um nome fixo ("Logitech") no catálogo público e compartilhado,
  causando falha intermitente quando esse produto não existia mais. Corrigido para o teste criar
  seu próprio produto via API antes de buscar por ele.
- **Administrador tem uma navegação completamente separada (achado real, corrigido)**: ao logar,
  contas com `administrador: true` são redirecionadas para `/admin/home` (painel próprio, com
  Cadastrar/Listar Usuários, Cadastrar/Listar Produtos e Relatórios), e não para `/home` (a loja,
  com busca e carrinho) - o painel de admin não tem busca de produtos. Isso derrubou dois testes
  que assumiam o contrário: `busca-produtos.cy.js` (o produto agora é criado por um admin via API,
  mas a navegação/busca é feita por um usuário comum) e a asserção de `cadastro-usuario.cy.js` CT05
  (que checava `include('/home')`, um falso positivo, já que `/admin/home` também contém essa
  substring - corrigido para `include('/admin/home')`). Também gerou dois cenários novos e
  dedicados em `login.cy.js` (CT05/CT06) comparando a navegação dos dois perfis lado a lado.
- **Contrato da API**: em todos os endpoints exercitados os status codes e mensagens de resposta
  bateram exatamente com o Swagger oficial (`serverest.dev`). Nenhuma divergência encontrada.
- **Fora do escopo verificado**: não foi feito teste exaustivo de segurança (fuzzing, payloads
  malformados em profundidade), valores-limite de preço/quantidade, nem testes de carga — no caso
  de carga, a própria documentação do ServeRest proíbe rodar contra o ambiente público.

## Possíveis melhorias (fora do escopo deste desafio)

- Paginação de usuários e produtos (o próprio backlog do front do ServeRest já sinaliza isso como pendente).
- Validação de contrato via JSON Schema (ex.: `ajv`) para checar a resposta completa da API, não só campos pontuais.
- Testes de acessibilidade (a11y) e cross-browser/mobile (BrowserStack), incluindo cobertura de responsividade mais ampla (tablet, telas de carrinho e lista de produtos).
- Teste de carga com JMeter — só faria sentido rodando localmente (`npx serverest`/Docker), nunca contra `serverest.dev`.
- Cenário de resiliência do front a falha de backend via `cy.intercept` (mock de erro 500) — avaliado e descartado por decisão consciente de manter todos os cenários como testes reais de ponta a ponta.
- Limite de tamanho de campo (`maxlength`) no formulário de cadastro, validado tanto no front quanto na API.
- Sanitização/encoding de entrada no backend como defesa em profundidade contra XSS.
- Nunca retornar o campo `password` nas respostas da API, mesmo em ambiente de treino.
- Limpeza automática dos alertas de validação de campo obrigatório ao preencher o campo correspondente.
- Implementação da tela de carrinho (`/carrinho`), hoje "em construção", com os cenários de E2E correspondentes assim que disponível.
