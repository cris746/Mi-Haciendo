class GetUserById {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = GetUserById;
