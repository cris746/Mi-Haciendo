const SecurityService = require('../security/SecurityService');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = SecurityService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;
