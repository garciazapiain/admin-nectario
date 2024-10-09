const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT and extract user data
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // "Bearer token"

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Verify JWT
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }

    req.user = user; // Attach the user data (including client_id) to request
    next(); // Continue to the next middleware or route handler
  });
};

module.exports = { authenticateToken };
