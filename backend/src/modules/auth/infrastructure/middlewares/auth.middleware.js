const SecurityService = require('../../shared/security/SecurityService');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = SecurityService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'No autorizado. Token inválido o expirado.' });
  }

  req.user = decoded; // { id, email, rol }
  next();
};

module.exports = authMiddleware;
