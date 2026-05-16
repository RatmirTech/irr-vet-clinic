const db = require('../config/db');

const ServiceModel = {
  findAll: async () => {
    const result = await db.query('SELECT * FROM services ORDER BY created_at DESC');
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0];
  },

  create: async (name, description, price, durationMin, photoUrl) => {
    const result = await db.query(
      'INSERT INTO services (name, description, price, duration_min, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, description, price, durationMin, photoUrl]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { name, description, price, durationMin, photoUrl } = data;
    const result = await db.query(
      'UPDATE services SET name = $1, description = $2, price = $3, duration_min = $4, photo_url = $5 WHERE id = $6 RETURNING *',
      [name, description, price, durationMin, photoUrl, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await db.query('DELETE FROM services WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = ServiceModel;
