const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const sessionMiddleware = require('./config/session');
const db = require('./config/db');

const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

// Global middleware to attach user info to res.locals
app.use((req, res, next) => {
  if (req.session.userId) {
    res.locals.userId = req.session.userId;
    res.locals.role = req.session.role;
    res.locals.isAuthenticated = true;
  } else {
    res.locals.isAuthenticated = false;
  }
  next();
});

// Routes
app.use(require('./routes'));

// Error handler
app.use(require('./middleware/errorHandler'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
