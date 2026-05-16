const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/schedule', scheduleController.getSlots);
router.post('/schedule/generate', scheduleController.generateSlots);
router.post('/schedule/:slotId/delete', scheduleController.deleteSlot);
router.post('/schedule/:slotId/toggle', scheduleController.toggleSlot);

module.exports = router;
