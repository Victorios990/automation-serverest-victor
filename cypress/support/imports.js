// Barrel de imports: centraliza dependências e utilitários de suporte usados pelos specs,
// simplificando os caminhos de import nos arquivos de teste.
import { faker } from '@faker-js/faker';
import { mensagens } from './mensagens';
import UsuarioFactory from './factories/UsuarioFactory';
import ProdutoFactory from './factories/ProdutoFactory';

export { faker, mensagens, UsuarioFactory, ProdutoFactory };
