const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, adminOnly, SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username e password obrigatórios' });

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// GET /api/auth/users  (admin only)
router.get('/users', authMiddleware, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, active, created_at FROM users').all();
  res.json(users);
});

// POST /api/auth/users  (admin only)
router.post('/users', authMiddleware, adminOnly, (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name || !role)
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?,?,?,?)').run(username, hash, name, role);
    res.json({ id: info.lastInsertRowid, username, name, role });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username já existe' });
    throw e;
  }
});

// PUT /api/auth/users/:id/password  (admin only)
router.put('/users/:id/password', authMiddleware, adminOnly, (req, res) => {
  const { password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.params.id);
  res.json({ ok: true });
});

// PUT /api/auth/users/:id/active  (admin only)
router.put('/users/:id/active', authMiddleware, adminOnly, (req, res) => {
  const { active } = req.body;
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
