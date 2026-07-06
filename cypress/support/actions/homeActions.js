// Ações reaproveitáveis da Home autenticada e da lista de compras (carrinho).
export const HomeActions = {
  visitar() {
    cy.visit('/home');
  },

  logout(mapa) {
    cy.get(mapa.botaoLogout).click();
  },

  adicionarProdutoALista(mapaHome, nomeProduto) {
    cy.contains(mapaHome.cardProduto, nomeProduto).within(() => {
      cy.get(mapaHome.botaoAdicionarNaLista).click();
    });
  },
};
