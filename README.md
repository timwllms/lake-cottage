# Willow Lake Cottage

A website for a lakefront cottage short-term rental with booking management.

## Features

- **Public Site**: Responsive single-page website with:
  - Hero section with cottage introduction
  - About section with amenities
  - Photo gallery
  - Availability calendar
  - Rates and pricing
  - Location information
  - Booking request form

- **Admin Panel**: Manage bookings, calendar, photos, and rates

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open in browser:
- Website: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

## Admin Password

Default password: `lakecottage2024`

Change it by editing `backend/.env`:
```
ADMIN_PASSWORD=your-new-password
```

## Project Structure

```
lake-cottage/
├── frontend/
│   ├── index.html        # Main website
│   ├── admin.html        # Admin panel
│   ├── css/styles.css    # Earth tone styling
│   └── js/main.js        # Frontend functionality
├── backend/
│   ├── server.js         # Express server
│   ├── routes/
│   │   ├── api.js        # Public API endpoints
│   │   └── admin.js      # Admin API endpoints
│   ├── middleware/auth.js # Admin authentication
│   └── data/             # JSON data storage
├── package.json
└── README.md
```

## API Endpoints

### Public
- `GET /api/availability` - Get available dates
- `GET /api/photos` - Get photo list
- `GET /api/rates` - Get pricing
- `POST /api/booking-request` - Submit booking request

### Admin (requires X-Admin-Password header)
- `POST /api/admin/login` - Login
- `GET/PUT/DELETE /api/admin/bookings` - Manage bookings
- `GET/PUT /api/admin/calendar` - Manage calendar
- `GET/POST/DELETE /api/admin/photos` - Manage photos
- `GET/PUT /api/admin/rates` - Manage rates