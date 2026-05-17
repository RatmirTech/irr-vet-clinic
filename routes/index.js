const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/api', require('./apiRoutes'));
router.use('/client', require('./clientRoutes'));
router.use('/vet', require('./vetRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/', require('./guestRoutes'));

router.use((req, res) => {
  res.status(404).render('errors/404');
});

module.exports = router;
