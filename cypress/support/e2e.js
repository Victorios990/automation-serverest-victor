// Arquivo de suporte carregado automaticamente antes de cada spec.
import './commands';

// Evita que exceções não tratadas da aplicação (fora do nosso controle) derrubem a suíte.
// Mantém o teste falhando apenas por suas próprias assertivas.
Cypress.on('uncaught:exception', () => false);
