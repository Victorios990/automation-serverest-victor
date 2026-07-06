import { mensagens, UsuarioFactory, ProdutoFactory } from '../../support/imports';

const apiUrl = () => Cypress.env('apiUrl');

/**
 * Cria um usuário administrador via API e retorna o id do usuário e o token de autorização.
 * Centralizado aqui pois é pré-requisito de vários cenários deste arquivo (produtos exigem
 * autenticação de administrador).
 */
function criarAdminAutenticado() {
  const admin = UsuarioFactory.gerarUsuario({ administrador: 'true' });

  return cy
    .request({ method: 'POST', url: `${apiUrl()}/usuarios`, body: admin })
    .then((cadastro) => {
      return cy
        .request({
          method: 'POST',
          url: `${apiUrl()}/login`,
          body: { email: admin.email, password: admin.password },
        })
        .then((login) => ({ userId: cadastro.body._id, token: login.body.authorization }));
    });
}

describe('API - Produtos e Carrinhos', () => {
  let usuarioParaLimpar;
  let produtoParaLimpar;

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

    if (usuarioParaLimpar) {
      cy.excluirUsuarioViaApi(usuarioParaLimpar);
      usuarioParaLimpar = null;
    }
  });

  it('CT01 - Não deve permitir criar um produto sem um token de autenticação', () => {
    const produto = ProdutoFactory.gerarProduto();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/produtos`,
      body: produto,
      failOnStatusCode: false,
    }).then((resposta) => {
      expect(resposta.status).to.eq(401);
      expect(resposta.body.message).to.eq(mensagens.erros.tokenInvalido);
    });
  });

  it('CT02 - Deve cadastrar um produto com sucesso autenticado como administrador', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto();

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/produtos`,
        body: produto,
        headers: { Authorization: token },
      }).then((resposta) => {
        expect(resposta.status).to.eq(201);
        expect(resposta.body.message).to.eq(mensagens.sucesso.cadastroRealizado);
        produtoParaLimpar = { id: resposta.body._id, token };

        cy.request(`${apiUrl()}/produtos/${resposta.body._id}`).then((consulta) => {
          expect(consulta.status).to.eq(200);
          expect(consulta.body).to.include({ nome: produto.nome, preco: produto.preco });
        });
      });
    });
  });

  it('CT03 - Deve criar um carrinho com sucesso e calcular o valor total corretamente', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto({ preco: 100, quantidade: 10 });

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/produtos`,
        body: produto,
        headers: { Authorization: token },
      }).then((cadastroProduto) => {
        const produtoId = cadastroProduto.body._id;
        produtoParaLimpar = { id: produtoId, token };

        cy.request({
          method: 'POST',
          url: `${apiUrl()}/carrinhos`,
          body: { produtos: [{ idProduto: produtoId, quantidade: 2 }] },
          headers: { Authorization: token },
        }).then((carrinho) => {
          expect(carrinho.status).to.eq(201);
          expect(carrinho.body.message).to.eq(mensagens.sucesso.cadastroRealizado);

          cy.request({
            method: 'GET',
            url: `${apiUrl()}/carrinhos/${carrinho.body._id}`,
          }).then((consulta) => {
            expect(consulta.body.precoTotal).to.eq(200);
            expect(consulta.body.quantidadeTotal).to.eq(2);
          });

          // Teardown do carrinho: precisa ser removido antes do produto e do usuário,
          // já que a API não permite excluir produto/usuário com carrinho em aberto.
          cy.request({
            method: 'DELETE',
            url: `${apiUrl()}/carrinhos/cancelar-compra`,
            headers: { Authorization: token },
          });
        });
      });
    });
  });
});
