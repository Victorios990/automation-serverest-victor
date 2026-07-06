// Ações reaproveitáveis da tela de Cadastro de Usuários.
export const CadastroActions = {
  visitar() {
    cy.visit('/cadastrarusuarios');
  },

  preencherFormulario(mapa, { nome, email, password, administrador }) {
    cy.get(mapa.nomeInput).clear();
    cy.get(mapa.nomeInput).type(nome);
    cy.get(mapa.emailInput).clear();
    cy.get(mapa.emailInput).type(email);
    cy.get(mapa.passwordInput).clear();
    cy.get(mapa.passwordInput).type(password);

    if (administrador === 'true') {
      cy.get(mapa.administradorCheckbox).check();
    }
  },

  cadastrar(mapa, usuario) {
    this.preencherFormulario(mapa, usuario);
    cy.get(mapa.botaoCadastrar).click();
  },
};
