import { UsuarioFactory } from '../../support/imports';
import { LoginActions } from '../../support/actions/loginActions';
import { HomeActions } from '../../support/actions/homeActions';

const PRODUTO = 'Logitech MX Vertical';

describe('Lista de compras (carrinho)', () => {
  let usuarioParaLimpar;

  beforeEach(function () {
    cy.fixture('pages/loginPage').as('mapaLogin');
    cy.fixture('pages/homePage').as('mapaHome');
    cy.fixture('pages/minhaListaDeProdutosPage').as('mapaLista');

    // Setup via API: cria um usuário e autentica pela UI, isolando o cenário
    // da tela de cadastro (que já é coberta em seu próprio spec).
    const usuario = UsuarioFactory.gerarUsuario();

    cy.criarUsuarioViaApi(usuario).then((resposta) => {
      expect(resposta.status).to.eq(201);
      usuarioParaLimpar = { ...usuario, id: resposta.body._id };

      LoginActions.visitar();
      LoginActions.login(this.mapaLogin, usuario.email, usuario.password);
      cy.url().should('include', '/home');
    });
  });

  afterEach(function () {
    if (usuarioParaLimpar?.id) {
      cy.excluirUsuarioViaApi(usuarioParaLimpar.id);
    }
    usuarioParaLimpar = null;
  });

  it('CT01 - Deve adicionar um produto à lista de compras a partir da home', function () {
    // Dado que estou autenticado na home, com produtos disponíveis
    // Quando adiciono um produto à lista de compras
    HomeActions.adicionarProdutoALista(this.mapaHome, PRODUTO);

    // Então sou redirecionado para a lista de compras e o produto aparece com quantidade 1
    cy.url().should('include', '/minhaListaDeProdutos');
    cy.get(this.mapaLista.nomeProduto).should('contain.text', PRODUTO);
    cy.get(this.mapaLista.quantidadeProduto).should('contain.text', 'Total: 1');
  });

  it('CT02 - Deve permitir aumentar a quantidade do produto na lista de compras', function () {
    // Dado que adicionei um produto à lista de compras
    HomeActions.adicionarProdutoALista(this.mapaHome, PRODUTO);
    cy.get(this.mapaLista.quantidadeProduto).should('contain.text', 'Total: 1');

    // Quando incremento a quantidade pelo botão "+"
    cy.get(this.mapaLista.botaoAumentarQuantidade).click();

    // Então a quantidade total exibida é atualizada para 2
    cy.get(this.mapaLista.quantidadeProduto).should('contain.text', 'Total: 2');
  });
});
