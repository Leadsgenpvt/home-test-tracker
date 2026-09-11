const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'bookings.json');

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeAll(bookings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
}

function getAll() {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

function getById(id) {
  return readAll().find((b) => b.id === id) || null;
}

function create(booking) {
  const bookings = readAll();
  bookings.push(booking);
  writeAll(bookings);
  return booking;
}

function update(id, patch) {
  const bookings = readAll();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...patch, updatedAt: Date.now() };
  writeAll(bookings);
  return bookings[idx];
}

module.exports = { getAll, getById, create, update };
