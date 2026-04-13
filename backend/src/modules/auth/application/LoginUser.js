const SecurityService = require('../../../shared/security/SecurityService');

class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }) {
    // 1. Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    // 2. Check password
    const isPasswordValid = await SecurityService.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas.');
    }

    // 3. Generate Token
    const token = SecurityService.generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    // 4. Return user info and token
    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      },
      token
    };
  }
}

module.exports = LoginUser;
