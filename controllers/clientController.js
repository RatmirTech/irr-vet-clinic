const ClientModel = require('../models/clientModel');
const AnimalModel = require('../models/animalModel');
const db = require('../config/db');

const clientController = {
  getDashboard: async (req, res) => {
    try {
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      const animals = await AnimalModel.findByClientId(client.id);

      const appointmentsResult = await db.query(
        `SELECT a.id, a.status, a.created_at, ss.slot_date, ss.slot_time,
                v.full_name as vet_name, s.name as service_name, an.name as animal_name
         FROM appointments a
         LEFT JOIN vets v ON a.vet_id = v.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN animals an ON an.id = a.animal_id
         LEFT JOIN schedule_slots ss ON ss.id = a.slot_id
         WHERE a.client_id = $1 AND a.status != 'cancelled'
         ORDER BY a.created_at DESC LIMIT 5`,
        [client.id]
      );

      const visitsResult = await db.query(
        `SELECT v.id, v.visit_date, v.diagnosis, v.treatment,
                an.id as animal_id, an.name as animal_name,
                vt.full_name as vet_name,
                (SELECT COUNT(*)::int FROM visit_photos WHERE visit_id = v.id) AS photo_count,
                (SELECT photo_url FROM visit_photos WHERE visit_id = v.id ORDER BY created_at LIMIT 1) AS first_photo
         FROM visits v
         JOIN med_cards mc ON mc.id = v.med_card_id
         JOIN animals an ON an.id = mc.animal_id
         JOIN vets vt ON vt.id = v.vet_id
         WHERE an.client_id = $1
         ORDER BY v.visit_date DESC, v.created_at DESC
         LIMIT 5`,
        [client.id]
      );

      const statsResult = await db.query(
        `SELECT
          COUNT(DISTINCT a.id)::int AS total_appointments,
          COUNT(*) FILTER (WHERE a.status = 'pending')::int AS pending_appointments,
          COUNT(*) FILTER (WHERE a.status = 'confirmed')::int AS confirmed_appointments
         FROM appointments a WHERE a.client_id = $1`,
        [client.id]
      );

      res.render('client/dashboard', {
        pageTitle: 'Мой кабинет',
        fullName: client.full_name || req.session.fullName,
        client,
        animals,
        appointments: appointmentsResult.rows,
        recentVisits: visitsResult.rows,
        stats: statsResult.rows[0] || { total_appointments: 0, pending_appointments: 0, confirmed_appointments: 0 },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке дашборда');
    }
  },

  getProfile: async (req, res) => {
    try {
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      const userResult = await db.query('SELECT email FROM users WHERE id = $1', [req.session.userId]);
      if (userResult.rows.length) client.email = userResult.rows[0].email;

      res.render('client/profile', {
        pageTitle: 'Профиль',
        client,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке профиля');
    }
  },

  postProfile: async (req, res) => {
    try {
      const { fullName, phone } = req.body;
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      if (!fullName) {
        return res.status(400).render('client/profile', {
          pageTitle: 'Профиль',
          error: 'ФИО обязательно',
          client,
        });
      }

      const updated = await ClientModel.updateProfile(client.id, fullName, phone, client.avatar_url);
      req.session.fullName = fullName;

      res.redirect('/client/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при обновлении профиля');
    }
  },
};

module.exports = clientController;
