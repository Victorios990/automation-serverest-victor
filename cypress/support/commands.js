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

// Fila de usuários criados durante os testes de GUI, para limpeza automática.
// Cada spec apenas registra o usuário logo após criá-lo; o afterEach global
// (cypress/support/e2e.js) esvazia a fila ao final de cada teste.
let usuariosParaLimpar = [];

Cypress.Commands.add('registrarUsuarioParaLimpeza', (usuario) => {
  usuariosParaLimpar.push(usuario);
});

Cypress.Commands.add('limparUsuariosRegistrados', () => {
  const usuarios = usuariosParaLimpar;
  usuariosParaLimpar = [];

  usuarios.forEach(({ id, email, password }) => {
    if (id) {
      cy.excluirUsuarioViaApi(id);
      return;
    }

    if (!email || !password) return;

    cy.autenticarViaApi({ email, password }).then((login) => {
      if (login.status !== 200) return;

      cy.buscarUsuarioPorEmailViaApi(email).then((busca) => {
        const [usuario] = busca.body.usuarios;
        if (usuario?._id) cy.excluirUsuarioViaApi(usuario._id);
      });
    });
  });
});
