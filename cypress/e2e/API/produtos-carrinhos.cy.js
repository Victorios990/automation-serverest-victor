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

/**
 * Mesma ideia de criarAdminAutenticado, mas para um usuário comum (administrador: 'false'),
 * usado para validar que rotas administrativas continuam bloqueadas mesmo com um token válido.
 */
function criarUsuarioComumAutenticado() {
  const usuario = UsuarioFactory.gerarUsuario({ administrador: 'false' });

  return cy
    .request({ method: 'POST', url: `${apiUrl()}/usuarios`, body: usuario })
    .then((cadastro) => {
      return cy
        .request({
          method: 'POST',
          url: `${apiUrl()}/login`,
          body: { email: usuario.email, password: usuario.password },
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

  it('CT04 - Não deve permitir que um usuário não administrador cadastre produtos', () => {
    criarUsuarioComumAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto();

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/produtos`,
        body: produto,
        headers: { Authorization: token },
        failOnStatusCode: false,
      }).then((resposta) => {
        // Diferente do CT01 (sem token / 401), aqui o token é válido, mas o usuário
        // não é administrador - a API responde 403, não 401.
        expect(resposta.status).to.eq(403);
        expect(resposta.body.message).to.eq(mensagens.erros.rotaParaAdministradores);
      });
    });
  });

  it('CT05 - Deve listar produtos filtrando por nome', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto();

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/produtos`,
        body: produto,
        headers: { Authorization: token },
      }).then((cadastro) => {
        produtoParaLimpar = { id: cadastro.body._id, token };

        cy.request('GET', `${apiUrl()}/produtos?nome=${encodeURIComponent(produto.nome)}`).then(
          (busca) => {
            expect(busca.status).to.eq(200);
            expect(busca.body.quantidade).to.eq(1);
            expect(busca.body.produtos[0]).to.include({ nome: produto.nome });
          },
        );
      });
    });
  });

  it('CT06 - Deve alterar um produto com sucesso, autenticado como administrador', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto();

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/produtos`,
        body: produto,
        headers: { Authorization: token },
      }).then((cadastro) => {
        const produtoId = cadastro.body._id;
        produtoParaLimpar = { id: produtoId, token };
        const dadosAtualizados = ProdutoFactory.gerarProduto();

        cy.request({
          method: 'PUT',
          url: `${apiUrl()}/produtos/${produtoId}`,
          body: dadosAtualizados,
          headers: { Authorization: token },
        }).then((edicao) => {
          expect(edicao.status).to.eq(200);
          expect(edicao.body.message).to.eq(mensagens.sucesso.registroAlterado);

          cy.request(`${apiUrl()}/produtos/${produtoId}`).then((consulta) => {
            expect(consulta.body.nome).to.eq(dadosAtualizados.nome);
          });
        });
      });
    });
  });

  it('CT07 - Deve excluir um produto com sucesso, autenticado como administrador', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto();

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/produtos`,
        body: produto,
        headers: { Authorization: token },
      }).then((cadastro) => {
        const produtoId = cadastro.body._id;

        cy.request({
          method: 'DELETE',
          url: `${apiUrl()}/produtos/${produtoId}`,
          headers: { Authorization: token },
        }).then((exclusao) => {
          expect(exclusao.status).to.eq(200);
          expect(exclusao.body.message).to.eq(mensagens.sucesso.registroExcluido);

          cy.request({
            method: 'GET',
            url: `${apiUrl()}/produtos/${produtoId}`,
            failOnStatusCode: false,
          }).then((consulta) => {
            expect(consulta.status).to.eq(400);
          });
        });
      });
    });
  });

  it('CT08 - Deve listar os carrinhos cadastrados filtrando pelo usuário', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto({ preco: 50, quantidade: 5 });

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
          body: { produtos: [{ idProduto: produtoId, quantidade: 1 }] },
          headers: { Authorization: token },
        }).then(() => {
          cy.request(`${apiUrl()}/carrinhos?idUsuario=${userId}`).then((lista) => {
            expect(lista.status).to.eq(200);
            expect(lista.body.quantidade).to.eq(1);
            expect(lista.body.carrinhos[0]).to.include({ idUsuario: userId });
          });

          // Teardown do carrinho antes do produto/usuário (mesma ordem exigida pela API)
          cy.request({
            method: 'DELETE',
            url: `${apiUrl()}/carrinhos/cancelar-compra`,
            headers: { Authorization: token },
          });
        });
      });
    });
  });

  it('CT09 - Deve cancelar a compra, excluir o carrinho e devolver o produto ao estoque', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto({ preco: 20, quantidade: 5 });

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
        }).then(() => {
          cy.request({
            method: 'DELETE',
            url: `${apiUrl()}/carrinhos/cancelar-compra`,
            headers: { Authorization: token },
          }).then((cancelamento) => {
            expect(cancelamento.status).to.eq(200);
            expect(cancelamento.body.message).to.eq(mensagens.sucesso.registroExcluido);

            // Estoque deve voltar ao valor original (5), já que a compra foi cancelada
            cy.request(`${apiUrl()}/produtos/${produtoId}`).then((consulta) => {
              expect(consulta.body.quantidade).to.eq(5);
            });
          });
        });
      });
    });
  });

  it('CT10 - Deve concluir a compra e excluir o carrinho', () => {
    criarAdminAutenticado().then(({ userId, token }) => {
      usuarioParaLimpar = userId;
      const produto = ProdutoFactory.gerarProduto({ preco: 40, quantidade: 4 });

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
          body: { produtos: [{ idProduto: produtoId, quantidade: 1 }] },
          headers: { Authorization: token },
        }).then(() => {
          cy.request({
            method: 'DELETE',
            url: `${apiUrl()}/carrinhos/concluir-compra`,
            headers: { Authorization: token },
          }).then((finalizacao) => {
            expect(finalizacao.status).to.eq(200);
            expect(finalizacao.body.message).to.eq(mensagens.sucesso.registroExcluido);

            // Diferente do cancelamento, a conclusão da compra NÃO devolve o estoque
            cy.request(`${apiUrl()}/produtos/${produtoId}`).then((consulta) => {
              expect(consulta.body.quantidade).to.eq(3);
            });
          });
        });
      });
    });
  });
});
