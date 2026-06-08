const SecurityService = require('../../../shared/security/SecurityService');

class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ nombre, email, password, role }) {
    if (!nombre || !email || !password) {
      throw new Error('Nombre, email y contraseña son obligatorios.');
    }

    const validRoles = ['ADMIN', 'VETERINARIO', 'VENDEDOR'];
    const assignedRole = role && validRoles.includes(role) ? role : 'VENDEDOR';

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error(`Email ${normalizedEmail} ya está registrado.`);
    }

    // Hash password
    const hashedPassword = await SecurityService.hashPassword(password);

    const newUser = {
      nombre,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    };

    return await this.userRepository.save(newUser);
  }
}

module.exports = RegisterUser;
