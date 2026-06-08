const PrismaUserRepository = require('./PrismaUserRepository');
const ListUsers = require('../application/ListUsers');
const GetUserById = require('../application/GetUserById');
const RegisterUser = require('../application/RegisterUser');
const UpdateUser = require('../application/UpdateUser');
const ChangeUserStatus = require('../application/ChangeUserStatus');

class UserController {
  constructor() {
    this.userRepository = new PrismaUserRepository();
    this.listUsersUseCase = new ListUsers(this.userRepository);
    this.getUserByIdUseCase = new GetUserById(this.userRepository);
    this.createUserUseCase = new RegisterUser(this.userRepository);
    this.updateUserUseCase = new UpdateUser(this.userRepository);
    this.changeUserStatusUseCase = new ChangeUserStatus(this.userRepository);
  }

  async getAll(req, res) {
    try {
      const users = await this.listUsersUseCase.execute();
      res.json(users);
    } catch (error) {
      console.error('GetAll users error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await this.getUserByIdUseCase.execute(Number(id));
      res.json(user);
    } catch (error) {
      console.error('GetById user error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const user = await this.updateUserUseCase.execute(Number(id), req.body);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const user = await this.changeUserStatusUseCase.execute(Number(id), req.user);
      res.json(user);
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UserController;
