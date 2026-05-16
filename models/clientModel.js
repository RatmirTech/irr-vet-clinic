const db = require('../config/db');

const ClientModel = {
  create: async (userId, fullName, phone = null, avatarUrl = null) => {
    const result = await db.query(
      'INSERT INTO clients (user_id, full_name, phone, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, fullName, phone, avatarUrl]
    );
    return result.rows[0];
  },

  findByUserId: async (userId) => {
    const result = await db.query('SELECT * FROM clients WHERE user_id = $1', [userId]);
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0];
  },

  updateProfile: async (clientId, fullName, phone, avatarUrl) => {
    const result = await db.query(
      'UPDATE clients SET full_name = $1, phone = $2, avatar_url = $3 WHERE id = $4 RETURNING *',
      [fullName, phone, avatarUrl, clientId]
    );
    return result.rows[0];
  },

  getAll: async () => {
    const result = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
    return result.rows;
  },

  deleteById: async (id) => {
    const result = await db.query('DELETE FROM clients WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = ClientModel;
