const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

const readJSON = (filename) => {
  const data = fs.readFileSync(path.join(dataDir, filename), 'utf8');
  return JSON.parse(data);
};

const writeJSON = (filename, data) => {
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2));
};

// GET /api/availability - Get available dates for next 60 days
router.get('/availability', (req, res) => {
  try {
    const calendar = readJSON('calendar.json');
    const bookings = readJSON('bookings.json');

    const today = new Date();
    const availability = [];

    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const isBlocked = calendar.blocked.includes(dateStr);
      const isBooked = calendar.booked.includes(dateStr) ||
        bookings.some(b => b.status === 'approved' &&
          dateStr >= b.checkIn && dateStr < b.checkOut);

      availability.push({
        date: dateStr,
        available: !isBlocked && !isBooked
      });
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// GET /api/photos - Get list of photo URLs
router.get('/photos', (req, res) => {
  try {
    const photos = readJSON('photos.json');
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// GET /api/rates - Get pricing info
router.get('/rates', (req, res) => {
  try {
    const rates = readJSON('rates.json');
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rates' });
  }
});

// POST /api/booking-request - Submit a booking request
router.post('/booking-request', (req, res) => {
  try {
    const { name, email, phone, checkIn, checkOut, guests, message } = req.body;

    if (!name || !email || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bookings = readJSON('bookings.json');

    const newBooking = {
      id: uuidv4(),
      name,
      email,
      phone: phone || '',
      checkIn,
      checkOut,
      guests: guests || 1,
      message: message || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    writeJSON('bookings.json', bookings);

    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit booking request' });
  }
});

module.exports = router;