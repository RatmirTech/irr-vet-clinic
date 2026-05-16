const ScheduleModel = require('../models/scheduleModel');

const scheduleController = {
  getSlots: async (req, res) => {
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
  },

  generateSlots: async (req, res) => {
    try {
      const { vetId, date, times } = req.body;

      if (!vetId || !date || !times || times.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const timeArray = Array.isArray(times) ? times : [times];

      for (const time of timeArray) {
        await ScheduleModel.createSlot(vetId, date, time, true);
      }

      res.json({ success: true, message: 'Slots generated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error generating slots' });
    }
  },

  deleteSlot: async (req, res) => {
    try {
      const { slotId } = req.params;

      const deleted = await ScheduleModel.deleteSlot(slotId);

      if (!deleted) {
        return res.status(404).json({ error: 'Slot not found' });
      }

      res.json({ success: true, message: 'Slot deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting slot' });
    }
  },

  toggleSlot: async (req, res) => {
    try {
      const { slotId } = req.params;

      const slot = await ScheduleModel.toggleAvailability(slotId);

      if (!slot) {
        return res.status(404).json({ error: 'Slot not found' });
      }

      res.json({ success: true, slot });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error toggling slot' });
    }
  },
};

module.exports = scheduleController;
