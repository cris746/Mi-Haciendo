const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class SecurityService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'mi_hacienda_secret_key_123';
    this.expiresIn = '8h';
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
