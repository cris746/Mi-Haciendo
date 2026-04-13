const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = roleMiddleware;
