// Fábrica de massa de dados de produto.
// O nome recebe um sufixo único por execução para evitar o erro de negócio
// "Já existe produto com esse nome", já que o catálogo é compartilhado entre execuções.
import { faker } from '@faker-js/faker';

const ProdutoFactory = {
  gerarProduto(overrides = {}) {
    const sufixo = faker.string.alphanumeric(8).toLowerCase();

    return {
      nome: `${faker.commerce.productName()} ${sufixo}`,
      preco: faker.number.int({ min: 10, max: 5000 }),
      descricao: faker.commerce.productDescription(),
      quantidade: faker.number.int({ min: 1, max: 500 }),
      ...overrides,
    };
  },
};

export default ProdutoFactory;
