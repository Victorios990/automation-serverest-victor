// Barrel de imports: centraliza dependências e utilitários de suporte usados pelos specs,
// permitindo importar tudo (factories, mensagens, ações de tela) em uma única linha.
import { faker } from '@faker-js/faker';
import { mensagens } from './mensagens';
import UsuarioFactory from './factories/UsuarioFactory';
import ProdutoFactory from './factories/ProdutoFactory';
import { CadastroActions } from './actions/cadastroActions';
import { LoginActions } from './actions/loginActions';
import { HomeActions } from './actions/homeActions';

export {
  faker,
  mensagens,
  UsuarioFactory,
  ProdutoFactory,
  CadastroActions,
  LoginActions,
  HomeActions,
};
