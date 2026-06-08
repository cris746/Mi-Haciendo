const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class SecurityService {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('[SecurityService] JWT_SECRET no está definido en las variables de entorno. El servidor no puede arrancar de forma segura.');
    }
    this.secret = process.env.JWT_SECRET;
    this.expiresIn = '1d';
  }


  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async comparePasswords(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new SecurityService();
