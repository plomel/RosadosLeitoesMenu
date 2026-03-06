const express = require('express');
const db = require('../db');
const { authMiddleware, escritorioOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, escritorioOnly);

// GET /api/faturas?mes=2026-03
router.get('/', (req, res) => {
  const { mes, de, ate } = req.query;
  if (mes) {
    const rows = db.prepare(`
      SELECT f.*, u.name as criado_por FROM faturas f
      LEFT JOIN users u ON u.id = f.created_by
      WHERE f.data LIKE ? ORDER BY f.data DESC
    `).all(mes + '%');
    const total = rows.reduce((s, r) => s + r.valor, 0);
    return res.json({ rows, total: Math.round(total * 100) / 100 });
  }
  if (de && ate) {
    const rows = db.prepare(`
      SELECT f.*, u.name as criado_por FROM faturas f
      LEFT JOIN users u ON u.id = f.created_by
      WHERE f.data >= ? AND f.data <= ? ORDER BY f.data DESC
    `).all(de, ate);
    const total = rows.reduce((s, r) => s + r.valor, 0);
    return res.json({ rows, total: Math.round(total * 100) / 100 });
  }
  // últimas 50 por defeito
  const rows = db.prepare(`
    SELECT f.*, u.name as criado_por FROM faturas f
    LEFT JOIN users u ON u.id = f.created_by
    ORDER BY f.data DESC LIMIT 50
  `).all();
  res.json({ rows });
});

// POST /api/faturas
router.post('/', (req, res) => {
  const { data, fornecedor, num_fatura, valor, categoria, obs } = req.body;
  if (!data || !fornecedor || valor == null)
    return res.status(400).json({ error: 'data, fornecedor e valor obrigatórios' });

  const info = db.prepare(`
    INSERT INTO faturas (data, fornecedor, num_fatura, valor, categoria, obs, created_by)
    VALUES (?,?,?,?,?,?,?)
  `).run(data, fornecedor, num_fatura||'', valor, categoria||'', obs||'', req.user.id);
  res.json({ id: info.lastInsertRowid });
});

// PUT /api/faturas/:id
router.put('/:id', (req, res) => {
  const { data, fornecedor, num_fatura, valor, categoria, obs } = req.body;
  db.prepare(`
    UPDATE faturas SET data=?,fornecedor=?,num_fatura=?,valor=?,categoria=?,obs=?
    WHERE id=?
  `).run(data, fornecedor, num_fatura||'', valor, categoria||'', obs||'', req.params.id);
  res.json({ ok: true });
});

// DELETE /api/faturas/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM faturas WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/faturas/resumo/mensal  — totais por mês
router.get('/resumo/mensal', (req, res) => {
  const rows = db.prepare(`
    SELECT substr(data,1,7) as mes, COUNT(*) as num_faturas,
           ROUND(SUM(valor),2) as total, categoria
    FROM faturas
    GROUP BY substr(data,1,7), categoria
    ORDER BY mes DESC
  `).all();
  res.json(rows);
});

module.exports = router;
