const pool = require('../config/db');

const VisitModel = {
  async getById(visitId) {
    const result = await pool.query(
      `SELECT
        v.id,
        v.med_card_id,
        v.appointment_id,
        v.vet_id,
        v.visit_date,
        v.diagnosis,
        v.treatment,
        v.prescriptions,
        v.notes,
        v.created_at,
        vt.full_name as vet_name,
        a.name as animal_name,
        a.species,
        c.full_name as client_name
      FROM visits v
      JOIN vets vt ON v.vet_id = vt.id
      JOIN med_cards mc ON v.med_card_id = mc.id
      JOIN animals a ON mc.animal_id = a.id
      JOIN clients c ON a.client_id = c.id
      WHERE v.id = $1`,
      [visitId]
    );
    return result.rows[0];
  },

  async getByMedCardId(medCardId) {
    const result = await pool.query(
      `SELECT
        v.id,
        v.med_card_id,
        v.appointment_id,
        v.vet_id,
        v.visit_date,
        v.diagnosis,
        v.treatment,
        v.prescriptions,
        v.notes,
        v.created_at,
        vt.full_name as vet_name
      FROM visits v
      JOIN vets vt ON v.vet_id = vt.id
      WHERE v.med_card_id = $1
      ORDER BY v.visit_date DESC`,
      [medCardId]
    );
    return result.rows;
  },

  async create(medCardId, appointmentId, vetId, visitData) {
    const { visit_date, diagnosis, treatment, prescriptions, notes } = visitData;
    const result = await pool.query(
      `INSERT INTO visits (med_card_id, appointment_id, vet_id, visit_date, diagnosis, treatment, prescriptions, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [medCardId, appointmentId, vetId, visit_date, diagnosis, treatment, prescriptions, notes]
    );
    return result.rows[0];
  },

  async update(visitId, visitData) {
    const { diagnosis, treatment, prescriptions, notes } = visitData;
    const result = await pool.query(
      `UPDATE visits
       SET diagnosis = $1, treatment = $2, prescriptions = $3, notes = $4
       WHERE id = $5
       RETURNING *`,
      [diagnosis, treatment, prescriptions, notes, visitId]
    );
    return result.rows[0];
  },

  async delete(visitId) {
    const result = await pool.query(
      'DELETE FROM visits WHERE id = $1 RETURNING *',
      [visitId]
    );
    return result.rows[0];
  },

  async getVetUpcomingAppointments(vetId, limit = 5) {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT
        a.id,
        a.status,
        ss.slot_date,
        ss.slot_time,
        an.name as animal_name,
        c.full_name as client_name
      FROM appointments a
      JOIN schedule_slots ss ON a.slot_id = ss.id
      JOIN animals an ON a.animal_id = an.id
      JOIN clients c ON a.client_id = c.id
      WHERE a.vet_id = $1
        AND ss.slot_date >= $2
        AND a.status IN ('pending', 'confirmed')
      ORDER BY ss.slot_date ASC, ss.slot_time ASC
      LIMIT $3`,
      [vetId, today, limit]
    );
    return result.rows;
  }
};

module.exports = VisitModel;
