const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const store = require('./lib/store');
const credentials = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());

function requireAuth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (header) {
      const [, encoded] = header.split(' ');
      const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
      const expected = credentials[role];
      if (user === expected.username && pass === expected.password) {
        return next();
      }
    }
    res.set('WWW-Authenticate', 'Basic realm="Staff area"');
    res.status(401).send('Login required.');
  };
}

app.get('/admin.html', requireAuth('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/technician.html', requireAuth('technician'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'technician.html'));
});

function requireAnyStaff(req, res, next) {
  const header = req.headers.authorization;
  if (header) {
    const [, encoded] = header.split(' ');
    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
    const isAdmin = user === credentials.admin.username && pass === credentials.admin.password;
    const isTech = user === credentials.technician.username && pass === credentials.technician.password;
    if (isAdmin || isTech) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Staff area"');
  res.status(401).json({ error: 'Login required.' });
}

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/bookings', (req, res) => {
  const { customerName, phone, testType, address, lat, lng, slot, notes } = req.body;

  if (!customerName || !phone || !testType || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const booking = {
    id: nanoid(8),
    customerName,
    phone,
    testType,
    address: address || '',
    lat,
    lng,
    slot: slot || '',
    notes: notes || '',
    status: 'confirmed',
    technicianName: null,
    technicianLocation: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  store.create(booking);
  io.emit('bookings-updated');
  res.status(201).json(booking);
});

app.get('/api/bookings', requireAnyStaff, (req, res) => {
  res.json(store.getAll());
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = store.getById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
});

app.post('/api/bookings/:id/assign', requireAnyStaff, (req, res) => {
  const { technicianName } = req.body;
  if (!technicianName) return res.status(400).json({ error: 'technicianName required.' });

  const updated = store.update(req.params.id, { technicianName });
  if (!updated) return res.status(404).json({ error: 'Booking not found.' });

  io.emit('bookings-updated');
  io.to(`booking:${req.params.id}`).emit('booking-updated', updated);
  res.json(updated);
});

app.post('/api/bookings/:id/status', requireAnyStaff, (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'on_the_way', 'arrived', 'collected'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const updated = store.update(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Booking not found.' });

  io.emit('bookings-updated');
  io.to(`booking:${req.params.id}`).emit('booking-updated', updated);
  res.json(updated);
});

io.on('connection', (socket) => {
  socket.on('join', (bookingId) => {
    socket.join(`booking:${bookingId}`);
  });

  socket.on('location', ({ bookingId, lat, lng }) => {
    if (!bookingId || lat == null || lng == null) return;

    store.update(bookingId, { technicianLocation: { lat, lng, at: Date.now() } });

    io.to(`booking:${bookingId}`).emit('location', { lat, lng, at: Date.now() });
  });
});

server.listen(PORT, () => {
  console.log(`Home Test Tracker running on port ${PORT}`);
});
