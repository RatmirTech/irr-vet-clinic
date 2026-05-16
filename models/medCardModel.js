const pool = require('../config/db');

const MedCardModel = {
  async getByAnimalId(animalId) {
    const result = await pool.query(
      'SELECT * FROM med_cards WHERE animal_id = $1',
      [animalId]
    );
    return result.rows[0];
  },

  async getByAnimalIdWithDetails(animalId) {
    const result = await pool.query(
      `SELECT
        mc.id,
        mc.animal_id,
        mc.created_at,
        a.name as animal_name,
        a.species,
        a.breed,
        c.full_name as client_name,
        c.id as client_id
      FROM med_cards mc
      JOIN animals a ON mc.animal_id = a.id
      JOIN clients c ON a.client_id = c.id
      WHERE mc.animal_id = $1`,
      [animalId]
    );
    return result.rows[0];
  },

  async create(animalId) {
    const result = await pool.query(
      'INSERT INTO med_cards (animal_id) VALUES ($1) RETURNING *',
      [animalId]
    );
    return result.rows[0];
  },

  async getOrCreate(animalId) {
    let medCard = await this.getByAnimalId(animalId);
    if (!medCard) {
      medCard = await this.create(animalId);
    }
    return medCard;
  },

  async getAllForClient(clientId) {
    const result = await pool.query(
      `SELECT
        mc.id,
        mc.animal_id,
        a.name as animal_name,
        a.species,
        a.photo_url,
        COUNT(v.id) as visit_count
      FROM med_cards mc
      JOIN animals a ON mc.animal_id = a.id
      LEFT JOIN visits v ON mc.id = v.med_card_id
      WHERE a.client_id = $1
      GROUP BY mc.id, mc.animal_id, a.name, a.species, a.photo_url
      ORDER BY a.name`,
      [clientId]
    );
    return result.rows;
  }
};

module.exports = MedCardModel;
