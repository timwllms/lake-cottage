const adminPassword = process.env.ADMIN_PASSWORD || 'lakecottage2024';

const authMiddleware = (req, res, next) => {
  const password = req.headers['x-admin-password'];

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

module.exports = authMiddleware;