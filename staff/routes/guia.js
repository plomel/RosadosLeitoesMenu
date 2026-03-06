const express = require('express');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const SECCOES_POR_ROLE = {
  admin:      ['geral','cozinha','sala','limpeza'],
  escritorio: ['geral','cozinha','sala','limpeza'],
  sala:       ['geral','sala'],
  cozinha:    ['geral','cozinha'],
  limpeza:    ['geral','limpeza'],
};

// GET /api/guia
router.get('/', (req, res) => {
  const seccoes = SECCOES_POR_ROLE[req.user.role] || ['geral'];
  const placeholders = seccoes.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM guia_conteudo WHERE seccao IN (${placeholders}) ORDER BY seccao, ordem`).all(...seccoes);
  res.json(rows);
});

// GET /api/guia/videos
router.get('/videos', (req, res) => {
  const seccoes = SECCOES_POR_ROLE[req.user.role] || ['geral'];
  const placeholders = seccoes.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM videos_onboarding WHERE seccao IN (${placeholders}) AND active=1 ORDER BY seccao, ordem`).all(...seccoes);
  res.json(rows);
});

// POST /api/guia  (admin only)
router.post('/', adminOnly, (req, res) => {
  const { seccao, titulo, conteudo, ordem } = req.body;
  const info = db.prepare('INSERT INTO guia_conteudo (seccao,titulo,conteudo,ordem,updated_by) VALUES (?,?,?,?,?)').run(seccao,titulo,conteudo||'',ordem||0,req.user.id);
  res.json({ id: info.lastInsertRowid });
});

// PUT /api/guia/:id  (admin only)
router.put('/:id', adminOnly, (req, res) => {
  const { titulo, conteudo, ordem } = req.body;
  db.prepare('UPDATE guia_conteudo SET titulo=?,conteudo=?,ordem=?,updated_by=?,updated_at=datetime(\'now\') WHERE id=?').run(titulo,conteudo||'',ordem||0,req.user.id,req.params.id);
  res.json({ ok: true });
});

// DELETE /api/guia/:id  (admin only)
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM guia_conteudo WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/guia/videos  (admin only)
router.post('/videos', adminOnly, (req, res) => {
  const { seccao, titulo, youtube_url, descricao, ordem } = req.body;
  const info = db.prepare('INSERT INTO videos_onboarding (seccao,titulo,youtube_url,descricao,ordem,created_by) VALUES (?,?,?,?,?,?)').run(seccao,titulo,youtube_url,descricao||'',ordem||0,req.user.id);
  res.json({ id: info.lastInsertRowid });
});

// DELETE /api/guia/videos/:id  (admin only)
router.delete('/videos/:id', adminOnly, (req, res) => {
  db.prepare('UPDATE videos_onboarding SET active=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
