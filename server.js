const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* =========================================================
   CAPA DE DATOS
   - Si existe DATABASE_URL (Render Postgres) usamos PostgreSQL.
     Esto es lo que se usa en producción: NO se borra cuando
     el servidor se duerme y despierta.
   - Si NO existe DATABASE_URL (ej. corriendo en tu compu para
     probar), usamos un archivo db.json como respaldo, solo
     para desarrollo local.
   ========================================================= */

const USE_POSTGRES = !!process.env.DATABASE_URL;

let pool;
if (USE_POSTGRES) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

const DB_PATH = path.join(__dirname, 'db.json');

async function initDB() {
  if (USE_POSTGRES) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        pases INTEGER NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        checked_in BOOLEAN NOT NULL DEFAULT FALSE,
        checked_in_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confirmed_at TIMESTAMPTZ
      );
    `);
    console.log('✅ Conectado a PostgreSQL — los datos son permanentes.');
  } else {
    console.log('⚠️  Sin DATABASE_URL — usando db.json local (solo para pruebas, NO usar así en producción).');
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ guests: [] }, null, 2));
  }
}

// ---------- helpers para el modo archivo local (desarrollo) ----------
function readFileDB() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
function writeFileDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

function rowToGuest(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    pases: row.pases,
    estado: row.estado,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at
  };
}

const Guests = {
  async all() {
    if (USE_POSTGRES) {
      const { rows } = await pool.query('SELECT * FROM guests ORDER BY created_at ASC');
      return rows.map(rowToGuest);
    }
    return readFileDB().guests;
  },
  async get(id) {
    if (USE_POSTGRES) {
      const { rows } = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
      return rows[0] ? rowToGuest(rows[0]) : null;
    }
    return readFileDB().guests.find(g => g.id === id) || null;
  },
  async create({ nombre, pases }) {
    const id = uuidv4().split('-')[0];
    if (USE_POSTGRES) {
      const { rows } = await pool.query(
        `INSERT INTO guests (id, nombre, pases) VALUES ($1, $2, $3) RETURNING *`,
        [id, nombre, pases]
      );
      return rowToGuest(rows[0]);
    }
    const db = readFileDB();
    const guest = {
      id, nombre, pases: Number(pases), estado: 'pendiente',
      checkedIn: false, checkedInAt: null,
      createdAt: new Date().toISOString(), confirmedAt: null
    };
    db.guests.push(guest);
    writeFileDB(db);
    return guest;
  },
  async update(id, fields) {
    if (USE_POSTGRES) {
      const sets = [];
      const values = [];
      let i = 1;
      if (fields.nombre !== undefined) { sets.push(`nombre = $${i++}`); values.push(fields.nombre); }
      if (fields.pases !== undefined) { sets.push(`pases = $${i++}`); values.push(fields.pases); }
      if (fields.estado !== undefined) { sets.push(`estado = $${i++}`); values.push(fields.estado); }
      if (fields.checkedIn !== undefined) { sets.push(`checked_in = $${i++}`); values.push(fields.checkedIn); }
      if (fields.checkedInAt !== undefined) { sets.push(`checked_in_at = $${i++}`); values.push(fields.checkedInAt); }
      if (fields.confirmedAt !== undefined) { sets.push(`confirmed_at = $${i++}`); values.push(fields.confirmedAt); }
      if (!sets.length) return Guests.get(id);
      values.push(id);
      const { rows } = await pool.query(`UPDATE guests SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, values);
      return rows[0] ? rowToGuest(rows[0]) : null;
    }
    const db = readFileDB();
    const guest = db.guests.find(g => g.id === id);
    if (!guest) return null;
    Object.assign(guest, fields);
    writeFileDB(db);
    return guest;
  },
  async remove(id) {
    if (USE_POSTGRES) {
      await pool.query('DELETE FROM guests WHERE id = $1', [id]);
      return;
    }
    const db = readFileDB();
    db.guests = db.guests.filter(g => g.id !== id);
    writeFileDB(db);
  }
};

/* =========================================================
   API
   ========================================================= */

app.get('/api/guests', async (req, res) => {
  res.json(await Guests.all());
});

app.get('/api/guests/:id', async (req, res) => {
  const guest = await Guests.get(req.params.id);
  if (!guest) return res.status(404).json({ error: 'Invitado no encontrado' });
  res.json(guest);
});

app.post('/api/guests', async (req, res) => {
  const { nombre, pases } = req.body;
  if (!nombre || !pases) return res.status(400).json({ error: 'Falta nombre o número de pases' });
  const guest = await Guests.create({ nombre, pases: Number(pases) });
  res.json(guest);
});

app.put('/api/guests/:id', async (req, res) => {
  const guest = await Guests.update(req.params.id, req.body);
  if (!guest) return res.status(404).json({ error: 'Invitado no encontrado' });
  res.json(guest);
});

app.delete('/api/guests/:id', async (req, res) => {
  await Guests.remove(req.params.id);
  res.json({ ok: true });
});

app.post('/api/rsvp/:id', async (req, res) => {
  const existing = await Guests.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invitado no encontrado' });
  const { attending, pases } = req.body;
  const guest = await Guests.update(req.params.id, {
    estado: attending ? 'confirmado' : 'no_asiste',
    pases: pases ? Number(pases) : undefined,
    confirmedAt: new Date().toISOString()
  });
  res.json(guest);
});

app.post('/api/checkin/:id', async (req, res) => {
  const guest = await Guests.get(req.params.id);
  if (!guest) return res.status(404).json({ error: 'Código no reconocido — invitado no existe' });
  if (guest.checkedIn) return res.status(409).json({ error: 'Este invitado ya había sido registrado', guest });
  const updated = await Guests.update(req.params.id, { checkedIn: true, checkedInAt: new Date().toISOString() });
  res.json(updated);
});

app.get('/api/stats', async (req, res) => {
  const guests = await Guests.all();
  res.json({
    totalInvitados: guests.length,
    confirmados: guests.filter(g => g.estado === 'confirmado').length,
    noAsisten: guests.filter(g => g.estado === 'no_asiste').length,
    pendientes: guests.filter(g => g.estado === 'pendiente').length,
    pasesConfirmados: guests.filter(g => g.estado === 'confirmado').reduce((s, g) => s + g.pases, 0),
    registrados: guests.filter(g => g.checkedIn).length
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invitacion.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor de Astrid XV corriendo en el puerto ${PORT}`);
  });
});