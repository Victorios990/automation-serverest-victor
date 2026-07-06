// Arquivo de suporte carregado automaticamente antes de cada spec.
import './commands';

// Evita que exceções não tratadas da aplicação (fora do nosso controle) derrubem a suíte.
// Mantém o teste falhando apenas por suas próprias assertivas.
Cypress.on('uncaught:exception', () => false);

// Teardown global: remove, via API, qualquer usuário registrado durante o teste
// (cy.registrarUsuarioParaLimpeza), evitando duplicar essa limpeza em cada spec.
afterEach(() => {
  cy.limparUsuariosRegistrados();
});
