const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const isClient = (req, res, next) => {
  if (req.session.userId && req.session.role === 'client') {
    next();
  } else {
    res.status(403).render('errors/403');
  }
};

const isVet = (req, res, next) => {
  if (req.session.userId && req.session.role === 'vet') {
    next();
  } else {
    res.status(403).render('errors/403');
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).render('errors/403');
  }
};

const isVetOrAdmin = (req, res, next) => {
  if (req.session.userId && (req.session.role === 'vet' || req.session.role === 'admin')) {
    next();
  } else {
    res.status(403).render('errors/403');
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.session.userId && req.session.role === 'admin' && req.session.isSuperAdmin) {
    next();
  } else {
    res.status(403).render('errors/403');
  }
};

module.exports = {
  isAuthenticated,
  isClient,
  isVet,
  isAdmin,
  isVetOrAdmin,
  isSuperAdmin,
};
