const SecurityService = require('../../../shared/security/SecurityService');

class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ nombre, email, password, rol }) {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error(`Email ${email} ya está registrado.`);
    }

    // Hash password
    const hashedPassword = await SecurityService.hashPassword(password);

    const newUser = {
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'TRABAJADOR',
    };

    return await this.userRepository.save(newUser);
  }
}

module.exports = RegisterUser;
