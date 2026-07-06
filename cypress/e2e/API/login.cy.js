import { mensagens, UsuarioFactory } from '../../support/imports';

const apiUrl = () => Cypress.env('apiUrl');

describe('API - Login', () => {
  let idParaLimpar;

  afterEach(() => {
    if (idParaLimpar) {
      cy.excluirUsuarioViaApi(idParaLimpar);
      idParaLimpar = null;
    }
  });

  it('CT01 - Deve autenticar com sucesso e retornar um token de autorizacao valido', () => {
    const usuario = UsuarioFactory.gerarUsuario();

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/usuarios`,
      body: usuario,
    }).then((cadastro) => {
      idParaLimpar = cadastro.body._id;

      cy.request({
        method: 'POST',
        url: `${apiUrl()}/login`,
        body: { email: usuario.email, password: usuario.password },
      }).then((login) => {
        expect(login.status).to.eq(200);
        expect(login.body.message).to.eq(mensagens.sucesso.loginRealizado);
        expect(login.body.authorization).to.match(/^Bearer\s.+/);
      });
    });
  });

  it('CT02 - Nao deve autenticar com e-mail e/ou senha invalidos', function () {
    cy.fixture('dados/credenciaisInvalidas').then((credenciais) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl()}/login`,
        body: credenciais,
        failOnStatusCode: false,
      }).then((login) => {
        expect(login.status).to.eq(401);
        expect(login.body.message).to.eq(mensagens.erros.emailSenhaInvalidos);
      });
    });
  });
});
