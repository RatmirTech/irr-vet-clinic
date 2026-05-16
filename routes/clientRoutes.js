const express = require('express');
const router = express.Router();
const { isClient } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

router.get('/dashboard', isClient, clientController.getDashboard);
router.get('/profile', isClient, clientController.getProfile);
router.post('/profile', isClient, clientController.postProfile);

module.exports = router;
