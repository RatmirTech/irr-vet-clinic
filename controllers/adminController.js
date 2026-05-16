const adminController = {
  getDashboard: async (req, res) => {
    try {
      res.render('admin/dashboard', {
        pageTitle: 'Панель администратора',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке дашборда');
    }
  },

  getVets: async (req, res) => {
    try {
      res.render('admin/vets', {
        pageTitle: 'Управление ветеринарами',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке списка ветеринаров');
    }
  },

  getServices: async (req, res) => {
    try {
      res.render('admin/services', {
        pageTitle: 'Управление услугами',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке списка услуг');
    }
  },

  getSchedule: async (req, res) => {
    try {
      res.render('admin/schedule', {
        pageTitle: 'Управление расписанием',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке расписания');
    }
  },

  getClients: async (req, res) => {
    try {
      res.render('admin/clients', {
        pageTitle: 'Управление клиентами',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке списка клиентов');
    }
  },
};

module.exports = adminController;
