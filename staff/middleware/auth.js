const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'rosa-dos-leitoes-secret-2024';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Token em falta' });

  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Apenas admin e escritório
function escritorioOnly(req, res, next) {
  if (!['admin', 'escritorio'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso restrito ao escritório' });
  }
  next();
}

// Admin apenas
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  next();
}

module.exports = { authMiddleware, escritorioOnly, adminOnly, SECRET };
