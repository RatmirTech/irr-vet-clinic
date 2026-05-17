const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const flash = require('connect-flash');
require('dotenv').config();

const sessionMiddleware = require('./config/session');
const db = require('./config/db');
const runMigrations = require('./db/migrations');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(sessionMiddleware);
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (req.session.userId) {
    res.locals.userId = req.session.userId;
    res.locals.role = req.session.role;
    res.locals.isSuperAdmin = req.session.isSuperAdmin || false;
    res.locals.isAuthenticated = true;
  } else {
    res.locals.isAuthenticated = false;
    res.locals.isSuperAdmin = false;
  }
  res.locals.flash = req.flash();
  next();
});

app.use(require('./routes'));

app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  runMigrations().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  });
} else {
  app.listen(PORT);
}

module.exports = app;
