// Centraliza os textos exibidos pela aplicação (alertas, mensagens de erro/sucesso).
// Evita strings "mágicas" espalhadas pelos specs e facilita a manutenção caso o texto mude.
export const mensagens = {
  erros: {
    emailSenhaInvalidos: 'Email e/ou senha inválidos',
    emailJaUtilizado: 'Este email já está sendo usado',
    tokenInvalido:
      'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
    rotaParaAdministradores: 'Rota exclusiva para administradores',
  },
  // Mensagens de campo obrigatório retornadas pela API (POST /usuarios com corpo incompleto).
  validacaoApi: {
    nomeObrigatorio: 'nome é obrigatório',
    emailObrigatorio: 'email é obrigatório',
    passwordObrigatorio: 'password é obrigatório',
    administradorObrigatorio: 'administrador é obrigatório',
  },
  // Mesmas validações, como exibidas nos alertas da tela de cadastro (texto capitalizado).
  validacaoGui: {
    nomeObrigatorio: 'Nome é obrigatório',
    emailObrigatorio: 'Email é obrigatório',
    passwordObrigatorio: 'Password é obrigatório',
  },
  sucesso: {
    cadastroRealizado: 'Cadastro realizado com sucesso',
    loginRealizado: 'Login realizado com sucesso',
    registroExcluido: 'Registro excluído com sucesso',
  },
};
