const db = require('../config/db');

const VetModel = {
  findAll: async () => {
    const result = await db.query('SELECT * FROM vets ORDER BY created_at DESC');
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM vets WHERE id = $1', [id]);
    return result.rows[0];
  },

  findByUserId: async (userId) => {
    const result = await db.query('SELECT * FROM vets WHERE user_id = $1', [userId]);
    return result.rows[0];
  },

  create: async (userId, fullName, specialization, experience, photoUrl, bio) => {
    const result = await db.query(
      'INSERT INTO vets (user_id, full_name, specialization, experience, photo_url, bio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, fullName, specialization, experience, photoUrl, bio]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { fullName, specialization, experience, photoUrl, bio } = data;
    const result = await db.query(
      'UPDATE vets SET full_name = $1, specialization = $2, experience = $3, photo_url = $4, bio = $5 WHERE id = $6 RETURNING *',
      [fullName, specialization, experience, photoUrl, bio, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await db.query('DELETE FROM vets WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = VetModel;
