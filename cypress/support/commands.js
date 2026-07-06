// Comandos customizados usados como apoio de API para setup/teardown de massa de dados
// nos testes de GUI (ex.: criar usuário sem depender da tela de cadastro) e nos próprios
// testes de API.
const apiUrl = () => Cypress.env('apiUrl');

Cypress.Commands.add('criarUsuarioViaApi', (usuario) => {
  return cy.request({
    method: 'POST',
    url: `${apiUrl()}/usuarios`,
    body: usuario,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('autenticarViaApi', ({ email, password }) => {
  return cy.request({
    method: 'POST',
    url: `${apiUrl()}/login`,
    body: { email, password },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('buscarUsuarioPorEmailViaApi', (email) => {
  return cy.request({
    method: 'GET',
    url: `${apiUrl()}/usuarios?email=${email}`,
  });
});

Cypress.Commands.add('excluirUsuarioViaApi', (id) => {
  if (!id) return;
  return cy.request({
    method: 'DELETE',
    url: `${apiUrl()}/usuarios/${id}`,
    failOnStatusCode: false,
  });
});
