const AppointmentModel = require('../models/appointmentModel');
const VisitModel = require('../models/visitModel');
const ScheduleModel = require('../models/scheduleModel');

const vetController = {
  getDashboard: async (req, res) => {
    try {
      const vetId = req.session.userId;
      const upcomingAppointments = await VisitModel.getVetUpcomingAppointments(vetId, 5);

      res.render('vet/dashboard', {
        pageTitle: 'Мой кабинет - Ветеринар',
        upcomingAppointments
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading dashboard' });
    }
  },

  getSchedule: async (req, res) => {
    try {
      const vetId = req.session.userId;
      const { date } = req.query;
      const selectedDate = date || new Date().toISOString().split('T')[0];

      const slots = await ScheduleModel.getVetSlotsByDate(vetId, selectedDate);

      res.render('vet/schedule', {
        pageTitle: 'Расписание',
        selectedDate,
        slots
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading schedule' });
    }
  }
};

module.exports = vetController;
