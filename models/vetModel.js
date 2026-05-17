const db = require('../config/db');

const VetModel = {
  findAll: async (filters = {}) => {
    const { search, specialization, sortBy } = filters;
    const params = [];
    const where = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`LOWER(v.full_name) LIKE $${params.length}`);
    }
    if (specialization) {
      params.push(specialization);
      where.push(`v.specialization = $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const order = sortBy === 'experience_desc' ? 'v.experience DESC NULLS LAST'
                : sortBy === 'experience_asc'  ? 'v.experience ASC NULLS LAST'
                : sortBy === 'name_asc'        ? 'v.full_name ASC'
                : sortBy === 'name_desc'       ? 'v.full_name DESC'
                                               : 'v.created_at DESC';

    const result = await db.query(
      `SELECT v.*, u.email FROM vets v JOIN users u ON u.id = v.user_id ${whereClause} ORDER BY ${order}`,
      params
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query(
      'SELECT v.*, u.email FROM vets v JOIN users u ON u.id = v.user_id WHERE v.id = $1',
      [id]
    );
    return result.rows[0];
  },

  getAllSpecializations: async () => {
    const result = await db.query(
      `SELECT DISTINCT specialization FROM vets WHERE specialization IS NOT NULL AND specialization <> '' ORDER BY specialization`
    );
    return result.rows.map(r => r.specialization);
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
