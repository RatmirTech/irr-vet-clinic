const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/dashboard', isAdmin, adminController.getDashboard);
router.get('/vets', isAdmin, adminController.getVets);
router.get('/services', isAdmin, adminController.getServices);
router.get('/schedule', isAdmin, adminController.getSchedule);
router.get('/clients', isAdmin, adminController.getClients);

module.exports = router;
