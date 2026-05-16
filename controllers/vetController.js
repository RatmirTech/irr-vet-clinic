const vetController = {
  getDashboard: async (req, res) => {
    try {
      res.render('vet/dashboard', {
        pageTitle: 'Мой кабинет - Ветеринар',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке дашборда');
    }
  },

  getSchedule: async (req, res) => {
    try {
      res.render('vet/schedule', {
        pageTitle: 'Расписание',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке расписания');
    }
  },
};

module.exports = vetController;
