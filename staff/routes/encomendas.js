const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ─── Cabeçalho do dia ────────────────────────────────────────────────────────

// GET /api/encomendas/dia/:data
router.get('/dia/:data', (req, res) => {
  const dia = db.prepare('SELECT * FROM encomendas_dia WHERE data = ?').get(req.params.data);
  res.json(dia || { data: req.params.data });
});

// PUT /api/encomendas/dia/:data
router.put('/dia/:data', (req, res) => {
  const d = req.body;
  db.prepare(`
    INSERT INTO encomendas_dia (data, dia_semana, hora_saida_manha, hora_saida_tarde,
      leitao_frio_entrega, leitao_frio_extra, leitao_frio_saldo,
      leitao_quente_entrega, leitao_quente_extra, leitao_quente_saldo,
      leitao_assar, almoco, almoco_extra, jantar, jantar_extra, updated_by, updated_at)
    VALUES (@data,@dia_semana,@hora_saida_manha,@hora_saida_tarde,
      @leitao_frio_entrega,@leitao_frio_extra,@leitao_frio_saldo,
      @leitao_quente_entrega,@leitao_quente_extra,@leitao_quente_saldo,
      @leitao_assar,@almoco,@almoco_extra,@jantar,@jantar_extra,@uid,datetime('now'))
    ON CONFLICT(data) DO UPDATE SET
      dia_semana=excluded.dia_semana,
      hora_saida_manha=excluded.hora_saida_manha,
      hora_saida_tarde=excluded.hora_saida_tarde,
      leitao_frio_entrega=excluded.leitao_frio_entrega,
      leitao_frio_extra=excluded.leitao_frio_extra,
      leitao_frio_saldo=excluded.leitao_frio_saldo,
      leitao_quente_entrega=excluded.leitao_quente_entrega,
      leitao_quente_extra=excluded.leitao_quente_extra,
      leitao_quente_saldo=excluded.leitao_quente_saldo,
      leitao_assar=excluded.leitao_assar,
      almoco=excluded.almoco,
      almoco_extra=excluded.almoco_extra,
      jantar=excluded.jantar,
      jantar_extra=excluded.jantar_extra,
      updated_by=excluded.updated_by,
      updated_at=excluded.updated_at
  `).run({ ...d, data: req.params.data, uid: req.user.id });
  res.json({ ok: true });
});

// ─── Linhas de encomendas ────────────────────────────────────────────────────

// GET /api/encomendas?data=2026-03-06
router.get('/', (req, res) => {
  const { data, de, ate } = req.query;
  if (data) {
    const rows = db.prepare('SELECT * FROM encomendas WHERE data = ? ORDER BY ordem, id').all(data);
    return res.json(rows);
  }
  if (de && ate) {
    const rows = db.prepare('SELECT * FROM encomendas WHERE data >= ? AND data <= ? ORDER BY data, ordem, id').all(de, ate);
    return res.json(rows);
  }
  res.status(400).json({ error: 'Parâmetro data ou de/ate obrigatório' });
});

// GET /api/encomendas/proximas  (próximos 14 dias — útil no telemóvel)
router.get('/proximas', (req, res) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const em14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT e.*, ed.dia_semana FROM encomendas e
    LEFT JOIN encomendas_dia ed ON ed.data = e.data
    WHERE e.data >= ? AND e.data <= ?
    ORDER BY e.data, e.ordem, e.id
  `).all(hoje, em14);
  res.json(rows);
});

// POST /api/encomendas
router.post('/', (req, res) => {
  const d = req.body;
  const info = db.prepare(`
    INSERT INTO encomendas (data, ordem, hora, nome, contacto, mesa, pax,
      leitao_1, leitao_meio, leitao_quarto, peso_kg, peso_tipo,
      extra_1, extra_2, extra_3, extra_4, extra_5, extra_6, extra_7, extra_8, extra_9,
      obs, tipo, morada, created_by)
    VALUES (@data,@ordem,@hora,@nome,@contacto,@mesa,@pax,
      @leitao_1,@leitao_meio,@leitao_quarto,@peso_kg,@peso_tipo,
      @extra_1,@extra_2,@extra_3,@extra_4,@extra_5,@extra_6,@extra_7,@extra_8,@extra_9,
      @obs,@tipo,@morada,@uid)
  `).run({ ...d, uid: req.user.id });
  res.json({ id: info.lastInsertRowid });
});

// PUT /api/encomendas/:id
router.put('/:id', (req, res) => {
  const d = req.body;
  db.prepare(`
    UPDATE encomendas SET
      data=@data, ordem=@ordem, hora=@hora, nome=@nome, contacto=@contacto,
      mesa=@mesa, pax=@pax, leitao_1=@leitao_1, leitao_meio=@leitao_meio,
      leitao_quarto=@leitao_quarto, peso_kg=@peso_kg, peso_tipo=@peso_tipo,
      extra_1=@extra_1, extra_2=@extra_2, extra_3=@extra_3, extra_4=@extra_4,
      extra_5=@extra_5, extra_6=@extra_6, extra_7=@extra_7, extra_8=@extra_8,
      extra_9=@extra_9, obs=@obs, tipo=@tipo, morada=@morada,
      updated_at=datetime('now')
    WHERE id=@id
  `).run({ ...d, id: req.params.id });
  res.json({ ok: true });
});

// DELETE /api/encomendas/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM encomendas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
