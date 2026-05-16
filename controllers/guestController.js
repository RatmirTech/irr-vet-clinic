const VetModel = require('../models/vetModel');
const ServiceModel = require('../models/serviceModel');

const guestController = {
  getHome: async (req, res) => {
    try {
      const vets = await VetModel.findAll();
      const services = await ServiceModel.findAll();

      res.render('guest/index', {
        pageTitle: 'Ветеринарная клиника',
        featuredVets: vets.slice(0, 3),
        featuredServices: services.slice(0, 3),
      });
    } catch (err) {
      console.error(err);
      res.render('guest/index', {
        pageTitle: 'Ветеринарная клиника',
        featuredVets: [],
        featuredServices: [],
      });
    }
  },

  getVets: async (req, res) => {
    try {
      const vets = await VetModel.findAll();

      res.render('guest/vets', {
        pageTitle: 'Наши ветеринары',
        vets,
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('errors/404');
    }
  },

  getVetDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const vet = await VetModel.findById(id);

      if (!vet) {
        return res.status(404).render('errors/404');
      }

      res.render('guest/vetDetail', {
        pageTitle: `${vet.full_name} - Ветеринар`,
        vet,
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('errors/404');
    }
  },

  getServices: async (req, res) => {
    try {
      const services = await ServiceModel.findAll();

      res.render('guest/services', {
        pageTitle: 'Наши услуги',
        services,
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('errors/404');
    }
  },
};

module.exports = guestController;
