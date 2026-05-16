module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${status}] ${message}`);

  if (status === 403) {
    return res.status(403).render('errors/403');
  }

  if (status === 404) {
    return res.status(404).render('errors/404');
  }

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
};
