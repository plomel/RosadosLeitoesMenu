const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'database.db'));

// Activar foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Criar tabelas ───────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    name      TEXT NOT NULL,
    role      TEXT NOT NULL CHECK(role IN ('admin','escritorio','sala','cozinha','limpeza')),
    active    INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS encomendas_dia (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    data                 TEXT NOT NULL,
    dia_semana           TEXT,
    hora_saida_manha     TEXT,
    hora_saida_tarde     TEXT,
    leitao_frio_entrega  REAL DEFAULT 0,
    leitao_frio_extra    REAL DEFAULT 0,
    leitao_frio_saldo    REAL DEFAULT 0,
    leitao_quente_entrega REAL DEFAULT 0,
    leitao_quente_extra  REAL DEFAULT 0,
    leitao_quente_saldo  REAL DEFAULT 0,
    leitao_assar         REAL DEFAULT 0,
    almoco               INTEGER DEFAULT 0,
    almoco_extra         INTEGER DEFAULT 0,
    jantar               INTEGER DEFAULT 0,
    jantar_extra         INTEGER DEFAULT 0,
    updated_by           INTEGER REFERENCES users(id),
    updated_at           TEXT DEFAULT (datetime('now')),
    UNIQUE(data)
  );

  CREATE TABLE IF NOT EXISTS encomendas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    data          TEXT NOT NULL,
    ordem         INTEGER,
    hora          TEXT,
    nome          TEXT NOT NULL,
    contacto      TEXT,
    mesa          TEXT,
    pax           INTEGER,
    leitao_1      INTEGER DEFAULT 0,
    leitao_meio   INTEGER DEFAULT 0,
    leitao_quarto INTEGER DEFAULT 0,
    peso_kg       REAL,
    peso_tipo     TEXT DEFAULT 'MAX',
    extra_1       INTEGER DEFAULT 0,
    extra_2       INTEGER DEFAULT 0,
    extra_3       INTEGER DEFAULT 0,
    extra_4       INTEGER DEFAULT 0,
    extra_5       INTEGER DEFAULT 0,
    extra_6       INTEGER DEFAULT 0,
    extra_7       INTEGER DEFAULT 0,
    extra_8       TEXT,
    extra_9       TEXT,
    obs           TEXT,
    tipo          TEXT DEFAULT 'restaurante' CHECK(tipo IN ('restaurante','entrega')),
    morada        TEXT,
    created_by    INTEGER REFERENCES users(id),
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mesas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    data       TEXT NOT NULL,
    mesa_num   INTEGER NOT NULL,
    pax        INTEGER DEFAULT 0,
    doses_1    INTEGER DEFAULT 0,
    doses_meio INTEGER DEFAULT 0,
    doses_quarto INTEGER DEFAULT 0,
    obs        TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(data, mesa_num)
  );

  CREATE TABLE IF NOT EXISTS faturas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    data        TEXT NOT NULL,
    fornecedor  TEXT NOT NULL,
    num_fatura  TEXT,
    valor       REAL NOT NULL,
    categoria   TEXT,
    obs         TEXT,
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guia_conteudo (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    seccao    TEXT NOT NULL CHECK(seccao IN ('geral','cozinha','sala','limpeza')),
    titulo    TEXT NOT NULL,
    conteudo  TEXT,
    ordem     INTEGER DEFAULT 0,
    updated_by INTEGER REFERENCES users(id),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS videos_onboarding (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    seccao      TEXT NOT NULL,
    titulo      TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    descricao   TEXT,
    ordem       INTEGER DEFAULT 0,
    active      INTEGER DEFAULT 1,
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lista_compras (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item        TEXT NOT NULL,
    quantidade  TEXT,
    categoria   TEXT DEFAULT 'geral' CHECK(categoria IN ('cozinha','limpeza','sala','bar','escritorio','geral')),
    urgencia    TEXT DEFAULT 'normal' CHECK(urgencia IN ('urgente','normal')),
    obs         TEXT,
    estado      TEXT DEFAULT 'pendente' CHECK(estado IN ('pendente','comprado')),
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now')),
    comprado_by INTEGER REFERENCES users(id),
    comprado_at TEXT
  );
`);

// ─── Criar admin por defeito se não existir ──────────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password, name, role)
    VALUES (?, ?, ?, ?)
  `).run('admin', hash, 'Administrador', 'admin');
  console.log('✅ Utilizador admin criado (password: admin123) — MUDA A PASSWORD!');
}

module.exports = db;
