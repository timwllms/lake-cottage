const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

const dataDir = path.join(__dirname, '../data');
const assetsDir = path.join(__dirname, '../../frontend/assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assetsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const readJSON = (filename) => {
  const data = fs.readFileSync(path.join(dataDir, filename), 'utf8');
  return JSON.parse(data);
};

const writeJSON = (filename, data) => {
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2));
};

// POST /api/admin/login - Admin login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'lakecottage2024';

  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// GET /api/admin/bookings - List all bookings
router.get('/bookings', authMiddleware, (req, res) => {
  try {
    const bookings = readJSON('bookings.json');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// PUT /api/admin/bookings/:id - Update booking status
router.put('/bookings/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut } = req.body;

    let bookings = readJSON('bookings.json');
    const bookingIndex = bookings.findIndex(b => b.id === id);

    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    bookings[bookingIndex].status = status;

    if (status === 'approved' && checkIn && checkOut) {
      const calendar = readJSON('calendar.json');
      const start = new Date(checkIn);
      const end = new Date(checkOut);

      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!calendar.booked.includes(dateStr)) {
          calendar.booked.push(dateStr);
        }
      }
      writeJSON('calendar.json', calendar);
    }

    if (status === 'rejected' || status === 'pending') {
      const booking = bookings[bookingIndex];
      const calendar = readJSON('calendar.json');
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);

      const bookedDates = [];
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        bookedDates.push(d.toISOString().split('T')[0]);
      }
      calendar.booked = calendar.booked.filter(d => !bookedDates.includes(d));
      writeJSON('calendar.json', calendar);
    }

    writeJSON('bookings.json', bookings);
    res.json(bookings[bookingIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /api/admin/bookings/:id - Delete booking
router.delete('/bookings/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    let bookings = readJSON('bookings.json');
    const booking = bookings.find(b => b.id === id);

    if (booking && booking.status === 'approved') {
      const calendar = readJSON('calendar.json');
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);

      const bookedDates = [];
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        bookedDates.push(d.toISOString().split('T')[0]);
      }
      calendar.booked = calendar.booked.filter(d => !bookedDates.includes(d));
      writeJSON('calendar.json', calendar);
    }

    bookings = bookings.filter(b => b.id !== id);
    writeJSON('bookings.json', bookings);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// GET /api/admin/calendar - Get full calendar data
router.get('/calendar', authMiddleware, (req, res) => {
  try {
    const calendar = readJSON('calendar.json');
    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get calendar' });
  }
});

// PUT /api/admin/calendar - Update blocked/available dates
router.put('/calendar', authMiddleware, (req, res) => {
  try {
    const { blocked } = req.body;
    const calendar = { blocked: blocked || [], booked: readJSON('calendar.json').booked };
    writeJSON('calendar.json', calendar);
    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update calendar' });
  }
});

// GET /api/admin/photos - Get photos list
router.get('/photos', authMiddleware, (req, res) => {
  try {
    const photos = readJSON('photos.json');
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// POST /api/admin/photos - Upload new photo
router.post('/photos', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photos = readJSON('photos.json');
    const filename = req.file.filename;

    if (req.body.type === 'hero') {
      photos.hero = filename;
    } else {
      photos.gallery.push(filename);
    }

    writeJSON('photos.json', photos);
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// DELETE /api/admin/photos/:filename - Remove photo
router.delete('/photos/:filename', authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    const photos = readJSON('photos.json');

    if (photos.hero === filename) {
      photos.hero = '';
    } else {
      photos.gallery = photos.gallery.filter(f => f !== filename);
    }

    writeJSON('photos.json', photos);

    const filePath = path.join(assetsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// GET /api/admin/rates - Get rates
router.get('/rates', authMiddleware, (req, res) => {
  try {
    const rates = readJSON('rates.json');
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rates' });
  }
});

// PUT /api/admin/rates - Update rates
router.put('/rates', authMiddleware, (req, res) => {
  try {
    const { nightly, weekly, cleaningFee, maxGuests } = req.body;
    const rates = { nightly, weekly, cleaningFee, maxGuests };
    writeJSON('rates.json', rates);
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rates' });
  }
});

module.exports = router;