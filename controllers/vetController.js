const AppointmentModel = require('../models/appointmentModel');
const VisitModel = require('../models/visitModel');
const ScheduleModel = require('../models/scheduleModel');
const VetModel = require('../models/vetModel');
const db = require('../config/db');

async function getVetFromSession(req) {
  return await VetModel.findByUserId(req.session.userId);
}

const vetController = {
  getDashboard: async (req, res) => {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');

      const upcomingAppointments = await VisitModel.getVetUpcomingAppointments(vet.id, 10);
      const stats = await VisitModel.getVetStats(vet.id);

      const animalsResult = await db.query(
        `SELECT DISTINCT an.id, an.name, an.species
         FROM animals an
         JOIN appointments a ON a.animal_id = an.id
         WHERE a.vet_id = $1
         ORDER BY an.name
         LIMIT 20`,
        [vet.id]
      );

      res.render('vet/dashboard', {
        pageTitle: 'Мой кабинет',
        vet,
        upcomingAppointments,
        stats,
        myAnimals: animalsResult.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке дашборда');
    }
  },

  getAppointments: async (req, res) => {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');

      const { status, dateFrom, dateTo } = req.query;
      const appointments = await VisitModel.getAppointmentsForVet(vet.id, { status, dateFrom, dateTo });

      res.render('vet/appointments', {
        pageTitle: 'Мои приёмы',
        vet,
        appointments,
        filters: { status: status || '', dateFrom: dateFrom || '', dateTo: dateTo || '' },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postCompleteAppointment: async (req, res) => {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');
      const { id } = req.params;
      await db.query(`UPDATE appointments SET status = 'completed' WHERE id = $1 AND vet_id = $2`, [id, vet.id]);
      req.flash('success', 'Приём отмечен как завершённый');
      res.redirect('/vet/appointments');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postCancelAppointment: async (req, res) => {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');
      const { id } = req.params;
      await db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1 AND vet_id = $2`, [id, vet.id]);
      req.flash('success', 'Приём отменён');
      res.redirect('/vet/appointments');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  getSchedule: async (req, res) => {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');

      const { date } = req.query;
      const selectedDate = date || new Date().toISOString().split('T')[0];
      const slots = await ScheduleModel.getVetSlotsByDate(vet.id, selectedDate);

      res.render('vet/schedule', {
        pageTitle: 'Расписание',
        selectedDate,
        slots,
        vet,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке расписания');
    }
  },
};

module.exports = vetController;
