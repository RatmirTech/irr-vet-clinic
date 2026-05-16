const db = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {
  findByEmail: async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  create: async (email, passwordHash, role) => {
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, role]
    );
    return result.rows[0];
  },

  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  verifyPassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },
};

module.exports = UserModel;
