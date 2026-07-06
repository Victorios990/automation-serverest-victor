import { mensagens, UsuarioFactory, LoginActions } from '../../support/imports';

describe('Login', () => {
  beforeEach(function () {
    cy.fixture('pages/loginPage').as('mapaLogin');
    cy.fixture('pages/homePage').as('mapaHome');
  });

  it('CT01 - Deve realizar login com sucesso utilizando um usuário previamente cadastrado', function () {
    const usuario = UsuarioFactory.gerarUsuario();

    // Dado que existe um usuário previamente cadastrado (setup via API, independente da UI)
    cy.criarUsuarioViaApi(usuario).then((resposta) => {
      expect(resposta.status).to.eq(201);
      cy.registrarUsuarioParaLimpeza({ ...usuario, id: resposta.body._id });

      // Quando faço login pela interface com as credenciais desse usuário
      LoginActions.visitar();
      LoginActions.login(this.mapaLogin, usuario.email, usuario.password);

      // Então sou autenticado e redirecionado para a home
      cy.url().should('include', '/home');
      cy.get(this.mapaHome.botaoLogout).should('be.visible');
    });
  });

  it('CT02 - Não deve permitir login com credenciais inválidas', function () {
    // Dado que estou na tela de login
    LoginActions.visitar();

    // Quando informo credenciais de um usuário que não existe
    LoginActions.login(this.mapaLogin, 'usuario.inexistente.qa@teste.com', 'senhaErrada123');

    // Então a aplicação exibe um alerta de erro e permanece na tela de login
    cy.get(this.mapaLogin.alertaErro).should('contain.text', mensagens.erros.emailSenhaInvalidos);
    cy.url().should('include', '/login');
  });

  it('CT03 - Deve permitir fechar o alerta de erro de login inválido', function () {
    // Dado que uma tentativa de login inválida gerou um alerta de erro
    LoginActions.visitar();
    LoginActions.login(this.mapaLogin, 'outro.inexistente.qa@teste.com', 'senhaErrada123');
    cy.get(this.mapaLogin.alertaErro).should('be.visible');

    // Quando fecho o alerta manualmente
    cy.get(this.mapaLogin.botaoFecharAlerta).click();

    // Então o alerta deixa de ser exibido
    cy.get(this.mapaLogin.alertaErro).should('not.exist');
  });
});
