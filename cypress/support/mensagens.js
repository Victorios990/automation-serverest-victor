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
  sucesso: {
    cadastroRealizado: 'Cadastro realizado com sucesso',
    loginRealizado: 'Login realizado com sucesso',
    registroExcluido: 'Registro excluído com sucesso',
  },
};
