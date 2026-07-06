import { mensagens, UsuarioFactory, LoginActions, HomeActions } from '../../support/imports';

describe('Login', () => {
  beforeEach(function () {
    cy.fixture('pages/loginPage').as('mapaLogin');
    cy.fixture('pages/homePage').as('mapaHome');
    cy.fixture('pages/adminHomePage').as('mapaAdminHome');
    cy.fixture('dados/credenciaisInvalidas').as('credenciaisInvalidas');
  });

  context('Autenticação', () => {
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
      const { email, password } = this.credenciaisInvalidas;
      LoginActions.login(this.mapaLogin, email, password);

      // Então a aplicação exibe um alerta de erro e permanece na tela de login
      cy.get(this.mapaLogin.alertaErro).should(
        'contain.text',
        mensagens.erros.emailSenhaInvalidos,
      );
      cy.url().should('include', '/login');
    });

    it('CT03 - Deve permitir fechar o alerta de erro de login inválido', function () {
      // Dado que uma tentativa de login inválida gerou um alerta de erro
      const { email, password } = this.credenciaisInvalidas;
      LoginActions.visitar();
      LoginActions.login(this.mapaLogin, email, password);
      cy.get(this.mapaLogin.alertaErro).should('be.visible');

      // Quando fecho o alerta manualmente
      cy.get(this.mapaLogin.botaoFecharAlerta).click();

      // Então o alerta deixa de ser exibido
      cy.get(this.mapaLogin.alertaErro).should('not.exist');
    });

    it('CT04 - Deve fazer logout e bloquear o acesso à home sem autenticação', function () {
      const usuario = UsuarioFactory.gerarUsuario();

      // Dado que estou autenticado na home
      cy.criarUsuarioViaApi(usuario).then((resposta) => {
        expect(resposta.status).to.eq(201);
        cy.registrarUsuarioParaLimpeza({ ...usuario, id: resposta.body._id });

        LoginActions.visitar();
        LoginActions.login(this.mapaLogin, usuario.email, usuario.password);
        cy.url().should('include', '/home');

        // Quando faço logout
        HomeActions.logout(this.mapaHome);

        // Então volto para a tela de login
        cy.url().should('include', '/login');
        cy.get(this.mapaLogin.botaoEntrar).should('be.visible');

        // E, ao tentar acessar a home diretamente, sou redirecionado de volta ao login
        // (a sessão foi realmente encerrada, não é só uma troca de tela)
        cy.visit('/home');
        cy.url().should('include', '/login');
      });
    });
  });

  // O ServeRest tem duas navegações pós-login completamente diferentes dependendo do
  // perfil da conta: um usuário comum vai para a loja (/home), um administrador vai para
  // um painel próprio (/admin/home). Descoberto explorando o app - vale a pena um contexto
  // dedicado para deixar essa diferença de comportamento explícita e testada dos dois lados.
  context('Navegação pós-login por perfil', () => {
    context('Usuário comum', () => {
      it('CT05 - Deve exibir a navegação da loja, sem itens de administrador', function () {
        const usuario = UsuarioFactory.gerarUsuario({ administrador: 'false' });

        cy.criarUsuarioViaApi(usuario).then((resposta) => {
          expect(resposta.status).to.eq(201);
          cy.registrarUsuarioParaLimpeza({ ...usuario, id: resposta.body._id });

          // Dado que faço login como um usuário comum
          LoginActions.visitar();
          LoginActions.login(this.mapaLogin, usuario.email, usuario.password);

          // Então sou redirecionado para a loja (/home, não /admin/home)...
          cy.url().should('include', '/home').and('not.include', '/admin');

          // ...e vejo a navegação de shopper (lista de compras e carrinho)...
          cy.get(this.mapaHome.navListaDeCompras).should('be.visible');
          cy.get(this.mapaHome.navCarrinho).should('be.visible');

          // ...e NÃO vejo nenhum item de navegação exclusivo de administrador
          cy.get(this.mapaAdminHome.navCadastrarUsuarios).should('not.exist');
          cy.get(this.mapaAdminHome.navListarUsuarios).should('not.exist');
          cy.get(this.mapaAdminHome.navCadastrarProdutos).should('not.exist');
          cy.get(this.mapaAdminHome.navListarProdutos).should('not.exist');
          cy.get(this.mapaAdminHome.navRelatorios).should('not.exist');
        });
      });
    });

    context('Administrador', () => {
      it('CT06 - Deve exibir a navegação do painel administrativo, sem itens de shopper', function () {
        const admin = UsuarioFactory.gerarUsuario({ administrador: 'true' });

        cy.criarUsuarioViaApi(admin).then((resposta) => {
          expect(resposta.status).to.eq(201);
          cy.registrarUsuarioParaLimpeza({ ...admin, id: resposta.body._id });

          // Dado que faço login como um usuário administrador
          LoginActions.visitar();
          LoginActions.login(this.mapaLogin, admin.email, admin.password);

          // Então sou redirecionado para o painel administrativo (/admin/home, não a loja)...
          cy.url().should('include', '/admin/home');

          // ...e vejo a navegação exclusiva de administrador...
          cy.get(this.mapaAdminHome.navCadastrarUsuarios).should('be.visible');
          cy.get(this.mapaAdminHome.navListarUsuarios).should('be.visible');
          cy.get(this.mapaAdminHome.navCadastrarProdutos).should('be.visible');
          cy.get(this.mapaAdminHome.navListarProdutos).should('be.visible');
          cy.get(this.mapaAdminHome.navRelatorios).should('be.visible');

          // ...e NÃO vejo os itens de navegação de shopper (lista de compras e carrinho)
          cy.get(this.mapaHome.navListaDeCompras).should('not.exist');
          cy.get(this.mapaHome.navCarrinho).should('not.exist');
        });
      });
    });
  });
});
