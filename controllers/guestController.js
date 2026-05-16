const db = require('../config/db');

const getHome = async (req, res) => {
  try {
    res.render('guest/index', {
      pageTitle: 'Ветеринарная клиника',
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/404');
  }
};

module.exports = {
  getHome,
};
