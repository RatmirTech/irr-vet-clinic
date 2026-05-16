const db = require('../config/db');

const AppointmentModel = {
  create: async (clientId, vetId, animalId, slotId, serviceId, notes = null) => {
    const result = await db.query(
      'INSERT INTO appointments (client_id, vet_id, animal_id, slot_id, service_id, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [clientId, vetId, animalId, slotId, serviceId, 'pending', notes]
    );

    if (slotId) {
      await db.query('UPDATE schedule_slots SET is_available = false WHERE id = $1', [slotId]);
    }

    return result.rows[0];
  },

  findByClientId: async (clientId) => {
    const result = await db.query(
      `SELECT a.*,
              v.full_name as vet_name,
              s.name as service_name,
              an.name as animal_name,
              an.species,
              cl.full_name as client_name,
              sc.slot_date,
              sc.slot_time
       FROM appointments a
       LEFT JOIN vets v ON a.vet_id = v.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN animals an ON a.animal_id = an.id
       LEFT JOIN clients cl ON a.client_id = cl.id
       LEFT JOIN schedule_slots sc ON a.slot_id = sc.id
       WHERE a.client_id = $1
       ORDER BY sc.slot_date DESC, sc.slot_time DESC`,
      [clientId]
    );
    return result.rows;
  },

  findByVetId: async (vetId) => {
    const result = await db.query(
      `SELECT a.*,
              v.full_name as vet_name,
              s.name as service_name,
              an.name as animal_name,
              an.species,
              cl.full_name as client_name,
              cl.phone,
              sc.slot_date,
              sc.slot_time
       FROM appointments a
       LEFT JOIN vets v ON a.vet_id = v.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN animals an ON a.animal_id = an.id
       LEFT JOIN clients cl ON a.client_id = cl.id
       LEFT JOIN schedule_slots sc ON a.slot_id = sc.id
       WHERE a.vet_id = $1
       ORDER BY sc.slot_date DESC, sc.slot_time DESC`,
      [vetId]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query(
      `SELECT a.*,
              v.full_name as vet_name,
              s.name as service_name,
              an.name as animal_name,
              an.species,
              cl.full_name as client_name,
              cl.phone,
              sc.slot_date,
              sc.slot_time
       FROM appointments a
       LEFT JOIN vets v ON a.vet_id = v.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN animals an ON a.animal_id = an.id
       LEFT JOIN clients cl ON a.client_id = cl.id
       LEFT JOIN schedule_slots sc ON a.slot_id = sc.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  updateStatus: async (id, status) => {
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  getTodayAppointments: async (vetId) => {
    const result = await db.query(
      `SELECT a.*,
              v.full_name as vet_name,
              s.name as service_name,
              an.name as animal_name,
              an.species,
              cl.full_name as client_name,
              sc.slot_date,
              sc.slot_time
       FROM appointments a
       LEFT JOIN vets v ON a.vet_id = v.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN animals an ON a.animal_id = an.id
       LEFT JOIN clients cl ON a.client_id = cl.id
       LEFT JOIN schedule_slots sc ON a.slot_id = sc.id
       WHERE a.vet_id = $1 AND DATE(sc.slot_date) = CURRENT_DATE
       ORDER BY sc.slot_time ASC`,
      [vetId]
    );
    return result.rows;
  },

  cancel: async (id) => {
    const appointment = await AppointmentModel.findById(id);
    if (appointment && appointment.slot_id) {
      await db.query('UPDATE schedule_slots SET is_available = true WHERE id = $1', [appointment.slot_id]);
    }
    return AppointmentModel.updateStatus(id, 'cancelled');
  },
};

module.exports = AppointmentModel;
