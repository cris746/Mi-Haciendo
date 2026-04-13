const RegisterUser = require('../application/RegisterUser');
const LoginUser = require('../application/LoginUser');
const PrismaUserRepository = require('./PrismaUserRepository');

class AuthController {
  constructor() {
    this.userRepository = new PrismaUserRepository();
    this.registerUseCase = new RegisterUser(this.userRepository);
    this.loginUseCase = new LoginUser(this.userRepository);
  }

  async register(req, res) {
    try {
      const user = await this.registerUseCase.execute(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get current user info (ME)
  async me(req, res) {
    try {
        const user = await this.userRepository.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
