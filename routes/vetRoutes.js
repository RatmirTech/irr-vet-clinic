const express = require('express');
const router = express.Router();
const { isVet } = require('../middleware/auth');
const vetController = require('../controllers/vetController');

router.get('/dashboard', isVet, vetController.getDashboard);
router.get('/schedule', isVet, vetController.getSchedule);

module.exports = router;
