const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Base de datos simple en archivo JSON ----------
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ guests: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------- API: invitados ----------

// Listar todos los invitados
app.get('/api/guests', (req, res) => {
  const db = readDB();
  res.json(db.guests);
});

// Obtener un invitado por id (lo usa la invitación personalizada)
app.get('/api/guests/:id', (req, res) => {
  const db = readDB();
  const guest = db.guests.find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: 'Invitado no encontrado' });
  res.json(guest);
});

// Crear un invitado nuevo (panel del festejado)
app.post('/api/guests', (req, res) => {
  const { nombre, pases } = req.body;
  if (!nombre || !pases) return res.status(400).json({ error: 'Falta nombre o número de pases' });
  const db = readDB();
  const guest = {
    id: uuidv4().split('-')[0],
    nombre,
    pases: Number(pases),
    estado: 'pendiente',       // pendiente | confirmado | no_asiste
    checkedIn: false,
    checkedInAt: null,
    createdAt: new Date().toISOString(),
    confirmedAt: null
  };
  db.guests.push(guest);
  writeDB(db);
  res.json(guest);
});

// Editar un invitado (panel del festejado)
app.put('/api/guests/:id', (req, res) => {
  const db = readDB();
  const guest = db.guests.find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: 'Invitado no encontrado' });
  const { nombre, pases, estado } = req.body;
  if (nombre !== undefined) guest.nombre = nombre;
  if (pases !== undefined) guest.pases = Number(pases);
  if (estado !== undefined) guest.estado = estado;
  writeDB(db);
  res.json(guest);
});

// Eliminar un invitado
app.delete('/api/guests/:id', (req, res) => {
  const db = readDB();
  db.guests = db.guests.filter(g => g.id !== req.params.id);
  writeDB(db);
  res.json({ ok: true });
});

// RSVP del invitado (lo llama la invitación pública)
app.post('/api/rsvp/:id', (req, res) => {
  const db = readDB();
  const guest = db.guests.find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: 'Invitado no encontrado' });
  const { attending, pases } = req.body;
  guest.estado = attending ? 'confirmado' : 'no_asiste';
  if (pases) guest.pases = Number(pases);
  guest.confirmedAt = new Date().toISOString();
  writeDB(db);
  res.json(guest);
});

// Check-in en la puerta (lo llama el panel de recepción al escanear el QR)
app.post('/api/checkin/:id', (req, res) => {
  const db = readDB();
  const guest = db.guests.find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: 'Código no reconocido — invitado no existe' });
  if (guest.checkedIn) {
    return res.status(409).json({ error: 'Este invitado ya había sido registrado', guest });
  }
  guest.checkedIn = true;
  guest.checkedInAt = new Date().toISOString();
  writeDB(db);
  res.json(guest);
});

// Estadísticas para el panel del festejado
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const guests = db.guests;
  const stats = {
    totalInvitados: guests.length,
    confirmados: guests.filter(g => g.estado === 'confirmado').length,
    noAsisten: guests.filter(g => g.estado === 'no_asiste').length,
    pendientes: guests.filter(g => g.estado === 'pendiente').length,
    pasesConfirmados: guests.filter(g => g.estado === 'confirmado').reduce((s, g) => s + g.pases, 0),
    registrados: guests.filter(g => g.checkedIn).length
  };
  res.json(stats);
});

// Página principal -> invitación
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invitacion.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de Astrid XV corriendo en el puerto ${PORT}`);
});
