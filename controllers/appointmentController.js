const AppointmentModel = require('../models/appointmentModel');
const ClientModel = require('../models/clientModel');
const VetModel = require('../models/vetModel');
const AnimalModel = require('../models/animalModel');
const ServiceModel = require('../models/serviceModel');

const appointmentController = {
  getAppointments: async (req, res) => {
    try {
      const { status } = req.query;
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      let appointments = await AppointmentModel.findByClientId(client.id);

      if (status && status !== 'all') {
        appointments = appointments.filter((apt) => apt.status === status);
      }

      res.render('client/appointments', {
        pageTitle: 'Мои записи',
        appointments,
        selectedStatus: status || 'all',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке записей');
    }
  },

  getNewAppointment: async (req, res) => {
    try {
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      const vets = await VetModel.findAll();
      const services = await ServiceModel.findAll();
      const animals = await AnimalModel.findByClientId(client.id);

      res.render('client/newAppointment', {
        pageTitle: 'Новая запись',
        vets,
        services,
        animals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке формы');
    }
  },

  postAppointment: async (req, res) => {
    try {
      const { vetId, animalId, serviceId, slotId, notes } = req.body;
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      if (!vetId || !animalId || !slotId) {
        return res.status(400).send('Заполните все обязательные поля');
      }

      const appointment = await AppointmentModel.create(
        client.id,
        vetId,
        animalId,
        slotId,
        serviceId || null,
        notes || null
      );

      res.redirect('/client/appointments');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при создании записи');
    }
  },

  cancelAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await AppointmentModel.findById(id);

      if (!appointment) {
        return res.status(404).send('Запись не найдена');
      }

      const client = await ClientModel.findByUserId(req.session.userId);
      if (appointment.client_id !== client.id) {
        return res.status(403).render('errors/403');
      }

      await AppointmentModel.cancel(id);

      res.redirect('/client/appointments');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при отмене записи');
    }
  },

  confirmAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await AppointmentModel.findById(id);

      if (!appointment) {
        return res.status(404).send('Запись не найдена');
      }

      if (appointment.vet_id !== (await VetModel.findByUserId(req.session.userId))?.id) {
        return res.status(403).render('errors/403');
      }

      await AppointmentModel.updateStatus(id, 'confirmed');

      res.redirect('/vet/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при подтверждении записи');
    }
  },

  getAppointmentDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await AppointmentModel.findById(id);

      if (!appointment) {
        return res.status(404).send('Запись не найдена');
      }

      res.render('vet/appointmentDetail', {
        pageTitle: 'Детали приёма',
        appointment,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },
};

module.exports = appointmentController;
