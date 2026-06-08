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

    if (user.estado === false) {
      throw new Error('Usuario inactivo. Contacte al administrador.');
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
      role: user.role
    });

    // 4. Return user info and token
    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      },
      token
    };
  }
}

module.exports = LoginUser;
