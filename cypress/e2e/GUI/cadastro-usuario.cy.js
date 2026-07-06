import { mensagens, UsuarioFactory, CadastroActions } from '../../support/imports';

describe('Cadastro de Usuário', () => {
  beforeEach(function () {
    cy.fixture('pages/cadastroPage').as('mapaCadastro');
    cy.fixture('pages/homePage').as('mapaHome');
  });

  it('CT01 - Deve cadastrar um novo usuário com sucesso e redirecionar para a home', function () {
    const usuario = UsuarioFactory.gerarUsuario();
    cy.registrarUsuarioParaLimpeza(usuario);

    // Dado que estou na tela de cadastro de usuários
    CadastroActions.visitar();

    // Quando preencho o formulário com dados válidos e submeto
    CadastroActions.cadastrar(this.mapaCadastro, usuario);

    // Então sou redirecionado para a home autenticada como o novo usuário
    cy.url().should('include', '/home');
    cy.get(this.mapaHome.botaoLogout).should('be.visible');
    cy.get(this.mapaHome.contadorCarrinho).should('exist');
  });

  it('CT02 - Não deve permitir o cadastro com um e-mail já utilizado', function () {
    const usuario = UsuarioFactory.gerarUsuario();
    cy.registrarUsuarioParaLimpeza(usuario);

    // Dado que já existe um usuário cadastrado com um determinado e-mail
    CadastroActions.visitar();
    CadastroActions.cadastrar(this.mapaCadastro, usuario);
    cy.url().should('include', '/home');
    cy.get(this.mapaHome.botaoLogout).click();

    // Quando tento cadastrar novamente utilizando o mesmo e-mail
    CadastroActions.visitar();
    CadastroActions.cadastrar(this.mapaCadastro, usuario);

    // Então a aplicação exibe um alerta de e-mail já utilizado e permanece no cadastro
    cy.get(this.mapaCadastro.alertaErro).should('contain.text', mensagens.erros.emailJaUtilizado);
    cy.url().should('include', '/cadastrarusuarios');
  });
});
