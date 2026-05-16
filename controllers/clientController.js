const ClientModel = require('../models/clientModel');

const clientController = {
  getDashboard: async (req, res) => {
    try {
      const client = await ClientModel.findByUserId(req.session.userId);

      res.render('client/dashboard', {
        pageTitle: 'Мой кабинет',
        fullName: client?.full_name || req.session.fullName,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке дашборда');
    }
  },

  getProfile: async (req, res) => {
    try {
      const client = await ClientModel.findByUserId(req.session.userId);

      res.render('client/profile', {
        pageTitle: 'Профиль',
        client: client || {},
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
