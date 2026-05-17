const db = require('../config/db');
const UserModel = require('../models/userModel');
const VetModel = require('../models/vetModel');
const ClientModel = require('../models/clientModel');
const ServiceModel = require('../models/serviceModel');
const ScheduleModel = require('../models/scheduleModel');

const bcrypt = require('bcryptjs');

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
      const { search, specialization, sortBy } = req.query;
      const vets = await VetModel.findAll({ search, specialization, sortBy });
      const specializations = await VetModel.getAllSpecializations();

      const statusCounts = await db.query(
        `SELECT vet_id, status, COUNT(*)::int AS count FROM appointments GROUP BY vet_id, status`
      );
      const countsByVet = {};
      for (const row of statusCounts.rows) {
        if (!countsByVet[row.vet_id]) countsByVet[row.vet_id] = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
        countsByVet[row.vet_id][row.status] = row.count;
      }

      res.render('admin/vets', {
        pageTitle: 'Управление ветеринарами',
        vets,
        specializations,
        countsByVet,
        filters: { search: search || '', specialization: specialization || '', sortBy: sortBy || '' },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке списка ветеринаров');
    }
  },

  getVetRequests: async (req, res) => {
    try {
      const { id } = req.params;
      const vet = await VetModel.findById(id);
      if (!vet) return res.status(404).send('Ветеринар не найден');

      const result = await db.query(
        `SELECT a.id, a.status, a.notes, a.created_at,
                ss.slot_date, ss.slot_time,
                an.name as animal_name, an.species,
                c.full_name as client_name, u.email as client_email,
                s.name as service_name
         FROM appointments a
         JOIN animals an ON an.id = a.animal_id
         JOIN clients c ON c.id = a.client_id
         JOIN users u ON u.id = c.user_id
         LEFT JOIN schedule_slots ss ON ss.id = a.slot_id
         LEFT JOIN services s ON s.id = a.service_id
         WHERE a.vet_id = $1
         ORDER BY a.created_at DESC`,
        [id]
      );
      res.render('admin/vetRequests', {
        pageTitle: `Заявки: ${vet.full_name}`,
        vet,
        appointments: result.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке заявок');
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
      const clinic = require('../config/clinic');
      res.render('admin/schedule', {
        pageTitle: 'Управление расписанием',
        vets,
        clinic: {
          openTime: clinic.OPEN_TIME,
          closeTime: clinic.CLOSE_TIME,
          stepSeconds: clinic.STEP_SECONDS,
          times: clinic.buildSlotTimes(),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке расписания');
    }
  },

  getVetSchedule: async (req, res) => {
    try {
      const vets = await VetModel.findAll();
      const { vetId, month } = req.query;

      const now = new Date();
      const targetDate = month ? new Date(month + '-01') : new Date(now.getFullYear(), now.getMonth(), 1);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); 

      let appointments = [];
      let selectedVet = null;
      let freeSlotsByDay = {};

      if (vetId) {
        selectedVet = vets.find(v => v.id == vetId);
        const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

        const result = await db.query(
          `SELECT a.id, a.status, a.notes,
                  ss.slot_date, ss.slot_time,
                  an.name as animal_name, an.species,
                  c.full_name as client_name,
                  s.name as service_name
           FROM appointments a
           JOIN schedule_slots ss ON ss.id = a.slot_id
           JOIN animals an ON an.id = a.animal_id
           JOIN clients c ON c.id = a.client_id
           LEFT JOIN services s ON s.id = a.service_id
           WHERE a.vet_id = $1 AND ss.slot_date BETWEEN $2 AND $3
           ORDER BY ss.slot_date, ss.slot_time`,
          [vetId, startDate, endDate]
        );
        appointments = result.rows;

        const freeSlotsResult = await db.query(
          `SELECT ss.slot_date, ss.slot_time
           FROM schedule_slots ss
           WHERE ss.vet_id = $1
             AND ss.slot_date BETWEEN $2 AND $3
             AND ss.is_available = TRUE
             AND ss.id NOT IN (
               SELECT slot_id FROM appointments
               WHERE slot_id IS NOT NULL AND status IN ('pending', 'confirmed')
             )
           ORDER BY ss.slot_date, ss.slot_time`,
          [vetId, startDate, endDate]
        );
        for (const row of freeSlotsResult.rows) {
          const key = new Date(row.slot_date).toISOString().slice(0, 10);
          if (!freeSlotsByDay[key]) freeSlotsByDay[key] = [];
          freeSlotsByDay[key].push(String(row.slot_time).slice(0, 5));
        }
      }

      const byDay = {};
      for (const appt of appointments) {
        const day = new Date(appt.slot_date).getDate();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(appt);
      }

      const monthLabel = targetDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      const shiftMonth = (offset) => {
        const m = monthIndex + offset;
        const y = year + Math.floor(m / 12);
        const mm = ((m % 12) + 12) % 12;
        return `${y}-${String(mm + 1).padStart(2, '0')}`;
      };
      const prevMonth = shiftMonth(-1);
      const nextMonth = shiftMonth(1);

      res.render('admin/vetSchedule', {
        pageTitle: 'Расписание ветеринара',
        vets,
        selectedVetId: vetId || '',
        selectedVet,
        byDay,
        freeSlotsByDay,
        daysInMonth,
        firstDayOfWeek: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1,
        monthLabel,
        currentMonth: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        prevMonth,
        nextMonth,
        today: now.getDate(),
        isCurrentMonth: year === now.getFullYear() && monthIndex === now.getMonth(),
        year,
        monthIndex,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке расписания');
    }
  },

  postGenerateSlots: async (req, res) => {
    try {
      const { vetId, dateFrom, dateTo, times, excludeDates, skipWeekends } = req.body;

      if (!vetId || !dateFrom || !times || times.length === 0) {
        req.flash('error', 'Заполните: ветеринара, дату начала и хотя бы один слот');
        return res.redirect('/admin/schedule');
      }

      const timeArray = Array.isArray(times) ? times : [times];
      const excludeSet = new Set(
        (Array.isArray(excludeDates) ? excludeDates : (excludeDates ? [excludeDates] : []))
          .filter(Boolean)
      );

      const start = new Date(dateFrom);
      const end = dateTo ? new Date(dateTo) : new Date(dateFrom);
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);
        const dow = d.getDay(); 
        if (skipWeekends && (dow === 0 || dow === 6)) continue;
        if (excludeSet.has(iso)) continue;
        dates.push(iso);
      }

      let created = 0;
      let skipped = 0;
      for (const date of dates) {
        for (const time of timeArray) {
          const slot = await ScheduleModel.createSlot(vetId, date, time, true);
          if (slot) created++; else skipped++;
        }
      }

      req.flash('success', `Создано слотов: ${created}, пропущено (уже существуют): ${skipped}`);
      res.redirect('/admin/schedule');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Ошибка при генерации слотов');
      res.redirect('/admin/schedule');
    }
  },

  postImportSlots: async (req, res) => {
    try {
      if (!req.file) {
        req.flash('error', 'Файл не загружен');
        return res.redirect('/admin/schedule');
      }

      const XLSX = require('xlsx');
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows.length) {
        req.flash('error', 'Файл пустой или формат не распознан');
        return res.redirect('/admin/schedule');
      }

      const vetsResult = await db.query(
        `SELECT v.id, u.email FROM vets v JOIN users u ON u.id = v.user_id`
      );
      const emailToVetId = {};
      const idSet = new Set();
      for (const v of vetsResult.rows) {
        emailToVetId[v.email.toLowerCase()] = v.id;
        idSet.add(v.id);
      }

      let created = 0;
      let skipped = 0;
      const errors = [];

      for (const [i, row] of rows.entries()) {
        
        const lower = {};
        for (const k of Object.keys(row)) lower[k.trim().toLowerCase()] = row[k];

        const vetIdRaw = lower['vet_id'] || lower['id_vet'] || lower['vetid'] || lower['ид_врача'];
        const vetEmail = (lower['email'] || lower['vet_email'] || lower['врач'] || '').toString().trim().toLowerCase();
        const dateRaw = lower['date'] || lower['дата'] || lower['slot_date'];
        const timeRaw = lower['time'] || lower['время'] || lower['slot_time'];

        let vetId = null;
        if (vetIdRaw && idSet.has(parseInt(vetIdRaw))) {
          vetId = parseInt(vetIdRaw);
        } else if (vetEmail && emailToVetId[vetEmail]) {
          vetId = emailToVetId[vetEmail];
        }
        if (!vetId) { errors.push(`Строка ${i + 2}: ветеринар не найден`); continue; }

        let dateStr = null;
        if (dateRaw instanceof Date) {
          dateStr = dateRaw.toISOString().slice(0, 10);
        } else if (typeof dateRaw === 'number') {
          
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const d = new Date(excelEpoch.getTime() + dateRaw * 86400000);
          dateStr = d.toISOString().slice(0, 10);
        } else if (dateRaw) {
          const d = new Date(String(dateRaw).trim());
          if (!isNaN(d)) dateStr = d.toISOString().slice(0, 10);
        }
        if (!dateStr) { errors.push(`Строка ${i + 2}: некорректная дата`); continue; }

        let timeStr = null;
        if (typeof timeRaw === 'number') {
          
          const totalMin = Math.round(timeRaw * 1440);
          const h = Math.floor(totalMin / 60), m = totalMin % 60;
          timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        } else if (timeRaw) {
          const match = String(timeRaw).trim().match(/^(\d{1,2}):(\d{2})/);
          if (match) timeStr = `${match[1].padStart(2, '0')}:${match[2]}`;
        }
        if (!timeStr) { errors.push(`Строка ${i + 2}: некорректное время`); continue; }

        const slot = await ScheduleModel.createSlot(vetId, dateStr, timeStr, true);
        if (slot) created++; else skipped++;
      }

      let msg = `Импорт завершён. Создано: ${created}, пропущено (дубли): ${skipped}`;
      if (errors.length) msg += `. Ошибок: ${errors.length} (${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''})`;
      req.flash(errors.length ? 'warning' : 'success', msg);
      res.redirect('/admin/schedule');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Ошибка импорта: ' + err.message);
      res.redirect('/admin/schedule');
    }
  },

  getImportTemplate: (req, res) => {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const data = [
      ['vet_email', 'date', 'time'],
      ['dr.ivanov@vetclinic.ru', '2026-05-20', '09:00'],
      ['dr.ivanov@vetclinic.ru', '2026-05-20', '09:15'],
      ['dr.petrova@vetclinic.ru', '2026-05-21', '10:00'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Slots');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="schedule_import_template.xlsx"');
    res.send(buffer);
  },

  exportScheduleCSV: async (req, res) => {
    try {
      const { vetId, dateFrom, dateTo } = req.query;
      const params = [];
      const where = [];
      if (vetId) { params.push(vetId); where.push(`ss.vet_id = $${params.length}`); }
      if (dateFrom) { params.push(dateFrom); where.push(`ss.slot_date >= $${params.length}`); }
      if (dateTo) { params.push(dateTo); where.push(`ss.slot_date <= $${params.length}`); }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const result = await db.query(
        `SELECT v.full_name AS vet, ss.slot_date, ss.slot_time, ss.is_available,
                a.status, an.name AS animal, c.full_name AS client
         FROM schedule_slots ss
         JOIN vets v ON v.id = ss.vet_id
         LEFT JOIN appointments a ON a.slot_id = ss.id
         LEFT JOIN animals an ON an.id = a.animal_id
         LEFT JOIN clients c ON c.id = a.client_id
         ${whereClause}
         ORDER BY ss.slot_date, ss.slot_time, v.full_name`,
        params
      );

      const header = 'Ветеринар;Дата;Время;Свободен;Статус;Животное;Клиент\n';
      const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[;"\n]/.test(s) ? `"${s}"` : s;
      };
      const rows = result.rows.map(r => [
        r.vet,
        new Date(r.slot_date).toLocaleDateString('ru-RU'),
        String(r.slot_time).slice(0, 5),
        r.is_available ? 'да' : 'нет',
        r.status || '',
        r.animal || '',
        r.client || '',
      ].map(escape).join(';')).join('\n');

      const csv = '﻿' + header + rows; 
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="schedule_${Date.now()}.csv"`);
      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка экспорта');
    }
  },

  exportScheduleXLSX: async (req, res) => {
    try {
      const { vetId, dateFrom, dateTo } = req.query;
      const params = [];
      const where = [];
      if (vetId) { params.push(vetId); where.push(`ss.vet_id = $${params.length}`); }
      if (dateFrom) { params.push(dateFrom); where.push(`ss.slot_date >= $${params.length}`); }
      if (dateTo) { params.push(dateTo); where.push(`ss.slot_date <= $${params.length}`); }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const result = await db.query(
        `SELECT v.full_name AS vet, u.email AS vet_email, ss.slot_date, ss.slot_time, ss.is_available,
                a.status, an.name AS animal, c.full_name AS client
         FROM schedule_slots ss
         JOIN vets v ON v.id = ss.vet_id
         JOIN users u ON u.id = v.user_id
         LEFT JOIN appointments a ON a.slot_id = ss.id
         LEFT JOIN animals an ON an.id = a.animal_id
         LEFT JOIN clients c ON c.id = a.client_id
         ${whereClause}
         ORDER BY ss.slot_date, ss.slot_time, v.full_name`,
        params
      );

      const XLSX = require('xlsx');
      const data = [['Ветеринар', 'Email', 'Дата', 'Время', 'Свободен', 'Статус', 'Животное', 'Клиент']];
      for (const r of result.rows) {
        data.push([
          r.vet,
          r.vet_email,
          new Date(r.slot_date).toLocaleDateString('ru-RU'),
          String(r.slot_time).slice(0, 5),
          r.is_available ? 'да' : 'нет',
          r.status || '',
          r.animal || '',
          r.client || '',
        ]);
      }
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="schedule_${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка экспорта XLSX');
    }
  },

  getAdmins: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.email, u.is_super_admin, u.created_at,
                ap.full_name, ap.phone, ap.position, ap.photo_url
         FROM users u
         LEFT JOIN admin_profiles ap ON ap.user_id = u.id
         WHERE u.role = 'admin' ORDER BY u.is_super_admin DESC, u.created_at ASC`
      );
      res.render('admin/admins', {
        pageTitle: 'Управление администраторами',
        admins: result.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке администраторов');
    }
  },

  getNewAdmin: (req, res) => {
    res.render('admin/adminForm', { pageTitle: 'Добавить администратора', adminUser: null });
  },

  getEditAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT u.id, u.email, u.is_super_admin,
                ap.full_name, ap.phone, ap.position, ap.photo_url
         FROM users u LEFT JOIN admin_profiles ap ON ap.user_id = u.id
         WHERE u.id = $1`, [id]
      );
      const adminUser = result.rows[0];
      if (!adminUser) return res.status(404).send('Администратор не найден');
      res.render('admin/adminForm', { pageTitle: 'Редактировать администратора', adminUser });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postAdmin: async (req, res) => {
    try {
      const { email, password, fullName, phone, position } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).render('admin/adminForm', {
          pageTitle: 'Добавить администратора',
          adminUser: null,
          error: 'Email, пароль и ФИО обязательны',
        });
      }
      const hash = await bcrypt.hash(password, 10);
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, role, is_super_admin) VALUES ($1, $2, 'admin', FALSE) RETURNING id`,
        [email, hash]
      );
      const userId = userResult.rows[0].id;
      const photoUrl = req.file ? `/uploads/admins/${req.file.filename}` : null;
      await db.query(
        `INSERT INTO admin_profiles (user_id, full_name, phone, position, photo_url) VALUES ($1, $2, $3, $4, $5)`,
        [userId, fullName, phone || null, position || null, photoUrl]
      );
      req.flash('success', 'Администратор успешно добавлен');
      res.redirect('/admin/admins');
    } catch (err) {
      console.error(err);
      res.status(500).render('admin/adminForm', {
        pageTitle: 'Добавить администратора',
        adminUser: null,
        error: 'Ошибка при создании администратора',
      });
    }
  },

  postUpdateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, phone, position } = req.body;
      const existing = await db.query(`SELECT photo_url FROM admin_profiles WHERE user_id = $1`, [id]);
      const photoUrl = req.file
        ? `/uploads/admins/${req.file.filename}`
        : (existing.rows[0] ? existing.rows[0].photo_url : null);
      await db.query(
        `INSERT INTO admin_profiles (user_id, full_name, phone, position, photo_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET full_name=$2, phone=$3, position=$4, photo_url=$5`,
        [id, fullName, phone || null, position || null, photoUrl]
      );
      req.flash('success', 'Профиль обновлён');
      res.redirect('/admin/admins');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при обновлении');
    }
  },

  postDeleteAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`SELECT is_super_admin FROM users WHERE id = $1`, [id]);
      if (!result.rows[0] || result.rows[0].is_super_admin) {
        req.flash('error', 'Невозможно удалить супер-администратора');
        return res.redirect('/admin/admins');
      }
      await db.query(`DELETE FROM users WHERE id = $1 AND is_super_admin = FALSE`, [id]);
      req.flash('success', 'Администратор удалён');
      res.redirect('/admin/admins');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при удалении');
    }
  },

  getMedCards: async (req, res) => {
    try {
      const search = (req.query.search || '').trim();
      const params = [];
      let where = '';
      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        where = `WHERE LOWER(an.name) LIKE $1 OR LOWER(c.full_name) LIKE $1`;
      }
      const result = await db.query(
        `SELECT an.id as animal_id, an.name as animal_name, an.species, an.breed,
                c.full_name as client_name, u.email as client_email,
                mc.id as med_card_id,
                (SELECT COUNT(*) FROM visits WHERE med_card_id = mc.id)::int AS visits_count,
                (SELECT MAX(visit_date) FROM visits WHERE med_card_id = mc.id) AS last_visit
         FROM animals an
         JOIN clients c ON c.id = an.client_id
         JOIN users u ON u.id = c.user_id
         LEFT JOIN med_cards mc ON mc.animal_id = an.id
         ${where}
         ORDER BY an.name`,
        params
      );
      res.render('admin/medcards', {
        pageTitle: 'Медицинские карты',
        records: result.rows,
        search,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке медкарт');
    }
  },

  getMedCardDetail: async (req, res) => {
    try {
      const { animalId } = req.params;
      const animalResult = await db.query(
        `SELECT an.*, c.full_name as client_name, u.email as client_email, u.id as client_user_id
         FROM animals an
         JOIN clients c ON c.id = an.client_id
         JOIN users u ON u.id = c.user_id
         WHERE an.id = $1`,
        [animalId]
      );
      const animal = animalResult.rows[0];
      if (!animal) return res.status(404).send('Животное не найдено');

      const visits = await db.query(
        `SELECT v.*, vt.full_name as vet_name
         FROM visits v
         JOIN med_cards mc ON mc.id = v.med_card_id
         JOIN vets vt ON vt.id = v.vet_id
         WHERE mc.animal_id = $1
         ORDER BY v.visit_date DESC, v.created_at DESC`,
        [animalId]
      );

      const VisitModel = require('../models/visitModel');
      const photosByVisit = await VisitModel.getPhotosForVisits(visits.rows.map(v => v.id));

      res.render('admin/medcard', {
        pageTitle: `Медкарта: ${animal.name}`,
        animal,
        visits: visits.rows,
        photosByVisit,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  getAnimals: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT a.*, c.full_name as owner_name, u.email as owner_email
         FROM animals a
         JOIN clients c ON c.id = a.client_id
         JOIN users u ON u.id = c.user_id
         ORDER BY a.created_at DESC`
      );
      res.render('admin/animals', {
        pageTitle: 'Управление животными',
        animals: result.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке животных');
    }
  },

  getEditAnimal: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT a.*, c.full_name as owner_name FROM animals a JOIN clients c ON c.id = a.client_id WHERE a.id = $1`, [id]
      );
      const animal = result.rows[0];
      if (!animal) return res.status(404).send('Животное не найдено');
      res.render('admin/animalEditForm', { pageTitle: 'Редактировать животное', animal });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postUpdateAnimal: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, species, breed, birthDate, gender } = req.body;
      const existing = await db.query(`SELECT photo_url FROM animals WHERE id = $1`, [id]);
      const photoUrl = req.file
        ? `/uploads/animals/${req.file.filename}`
        : (existing.rows[0] ? existing.rows[0].photo_url : null);
      await db.query(
        `UPDATE animals SET name=$1, species=$2, breed=$3, birth_date=$4, gender=$5, photo_url=$6 WHERE id=$7`,
        [name, species, breed, birthDate || null, gender, photoUrl, id]
      );
      req.flash('success', 'Информация о животном обновлена');
      res.redirect('/admin/animals');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при обновлении');
    }
  },

  postDeleteAnimal: async (req, res) => {
    try {
      const { id } = req.params;
      await db.query(`DELETE FROM animals WHERE id = $1`, [id]);
      req.flash('success', 'Животное удалено');
      res.redirect('/admin/animals');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при удалении');
    }
  },

  getNewClient: (req, res) => {
    res.render('admin/clientForm', { pageTitle: 'Новый клиент', error: null });
  },

  postNewClient: async (req, res) => {
    try {
      const { email, password, fullName, phone } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).render('admin/clientForm', {
          pageTitle: 'Новый клиент',
          error: 'Email, пароль и ФИО обязательны',
        });
      }
      const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length) {
        return res.status(400).render('admin/clientForm', {
          pageTitle: 'Новый клиент',
          error: 'Email уже зарегистрирован',
        });
      }
      const hash = await bcrypt.hash(password, 10);
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'client') RETURNING id`,
        [email, hash]
      );
      const clientResult = await db.query(
        `INSERT INTO clients (user_id, full_name, phone) VALUES ($1, $2, $3) RETURNING id`,
        [userResult.rows[0].id, fullName, phone || null]
      );
      req.flash('success', `Клиент ${fullName} создан. Пароль: ${password}`);
      res.redirect(`/admin/clients/${clientResult.rows[0].id}/animals/new`);
    } catch (err) {
      console.error(err);
      res.status(500).render('admin/clientForm', { pageTitle: 'Новый клиент', error: 'Ошибка при создании клиента' });
    }
  },

  getNewClientAnimal: async (req, res) => {
    try {
      const { clientId } = req.params;
      const clientResult = await db.query(
        `SELECT c.*, u.email FROM clients c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
        [clientId]
      );
      if (!clientResult.rows.length) return res.status(404).send('Клиент не найден');
      res.render('admin/clientAnimalForm', {
        pageTitle: 'Питомец клиента',
        client: clientResult.rows[0],
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postNewClientAnimal: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, species, breed, birthDate, gender, skipToAppointment } = req.body;
      if (!name || !species) {
        const clientResult = await db.query(
          `SELECT c.*, u.email FROM clients c JOIN users u ON u.id = c.user_id WHERE c.id = $1`, [clientId]
        );
        return res.status(400).render('admin/clientAnimalForm', {
          pageTitle: 'Питомец клиента',
          client: clientResult.rows[0],
          error: 'Кличка и вид обязательны',
        });
      }
      const photoUrl = req.file ? `/uploads/animals/${req.file.filename}` : null;
      const animalResult = await db.query(
        `INSERT INTO animals (client_id, name, species, breed, birth_date, gender, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [clientId, name, species, breed || null, birthDate || null, gender || null, photoUrl]
      );
      const animalId = animalResult.rows[0].id;
      await db.query(`INSERT INTO med_cards (animal_id) VALUES ($1) ON CONFLICT (animal_id) DO NOTHING`, [animalId]);

      req.flash('success', `Питомец "${name}" добавлен`);
      if (skipToAppointment) {
        return res.redirect(`/admin/clients/${clientId}/appointments/new?animalId=${animalId}`);
      }
      res.redirect('/admin/clients');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  getNewClientAppointment: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { animalId } = req.query;
      const clientResult = await db.query(
        `SELECT c.*, u.email FROM clients c JOIN users u ON u.id = c.user_id WHERE c.id = $1`, [clientId]
      );
      if (!clientResult.rows.length) return res.status(404).send('Клиент не найден');

      const animals = await db.query(`SELECT * FROM animals WHERE client_id = $1 ORDER BY name`, [clientId]);
      const vets = await VetModel.findAll();
      const services = await ServiceModel.findAll();

      res.render('admin/clientAppointmentForm', {
        pageTitle: 'Запись на приём',
        client: clientResult.rows[0],
        animals: animals.rows,
        vets,
        services,
        selectedAnimalId: animalId || '',
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postNewClientAppointment: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { vetId, animalId, serviceId, slotId, notes } = req.body;
      if (!vetId || !animalId || !slotId) {
        req.flash('error', 'Выберите ветеринара, животное и слот');
        return res.redirect(`/admin/clients/${clientId}/appointments/new`);
      }
      const slotCheck = await db.query(
        `SELECT id FROM schedule_slots WHERE id = $1 AND is_available = TRUE
         AND id NOT IN (SELECT slot_id FROM appointments WHERE slot_id IS NOT NULL AND status NOT IN ('cancelled'))`,
        [slotId]
      );
      if (!slotCheck.rows.length) {
        req.flash('error', 'Слот уже занят');
        return res.redirect(`/admin/clients/${clientId}/appointments/new`);
      }
      await db.query(
        `INSERT INTO appointments (client_id, vet_id, animal_id, slot_id, service_id, status, notes)
         VALUES ($1, $2, $3, $4, $5, 'confirmed', $6)`,
        [clientId, vetId, animalId, slotId, serviceId || null, notes || null]
      );
      req.flash('success', 'Запись создана и подтверждена');
      res.redirect('/admin/clients');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
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
