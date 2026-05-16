const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const ScheduleModel = require('../models/scheduleModel');

// Get available slots for a vet on a specific date
router.get('/slots', async (req, res) => {
  try {
    const { vetId, date } = req.query;

    if (!vetId || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const slots = await ScheduleModel.findAvailableSlots(vetId, date);

    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching slots' });
  }
});

router.get('/schedule', scheduleController.getSlots);
router.post('/schedule/generate', scheduleController.generateSlots);
router.post('/schedule/:slotId/delete', scheduleController.deleteSlot);
router.post('/schedule/:slotId/toggle', scheduleController.toggleSlot);

module.exports = router;
