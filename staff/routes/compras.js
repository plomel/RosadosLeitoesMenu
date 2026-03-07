const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const podeGestao = (role) => ['admin', 'escritorio'].includes(role);

// GET /api/compras?estado=pendente|comprado|todos
router.get('/', (req, res) => {
  const estado = req.query.estado || 'pendente';
  let rows;
  if (estado === 'todos') {
    rows = db.prepare(`
      SELECT c.*, u.name as created_by_name, g.name as comprado_by_name
      FROM lista_compras c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users g ON c.comprado_by = g.id
      ORDER BY c.urgencia DESC, c.created_at ASC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT c.*, u.name as created_by_name, g.name as comprado_by_name
      FROM lista_compras c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users g ON c.comprado_by = g.id
      WHERE c.estado = ?
      ORDER BY c.urgencia DESC, c.created_at ASC
    `).all(estado);
  }
  res.json(rows);
});

// GET /api/compras/resumo  (para dashboard — contagens)
router.get('/resumo', (req, res) => {
  const total    = db.prepare("SELECT COUNT(*) as n FROM lista_compras WHERE estado='pendente'").get().n;
  const urgentes = db.prepare("SELECT COUNT(*) as n FROM lista_compras WHERE estado='pendente' AND urgencia='urgente'").get().n;
  res.json({ total, urgentes });
});

// POST /api/compras  — qualquer role pode adicionar
router.post('/', (req, res) => {
  const { item, quantidade, categoria, urgencia, obs } = req.body;
  if (!item || !item.trim()) return res.status(400).json({ error: 'Item obrigatório' });
  const r = db.prepare(`
    INSERT INTO lista_compras (item, quantidade, categoria, urgencia, obs, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    item.trim(),
    quantidade || null,
    categoria  || 'geral',
    urgencia   || 'normal',
    obs        || null,
    req.user.id
  );
  res.json({ id: r.lastInsertRowid });
});

// PATCH /api/compras/:id/comprado  — admin/escritório
router.patch('/:id/comprado', (req, res) => {
  if (!podeGestao(req.user.role)) return res.status(403).json({ error: 'Sem permissão' });
  db.prepare(`
    UPDATE lista_compras SET estado='comprado', comprado_by=?, comprado_at=datetime('now')
    WHERE id=?
  `).run(req.user.id, req.params.id);
  res.json({ ok: true });
});

// PATCH /api/compras/:id/reabrir  — admin/escritório (desfazer comprado)
router.patch('/:id/reabrir', (req, res) => {
  if (!podeGestao(req.user.role)) return res.status(403).json({ error: 'Sem permissão' });
  db.prepare(`
    UPDATE lista_compras SET estado='pendente', comprado_by=NULL, comprado_at=NULL WHERE id=?
  `).run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/compras/:id  — admin/escritório ou o próprio criador
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM lista_compras WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Não encontrado' });
  if (!podeGestao(req.user.role) && row.created_by !== req.user.id)
    return res.status(403).json({ error: 'Sem permissão' });
  db.prepare('DELETE FROM lista_compras WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/compras/limpar-comprados  — admin/escritório
router.delete('/limpar-comprados', (req, res) => {
  if (!podeGestao(req.user.role)) return res.status(403).json({ error: 'Sem permissão' });
  const r = db.prepare("DELETE FROM lista_compras WHERE estado='comprado'").run();
  res.json({ apagados: r.changes });
});

module.exports = router;
