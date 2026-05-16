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
        'SELECT a.*, v.full_name as vet_name, s.name as service_name FROM appointments a LEFT JOIN vets v ON a.vet_id = v.id LEFT JOIN services s ON a.service_id = s.id WHERE a.client_id = $1 AND a.status != $2 ORDER BY a.created_at DESC LIMIT 5',
        [client.id, 'cancelled']
      );

      res.render('client/dashboard', {
        pageTitle: 'Мой кабинет',
        fullName: client.full_name || req.session.fullName,
        client,
        animals,
        appointments: appointmentsResult.rows,
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
