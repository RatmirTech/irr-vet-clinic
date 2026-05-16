const db = require('../config/db');
const UserModel = require('../models/userModel');
const VetModel = require('../models/vetModel');
const ClientModel = require('../models/clientModel');
const ServiceModel = require('../models/serviceModel');
const ScheduleModel = require('../models/scheduleModel');

const adminController = {
  getDashboard: async (req, res) => {
    try {
      const vetsCount = await db.query('SELECT COUNT(*) as count FROM vets');
      const clientsCount = await db.query('SELECT COUNT(*) as count FROM clients');
      const servicesCount = await db.query('SELECT COUNT(*) as count FROM services');
      const appointmentsCount = await db.query(
        "SELECT COUNT(*) as count FROM appointments WHERE DATE(created_at) = CURRENT_DATE"
      );

      res.render('admin/dashboard', {
        pageTitle: 'Панель администратора',
        stats: {
          vets: vetsCount.rows[0].count,
          clients: clientsCount.rows[0].count,
          services: servicesCount.rows[0].count,
          appointments: appointmentsCount.rows[0].count,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке дашборда');
    }
  },

  getVets: async (req, res) => {
    try {
      const vets = await VetModel.findAll();
      res.render('admin/vets', {
        pageTitle: 'Управление ветеринарами',
        vets,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке списка ветеринаров');
    }
  },

  getNewVet: async (req, res) => {
    try {
      res.render('admin/vetForm', {
        pageTitle: 'Добавить ветеринара',
        vet: null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postVet: async (req, res) => {
    try {
      const { fullName, email, password, specialization, experience, bio } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).render('admin/vetForm', {
          pageTitle: 'Добавить ветеринара',
          error: 'Заполните обязательные поля',
        });
      }

      const passwordHash = await UserModel.hashPassword(password);
      const user = await UserModel.create(email, passwordHash, 'vet');

      const photoUrl = req.file ? `/uploads/vets/${req.file.filename}` : null;
      const vet = await VetModel.create(
        user.id,
        fullName,
        specialization,
        parseInt(experience) || 0,
        photoUrl,
        bio
      );

      res.redirect('/admin/vets');
    } catch (err) {
      console.error(err);
      res.status(500).render('admin/vetForm', {
        pageTitle: 'Добавить ветеринара',
        error: 'Ошибка при создании ветеринара',
      });
    }
  },

  getEditVet: async (req, res) => {
    try {
      const { id } = req.params;
      const vet = await VetModel.findById(id);

      if (!vet) {
        return res.status(404).send('Ветеринар не найден');
      }

      res.render('admin/vetForm', {
        pageTitle: 'Редактировать ветеринара',
        vet,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postUpdateVet: async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, specialization, experience, bio } = req.body;

      const vet = await VetModel.findById(id);
      if (!vet) {
        return res.status(404).send('Ветеринар не найден');
      }

      const photoUrl = req.file ? `/uploads/vets/${req.file.filename}` : vet.photo_url;

      await VetModel.update(id, {
        fullName,
        specialization,
        experience: parseInt(experience) || 0,
        photoUrl,
        bio,
      });

      res.redirect('/admin/vets');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при обновлении');
    }
  },

  postDeleteVet: async (req, res) => {
    try {
      const { id } = req.params;
      await VetModel.delete(id);
      res.redirect('/admin/vets');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при удалении');
    }
  },

  getServices: async (req, res) => {
    try {
      const services = await ServiceModel.findAll();
      res.render('admin/services', {
        pageTitle: 'Управление услугами',
        services,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке списка услуг');
    }
  },

  getNewService: async (req, res) => {
    try {
      res.render('admin/serviceForm', {
        pageTitle: 'Добавить услугу',
        service: null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postService: async (req, res) => {
    try {
      const { name, description, price, durationMin } = req.body;

      if (!name || !price) {
        return res.status(400).render('admin/serviceForm', {
          pageTitle: 'Добавить услугу',
          error: 'Заполните обязательные поля',
        });
      }

      const photoUrl = req.file ? `/uploads/services/${req.file.filename}` : null;

      await ServiceModel.create(name, description, parseFloat(price), parseInt(durationMin) || 30, photoUrl);

      res.redirect('/admin/services');
    } catch (err) {
      console.error(err);
      res.status(500).render('admin/serviceForm', {
        pageTitle: 'Добавить услугу',
        error: 'Ошибка при создании услуги',
      });
    }
  },

  getEditService: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await ServiceModel.findById(id);

      if (!service) {
        return res.status(404).send('Услуга не найдена');
      }

      res.render('admin/serviceForm', {
        pageTitle: 'Редактировать услугу',
        service,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postUpdateService: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, durationMin } = req.body;

      const service = await ServiceModel.findById(id);
      if (!service) {
        return res.status(404).send('Услуга не найдена');
      }

      const photoUrl = req.file ? `/uploads/services/${req.file.filename}` : service.photo_url;

      await ServiceModel.update(id, {
        name,
        description,
        price: parseFloat(price),
        durationMin: parseInt(durationMin) || 30,
        photoUrl,
      });

      res.redirect('/admin/services');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при обновлении');
    }
  },

  postDeleteService: async (req, res) => {
    try {
      const { id } = req.params;
      await ServiceModel.delete(id);
      res.redirect('/admin/services');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при удалении');
    }
  },

  getSchedule: async (req, res) => {
    try {
      const vets = await VetModel.findAll();
      res.render('admin/schedule', {
        pageTitle: 'Управление расписанием',
        vets,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке расписания');
    }
  },

  postGenerateSlots: async (req, res) => {
    try {
      const { vetId, date, times } = req.body;

      if (!vetId || !date || !times || times.length === 0) {
        return res.status(400).send('Заполните все поля');
      }

      const timeArray = Array.isArray(times) ? times : [times];

      for (const time of timeArray) {
        await ScheduleModel.createSlot(vetId, date, time, true);
      }

      res.redirect('/admin/schedule');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при генерации слотов');
    }
  },

  getClients: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT c.*, u.email,
           (SELECT COUNT(*) FROM animals WHERE client_id = c.id) as animal_count
         FROM clients c
         JOIN users u ON c.user_id = u.id
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const totalResult = await db.query('SELECT COUNT(*) as count FROM clients');
      const totalPages = Math.ceil(totalResult.rows[0].count / limit);

      res.render('admin/clients', {
        pageTitle: 'Управление клиентами',
        clients: result.rows,
        pagination: {
          page,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Ошибка при загрузке списка клиентов' });
    }
  },
};

module.exports = adminController;
