const db = require('../config/db');

const ScheduleModel = {
  createSlot: async (vetId, slotDate, slotTime, isAvailable = true) => {
    try {
      const result = await db.query(
        'INSERT INTO schedule_slots (vet_id, slot_date, slot_time, is_available) VALUES ($1, $2, $3, $4) RETURNING id',
        [vetId, slotDate, slotTime, isAvailable]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return null;
      }
      throw err;
    }
  },

  findByVet: async (vetId) => {
    const result = await db.query(
      'SELECT * FROM schedule_slots WHERE vet_id = $1 ORDER BY slot_date, slot_time',
      [vetId]
    );
    return result.rows;
  },

  findByVetAndDate: async (vetId, slotDate) => {
    const result = await db.query(
      'SELECT * FROM schedule_slots WHERE vet_id = $1 AND slot_date = $2 ORDER BY slot_time',
      [vetId, slotDate]
    );
    return result.rows;
  },

  findAvailableSlots: async (vetId, slotDate) => {
    const result = await db.query(
      'SELECT * FROM schedule_slots WHERE vet_id = $1 AND slot_date = $2 AND is_available = true ORDER BY slot_time',
      [vetId, slotDate]
    );
    return result.rows;
  },

  deleteSlot: async (slotId) => {
    const result = await db.query('DELETE FROM schedule_slots WHERE id = $1', [slotId]);
    return result.rowCount > 0;
  },

  toggleAvailability: async (slotId) => {
    const result = await db.query(
      'UPDATE schedule_slots SET is_available = NOT is_available WHERE id = $1 RETURNING *',
      [slotId]
    );
    return result.rows[0];
  },

  findById: async (slotId) => {
    const result = await db.query('SELECT * FROM schedule_slots WHERE id = $1', [slotId]);
    return result.rows[0];
  },

  deleteByVetAndDate: async (vetId, slotDate) => {
    const result = await db.query(
      'DELETE FROM schedule_slots WHERE vet_id = $1 AND slot_date = $2',
      [vetId, slotDate]
    );
    return result.rowCount;
  },
};

module.exports = ScheduleModel;
