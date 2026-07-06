import { mensagens, UsuarioFactory } from '../../support/imports';

const apiUrl = () => Cypress.env('apiUrl');

describe('API - Usuários', () => {
  let idParaLimpar;

  afterEach(() => {
    if (idParaLimpar) {
      cy.excluirUsuarioViaApi(idParaLimpar);
      idParaLimpar = null;
    }
  });

  it('CT01 - Deve cadastrar um usuário com sucesso e persistir os dados corretamente', () => {
    const usuario = UsuarioFactory.gerarUsuario();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: usuario,
    }).then((resposta) => {
      expect(resposta.status).to.eq(201);
      expect(resposta.body.message).to.eq(mensagens.sucesso.cadastroRealizado);
      expect(resposta.body).to.have.property('_id');

      idParaLimpar = resposta.body._id;

      // Confirma que os dados foram realmente persistidos
      cy.request('GET', `${apiUrl()}/usuarios/${resposta.body._id}`).then((consulta) => {
        expect(consulta.status).to.eq(200);
        expect(consulta.body).to.include({
          nome: usuario.nome,
          email: usuario.email,
          password: usuario.password,
          administrador: usuario.administrador,
        });
      });
    });
  });

  it('CT02 - Não deve permitir o cadastro de um usuário com e-mail já utilizado', () => {
    const usuario = UsuarioFactory.gerarUsuario();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: usuario,
    }).then((primeiroCadastro) => {
      expect(primeiroCadastro.status).to.eq(201);
      idParaLimpar = primeiroCadastro.body._id;

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/usuarios`,
        body: usuario,
        failOnStatusCode: false,
      }).then((segundoCadastro) => {
        expect(segundoCadastro.status).to.eq(400);
        expect(segundoCadastro.body.message).to.eq(mensagens.erros.emailJaUtilizado);
      });
    });
  });

  it('CT03 - Deve excluir um usuário com sucesso', () => {
    const usuario = UsuarioFactory.gerarUsuario();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: usuario,
    }).then((cadastro) => {
      const { _id } = cadastro.body;

      cy.request('DELETE', `${apiUrl()}/usuarios/${_id}`).then((exclusao) => {
        expect(exclusao.status).to.eq(200);
        expect(exclusao.body.message).to.eq(mensagens.sucesso.registroExcluido);
      });

      // Confirma que o usuário não existe mais
      cy.request({
        method: 'GET',
        url: `${apiUrl()}/usuarios/${_id}`,
        failOnStatusCode: false,
      }).then((consulta) => {
        expect(consulta.status).to.eq(400);
        expect(consulta.body.message).to.eq('Usuário não encontrado');
      });
    });
  });

  it('CT04 - Deve validar os campos obrigatórios ao cadastrar com o corpo vazio', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: {},
      failOnStatusCode: false,
    }).then((resposta) => {
      expect(resposta.status).to.eq(400);
      expect(resposta.body).to.include({
        nome: mensagens.validacaoApi.nomeObrigatorio,
        email: mensagens.validacaoApi.emailObrigatorio,
        password: mensagens.validacaoApi.passwordObrigatorio,
        administrador: mensagens.validacaoApi.administradorObrigatorio,
      });
    });
  });

  it('CT05 - Deve listar usuários filtrando por email', () => {
    const usuario = UsuarioFactory.gerarUsuario();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: usuario,
    }).then((cadastro) => {
      idParaLimpar = cadastro.body._id;

      cy.request('GET', `${apiUrl()}/usuarios?email=${usuario.email}`).then((busca) => {
        expect(busca.status).to.eq(200);
        expect(busca.body.quantidade).to.eq(1);
        expect(busca.body.usuarios[0]).to.include({ nome: usuario.nome, email: usuario.email });
      });
    });
  });

  it('CT06 - Deve alterar os dados de um usuário com sucesso', () => {
    const usuario = UsuarioFactory.gerarUsuario();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: usuario,
    }).then((cadastro) => {
      idParaLimpar = cadastro.body._id;
      const dadosAtualizados = UsuarioFactory.gerarUsuario();

      cy.request({
        method: 'PUT',
        url: `${apiUrl()}/usuarios/${cadastro.body._id}`,
        body: dadosAtualizados,
      }).then((edicao) => {
        expect(edicao.status).to.eq(200);
        expect(edicao.body.message).to.eq(mensagens.sucesso.registroAlterado);

        cy.request('GET', `${apiUrl()}/usuarios/${cadastro.body._id}`).then((consulta) => {
          expect(consulta.body).to.include({
            nome: dadosAtualizados.nome,
            email: dadosAtualizados.email,
          });
        });
      });
    });
  });
});
