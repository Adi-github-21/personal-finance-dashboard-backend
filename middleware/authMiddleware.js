const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this path is correct

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in the standard Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. If not in the header, check for a token in the URL query parameters
  else if (req.query.token) {
    token = req.query.token;
  }

  // 3. If no token was found in either location, immediately reject the request.
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  // 4. If a token was found, verify it.
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object, excluding the password
    req.user = await User.findById(decoded.id || decoded.user.id).select('-password');

    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // All checks passed, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Not authorized, token is invalid' });
  }
};

module.exports = { protect };