const db = require('../config/db');

const AnimalModel = {
  create: async (clientId, name, species, breed, birthDate, gender, photoUrl = null) => {
    const result = await db.query(
      'INSERT INTO animals (client_id, name, species, breed, birth_date, gender, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [clientId, name, species, breed, birthDate, gender, photoUrl]
    );
    return result.rows[0];
  },

  findByClientId: async (clientId) => {
    const result = await db.query(
      'SELECT * FROM animals WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM animals WHERE id = $1', [id]);
    return result.rows[0];
  },

  update: async (id, data) => {
    const { name, species, breed, birthDate, gender, photoUrl } = data;
    const result = await db.query(
      'UPDATE animals SET name = $1, species = $2, breed = $3, birth_date = $4, gender = $5, photo_url = $6 WHERE id = $7 RETURNING *',
      [name, species, breed, birthDate, gender, photoUrl, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await db.query('DELETE FROM animals WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  findAll: async () => {
    const result = await db.query('SELECT * FROM animals ORDER BY created_at DESC');
    return result.rows;
  },

  getAll: async () => {
    const result = await db.query('SELECT * FROM animals ORDER BY created_at DESC');
    return result.rows;
  },

  getAnimalIdFromMedCard: async (medCardId) => {
    const result = await db.query(
      'SELECT animal_id FROM med_cards WHERE id = $1',
      [medCardId]
    );
    return result.rows[0]?.animal_id;
  },
};

module.exports = AnimalModel;
