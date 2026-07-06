// Ações reaproveitáveis da tela de Login.
// Recebe o mapa de seletores (carregado via fixture) e expõe as interações
// como funções nomeadas, evitando duplicar a lógica de "clicar/preencher" em cada spec.
export const LoginActions = {
  visitar() {
    cy.visit('/login');
  },

  login(mapa, email, password) {
    cy.get(mapa.emailInput).clear();
    cy.get(mapa.emailInput).type(email);
    cy.get(mapa.senhaInput).clear();
    cy.get(mapa.senhaInput).type(password);
    cy.get(mapa.botaoEntrar).click();
  },
};
