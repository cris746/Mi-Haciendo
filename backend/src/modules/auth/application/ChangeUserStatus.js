class ChangeUserStatus {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, currentUser) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const newEstado = !user.estado;

    // Prevent deactivating if it's the last active ADMIN
    if (user.role === 'ADMIN' && newEstado === false) {
      const allUsers = await this.userRepository.findAll();
      const activeAdmins = allUsers.filter(u => u.role === 'ADMIN' && u.estado === true);
      
      if (activeAdmins.length <= 1) {
        throw new Error('No puedes desactivar al último administrador activo del sistema.');
      }
    }

    const updatedUser = await this.userRepository.update(id, { estado: newEstado });
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

module.exports = ChangeUserStatus;
