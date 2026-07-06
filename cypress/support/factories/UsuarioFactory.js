// Fábrica de massa de dados de usuário.
// Gera nome, e-mail (único por execução) e senha via @faker-js/faker, evitando testes
// acoplados a dados fixos - o que causaria colisão de "e-mail já utilizado" em execuções
// repetidas contra o ambiente compartilhado do ServeRest.
import { faker } from '@faker-js/faker';

const UsuarioFactory = {
  gerarUsuario(overrides = {}) {
    const timestamp = Date.now();
    const sufixo = faker.string.alphanumeric(6).toLowerCase();

    return {
      nome: faker.person.fullName(),
      email: `qa.cypress.${timestamp}.${sufixo}@teste.com`,
      password: faker.internet.password({ length: 10 }),
      administrador: 'false',
      ...overrides,
    };
  },
};

export default UsuarioFactory;
