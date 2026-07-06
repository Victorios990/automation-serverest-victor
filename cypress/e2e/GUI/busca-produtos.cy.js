import { UsuarioFactory, LoginActions } from '../../support/imports';

const TERMO_BUSCA = 'Logitech';

describe('Busca de produtos', () => {
  beforeEach(function () {
    cy.fixture('pages/loginPage').as('mapaLogin');
    cy.fixture('pages/homePage').as('mapaHome');

    const usuario = UsuarioFactory.gerarUsuario();

    cy.criarUsuarioViaApi(usuario).then((resposta) => {
      expect(resposta.status).to.eq(201);
      cy.registrarUsuarioParaLimpeza({ ...usuario, id: resposta.body._id });

      LoginActions.visitar();
      LoginActions.login(this.mapaLogin, usuario.email, usuario.password);
      cy.url().should('include', '/home');
    });
  });

  it('CT01 - Deve filtrar a lista de produtos ao pesquisar pelo nome', function () {
    // Dado que estou na home com o catálogo completo de produtos
    // Quando pesquiso por um termo específico
    cy.get(this.mapaHome.campoPesquisa).clear();
    cy.get(this.mapaHome.campoPesquisa).type(TERMO_BUSCA);
    cy.get(this.mapaHome.botaoPesquisar).click();

    // Então todos os produtos exibidos contêm o termo pesquisado no nome
    cy.get(this.mapaHome.tituloProduto).should('have.length.greaterThan', 0);
    cy.get(this.mapaHome.tituloProduto).each(($produto) => {
      expect($produto.text()).to.include(TERMO_BUSCA);
    });
  });
});
