import { UsuarioFactory, ProdutoFactory, LoginActions } from '../../support/imports';

const apiUrl = () => Cypress.env('apiUrl');

describe('Busca de produtos', () => {
  let produtoParaLimpar;
  let termoBusca;

  beforeEach(function () {
    cy.fixture('pages/loginPage').as('mapaLogin');
    cy.fixture('pages/homePage').as('mapaHome');

    const admin = UsuarioFactory.gerarUsuario({ administrador: 'true' });

    cy.criarUsuarioViaApi(admin).then((cadastro) => {
      expect(cadastro.status).to.eq(201);
      cy.registrarUsuarioParaLimpeza({ ...admin, id: cadastro.body._id });

      cy.autenticarViaApi({ email: admin.email, password: admin.password }).then((login) => {
        // Cria o próprio produto a ser buscado, em vez de depender de um nome fixo
        // ("Logitech") no catálogo público e compartilhado do ServeRest, que pode
        // não existir mais dependendo de quem mexeu no ambiente por último.
        const produto = ProdutoFactory.gerarProduto();
        termoBusca = produto.nome;

        cy.request({
          method: 'POST',
          url: `${apiUrl()}/produtos`,
          body: produto,
          headers: { Authorization: login.body.authorization },
        }).then((cadastroProduto) => {
          produtoParaLimpar = { id: cadastroProduto.body._id, token: login.body.authorization };

          LoginActions.visitar();
          LoginActions.login(this.mapaLogin, admin.email, admin.password);
          cy.url().should('include', '/home');
        });
      });
    });
  });

  afterEach(() => {
    if (produtoParaLimpar) {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl()}/produtos/${produtoParaLimpar.id}`,
        headers: { Authorization: produtoParaLimpar.token },
        failOnStatusCode: false,
      });
      produtoParaLimpar = null;
    }
  });

  it('CT01 - Deve filtrar a lista de produtos ao pesquisar pelo nome', function () {
    // Dado que existe um produto próprio, criado via API só para este cenário
    // Quando pesquiso pelo nome desse produto
    cy.get(this.mapaHome.campoPesquisa).clear();
    cy.get(this.mapaHome.campoPesquisa).type(termoBusca);
    cy.get(this.mapaHome.botaoPesquisar).click();

    // Então todos os produtos exibidos contêm o termo pesquisado no nome
    cy.get(this.mapaHome.tituloProduto).should('have.length.greaterThan', 0);
    cy.get(this.mapaHome.tituloProduto).each(($produto) => {
      expect($produto.text()).to.include(termoBusca);
    });
  });
});
