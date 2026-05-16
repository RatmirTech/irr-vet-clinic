const express = require('express');
const router = express.Router();

router.use('/', require('./guestRoutes'));

// 404 handler
router.use((req, res) => {
  res.status(404).render('errors/404');
});

module.exports = router;
