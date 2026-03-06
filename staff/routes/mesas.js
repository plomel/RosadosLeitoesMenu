const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/mesas?data=2026-03-06
router.get('/', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).json({ error: 'data obrigatória' });
  const rows = db.prepare('SELECT * FROM mesas WHERE data = ? ORDER BY mesa_num').all(data);
  res.json(rows);
});

// GET /api/mesas/stats?data=2026-03-06
router.get('/stats', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).json({ error: 'data obrigatória' });
  const stats = db.prepare(`
    SELECT
      COUNT(*) as mesas_ocupadas,
      SUM(pax) as total_pax,
      ROUND(AVG(CASE WHEN pax > 0 THEN pax END), 1) as media_pax,
      SUM(doses_1) as total_leitao_inteiro,
      SUM(doses_meio) as total_leitao_meio,
      SUM(doses_quarto) as total_leitao_quarto,
      ROUND(SUM(doses_1) + SUM(doses_meio)*0.5 + SUM(doses_quarto)*0.25, 2) as total_doses
    FROM mesas WHERE data = ? AND pax > 0
  `).get(data);
  res.json(stats);
});

// PUT /api/mesas/:data/:mesa_num
router.put('/:data/:mesa_num', (req, res) => {
  const { pax, doses_1, doses_meio, doses_quarto, obs } = req.body;
  db.prepare(`
    INSERT INTO mesas (data, mesa_num, pax, doses_1, doses_meio, doses_quarto, obs, updated_by, updated_at)
    VALUES (?,?,?,?,?,?,?,?,datetime('now'))
    ON CONFLICT(data, mesa_num) DO UPDATE SET
      pax=excluded.pax,
      doses_1=excluded.doses_1,
      doses_meio=excluded.doses_meio,
      doses_quarto=excluded.doses_quarto,
      obs=excluded.obs,
      updated_by=excluded.updated_by,
      updated_at=excluded.updated_at
  `).run(req.params.data, req.params.mesa_num, pax||0, doses_1||0, doses_meio||0, doses_quarto||0, obs||'', req.user.id);
  res.json({ ok: true });
});

module.exports = router;
