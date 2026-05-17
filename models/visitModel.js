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
        a.id as appointment_id,
        a.status,
        ss.slot_date,
        ss.slot_time,
        an.id as animal_id,
        an.name as animal_name,
        an.species,
        c.full_name as client_name,
        s.name as service_name
      FROM appointments a
      JOIN schedule_slots ss ON a.slot_id = ss.id
      JOIN animals an ON a.animal_id = an.id
      JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE a.vet_id = $1
        AND ss.slot_date >= $2
        AND a.status IN ('pending', 'confirmed')
      ORDER BY ss.slot_date ASC, ss.slot_time ASC
      LIMIT $3`,
      [vetId, today, limit]
    );
    return result.rows;
  },

  async addPhoto(visitId, photoUrl, caption = null) {
    const result = await pool.query(
      `INSERT INTO visit_photos (visit_id, photo_url, caption) VALUES ($1, $2, $3) RETURNING *`,
      [visitId, photoUrl, caption]
    );
    return result.rows[0];
  },

  async getPhotos(visitId) {
    const result = await pool.query(
      `SELECT * FROM visit_photos WHERE visit_id = $1 ORDER BY created_at`,
      [visitId]
    );
    return result.rows;
  },

  async deletePhoto(photoId) {
    const result = await pool.query(`DELETE FROM visit_photos WHERE id = $1 RETURNING *`, [photoId]);
    return result.rows[0];
  },

  async getPhotosForVisits(visitIds) {
    if (!visitIds || !visitIds.length) return {};
    const result = await pool.query(
      `SELECT * FROM visit_photos WHERE visit_id = ANY($1::int[]) ORDER BY created_at`,
      [visitIds]
    );
    const grouped = {};
    for (const photo of result.rows) {
      if (!grouped[photo.visit_id]) grouped[photo.visit_id] = [];
      grouped[photo.visit_id].push(photo);
    }
    return grouped;
  },

  async getAppointmentsForVet(vetId, filters = {}) {
    const { status, dateFrom, dateTo } = filters;
    const params = [vetId];
    const where = ['a.vet_id = $1'];
    if (status) { params.push(status); where.push(`a.status = $${params.length}`); }
    if (dateFrom) { params.push(dateFrom); where.push(`ss.slot_date >= $${params.length}`); }
    if (dateTo) { params.push(dateTo); where.push(`ss.slot_date <= $${params.length}`); }

    const result = await pool.query(
      `SELECT
        a.id as appointment_id,
        a.status,
        a.notes,
        a.created_at,
        ss.slot_date,
        ss.slot_time,
        an.id as animal_id,
        an.name as animal_name,
        an.species,
        c.full_name as client_name,
        u.email as client_email,
        s.name as service_name
      FROM appointments a
      LEFT JOIN schedule_slots ss ON a.slot_id = ss.id
      JOIN animals an ON a.animal_id = an.id
      JOIN clients c ON a.client_id = c.id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN services s ON s.id = a.service_id
      WHERE ${where.join(' AND ')}
      ORDER BY ss.slot_date DESC NULLS LAST, ss.slot_time DESC NULLS LAST`,
      params
    );
    return result.rows;
  },

  async getVetStats(vetId) {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE a.status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE a.status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE a.status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE a.status = 'cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE ss.slot_date = $2)::int AS today_count,
        COUNT(*) FILTER (WHERE ss.slot_date BETWEEN $2 AND ($2::date + INTERVAL '7 days'))::int AS week_count
       FROM appointments a
       LEFT JOIN schedule_slots ss ON a.slot_id = ss.id
       WHERE a.vet_id = $1`,
      [vetId, today]
    );
    return result.rows[0] || { pending: 0, confirmed: 0, completed: 0, cancelled: 0, today_count: 0, week_count: 0 };
  }
};

module.exports = VisitModel;
