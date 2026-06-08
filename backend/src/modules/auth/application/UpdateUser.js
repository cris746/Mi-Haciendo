const SecurityService = require('../../../shared/security/SecurityService');

class UpdateUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, { nombre, email, role, password }) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    if (email) {
      email = email.toLowerCase().trim();
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser && existingUser.id !== id) {
        throw new Error(`Email ${email} ya está registrado por otro usuario.`);
      }
    }

    const validRoles = ['ADMIN', 'VETERINARIO', 'VENDEDOR'];
    if (role && !validRoles.includes(role)) {
      throw new Error(`Rol inválido. Roles permitidos: ${validRoles.join(', ')}`);
    }

    const updatedData = {};
    if (nombre !== undefined) updatedData.nombre = nombre;
    if (email !== undefined) updatedData.email = email;
    if (role !== undefined) updatedData.role = role;

    if (password && password.trim() !== '') {
      updatedData.password = await SecurityService.hashPassword(password);
    }

    const updatedUser = await this.userRepository.update(id, updatedData);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

module.exports = UpdateUser;
