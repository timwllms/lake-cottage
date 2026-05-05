const API_BASE = 'https://lake-cottage-api.onrender.com/api';

// DOM Elements
const bookingForm = document.getElementById('bookingForm');
const formMessage = document.getElementById('formMessage');
const gallery = document.getElementById('gallery');
const availabilityCalendar = document.getElementById('availabilityCalendar');
const nightlyRate = document.getElementById('nightlyRate');
const weeklyRate = document.getElementById('weeklyRate');
const cleaningFee = document.getElementById('cleaningFee');
const maxGuests = document.getElementById('maxGuests');
const submitBtn = document.getElementById('submitBtn');

// Mobile Navigation
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar')) {
    navLinks.classList.remove('active');
  }
});

// Set minimum date to today for date inputs
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
document.getElementById('checkIn').min = todayStr;
document.getElementById('checkOut').min = todayStr;

// Update check-out min date when check-in changes
document.getElementById('checkIn').addEventListener('change', (e) => {
  const checkInDate = new Date(e.target.value);
  checkInDate.setDate(checkInDate.getDate() + 1);
  document.getElementById('checkOut').min = checkInDate.toISOString().split('T')[0];
});

// Fetch and display rates
async function loadRates() {
  try {
    const response = await fetch(`${API_BASE}/rates`);
    const rates = await response.json();

    nightlyRate.textContent = `$${rates.nightly}`;
    weeklyRate.textContent = `$${rates.weekly}`;
    cleaningFee.textContent = `$${rates.cleaningFee}`;
    maxGuests.textContent = rates.maxGuests;

    // Update guest options
    const guestsSelect = document.getElementById('guests');
    guestsSelect.innerHTML = '';
    for (let i = 1; i <= rates.maxGuests; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i} guest${i > 1 ? 's' : ''}`;
      guestsSelect.appendChild(option);
    }
  } catch (error) {
    console.error('Failed to load rates:', error);
  }
}

// Fetch and display photos
async function loadPhotos() {
  try {
    const response = await fetch(`${API_BASE}/photos`);
    const photos = await response.json();

    gallery.innerHTML = '';

    if (!photos.hero && (!photos.gallery || photos.gallery.length === 0)) {
      gallery.innerHTML = '<div class="gallery-placeholder">No photos available yet</div>';
      return;
    }

    if (photos.hero) {
      const heroItem = document.createElement('div');
      heroItem.className = 'gallery-item';
      heroItem.innerHTML = `<img src="/assets/${photos.hero}" alt="Cottage exterior" onerror="this.src='https://placehold.co/600x400/5D4E37/FEFCF9?text=Photo'">`;
      gallery.appendChild(heroItem);
    }

    if (photos.gallery && photos.gallery.length > 0) {
      photos.gallery.forEach(filename => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="/assets/${filename}" alt="Cottage photo" onerror="this.src='https://placehold.co/600x400/8B7355/FEFCF9?text=Photo'">`;
        gallery.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Failed to load photos:', error);
    gallery.innerHTML = '<div class="gallery-placeholder">Failed to load photos</div>';
  }
}

// Fetch and display availability calendar
async function loadAvailability() {
  try {
    const response = await fetch(`${API_BASE}/availability`);
    const availability = await response.json();

    availabilityCalendar.innerHTML = '';

    // Group by month
    const months = {};
    availability.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!months[monthKey]) {
        months[monthKey] = { name: monthName, days: [] };
      }
      months[monthKey].days.push(day);
    });

    Object.entries(months).forEach(([key, month]) => {
      const monthHeader = document.createElement('h3');
      monthHeader.className = 'calendar-month-header';
      monthHeader.textContent = month.name;
      monthHeader.style.gridColumn = '1 / -1';
      monthHeader.style.marginTop = '20px';
      monthHeader.style.color = 'var(--color-primary)';
      availabilityCalendar.appendChild(monthHeader);

      month.days.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = `calendar-day ${day.available ? 'available' : 'booked'}`;

        const date = new Date(day.date);
        const dayNum = date.getDate();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        dayEl.innerHTML = `
          <div>${dayName}</div>
          <div style="font-size: 1.2rem; font-weight: bold;">${dayNum}</div>
        `;
        availabilityCalendar.appendChild(dayEl);
      });
    });
  } catch (error) {
    console.error('Failed to load availability:', error);
    availabilityCalendar.innerHTML = '<div class="calendar-loading">Failed to load availability</div>';
  }
}

// Handle booking form submission
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    checkIn: document.getElementById('checkIn').value,
    checkOut: document.getElementById('checkOut').value,
    guests: parseInt(document.getElementById('guests').value),
    message: document.getElementById('message').value
  };

  // Validate dates
  if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
    showMessage('Check-out date must be after check-in date', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  formMessage.className = 'form-message';

  try {
    const response = await fetch(`${API_BASE}/booking-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      showMessage('Booking request submitted! We\'ll contact you within 24 hours.', 'success');
      bookingForm.reset();
    } else {
      showMessage(result.error || 'Failed to submit booking request', 'error');
    }
  } catch (error) {
    console.error('Booking submission failed:', error);
    showMessage('Failed to submit booking request. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Booking Request';
  }
});

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      formMessage.className = 'form-message';
    }, 5000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadRates();
  loadPhotos();
  loadAvailability();
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navHeight = document.querySelector('.navbar').offsetHeight;
      const targetPosition = target.offsetTop - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});