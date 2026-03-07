require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rotas API ───────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/encomendas', require('./routes/encomendas'));
app.use('/api/mesas',      require('./routes/mesas'));
app.use('/api/faturas',    require('./routes/faturas'));
app.use('/api/guia',       require('./routes/guia'));
app.use('/api/compras',    require('./routes/compras'));

// ─── SPA fallback ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌹 Rosa dos Leitões — Staff Portal a correr na porta ${PORT}`);
});
