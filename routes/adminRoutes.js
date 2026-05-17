const express = require('express');
const router = express.Router();
const { isAdmin, isSuperAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { uploadVetPhoto, uploadServicePhoto, uploadAnimalPhoto, uploadAdminPhoto, uploadScheduleFile } = require('../config/multer');

router.get('/dashboard', isAdmin, adminController.getDashboard);

router.get('/vets', isAdmin, adminController.getVets);
router.get('/vets/new', isAdmin, adminController.getNewVet);
router.post('/vets', isAdmin, (req, res, next) => {
  uploadVetPhoto(req, res, (err) => {
    if (err) {
      return res.status(400).render('admin/vetForm', { pageTitle: 'Добавить ветеринара', vet: null, error: err.message });
    }
    next();
  });
}, adminController.postVet);
router.get('/vets/:id/requests', isAdmin, adminController.getVetRequests);
router.get('/vets/:id/edit', isAdmin, adminController.getEditVet);
router.post('/vets/:id', isAdmin, (req, res, next) => {
  uploadVetPhoto(req, res, (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }
    next();
  });
}, adminController.postUpdateVet);
router.post('/vets/:id/delete', isAdmin, adminController.postDeleteVet);

router.get('/services', isAdmin, adminController.getServices);
router.get('/services/new', isAdmin, adminController.getNewService);
router.post('/services', isAdmin, (req, res, next) => {
  uploadServicePhoto(req, res, (err) => {
    if (err) {
      return res.status(400).render('admin/serviceForm', { error: err.message });
    }
    next();
  });
}, adminController.postService);
router.get('/services/:id/edit', isAdmin, adminController.getEditService);
router.post('/services/:id', isAdmin, (req, res, next) => {
  uploadServicePhoto(req, res, (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }
    next();
  });
}, adminController.postUpdateService);
router.post('/services/:id/delete', isAdmin, adminController.postDeleteService);

router.get('/schedule', isAdmin, adminController.getSchedule);
router.post('/schedule/generate', isAdmin, adminController.postGenerateSlots);
router.get('/schedule/vet', isAdmin, adminController.getVetSchedule);
router.get('/schedule/export', isAdmin, adminController.exportScheduleCSV);
router.get('/schedule/export.xlsx', isAdmin, adminController.exportScheduleXLSX);
router.get('/schedule/import-template', isAdmin, adminController.getImportTemplate);
router.post('/schedule/import', isAdmin, (req, res, next) => {
  uploadScheduleFile(req, res, (err) => {
    if (err) {
      req.flash('error', 'Ошибка загрузки: ' + err.message);
      return res.redirect('/admin/schedule');
    }
    next();
  });
}, adminController.postImportSlots);

router.get('/clients', isAdmin, adminController.getClients);
router.get('/clients/new', isAdmin, adminController.getNewClient);
router.post('/clients/new', isAdmin, adminController.postNewClient);
router.get('/clients/:clientId/animals/new', isAdmin, adminController.getNewClientAnimal);
router.post('/clients/:clientId/animals/new', isAdmin, (req, res, next) => {
  uploadAnimalPhoto(req, res, (err) => {
    if (err) return res.status(400).send(err.message);
    next();
  });
}, adminController.postNewClientAnimal);
router.get('/clients/:clientId/appointments/new', isAdmin, adminController.getNewClientAppointment);
router.post('/clients/:clientId/appointments/new', isAdmin, adminController.postNewClientAppointment);

router.get('/medcards', isAdmin, adminController.getMedCards);
router.get('/medcards/:animalId', isAdmin, adminController.getMedCardDetail);

router.get('/admins', isSuperAdmin, adminController.getAdmins);
router.get('/admins/new', isSuperAdmin, (req, res, next) => {
  uploadAdminPhoto(req, res, (err) => {
    if (err) return res.status(400).render('admin/adminForm', { pageTitle: 'Добавить администратора', adminUser: null, error: err.message });
    next();
  });
}, adminController.getNewAdmin);
router.post('/admins', isSuperAdmin, (req, res, next) => {
  uploadAdminPhoto(req, res, (err) => {
    if (err) return res.status(400).render('admin/adminForm', { pageTitle: 'Добавить администратора', adminUser: null, error: err.message });
    next();
  });
}, adminController.postAdmin);
router.get('/admins/:id/edit', isSuperAdmin, adminController.getEditAdmin);
router.post('/admins/:id', isSuperAdmin, (req, res, next) => {
  uploadAdminPhoto(req, res, (err) => {
    if (err) return res.status(400).send(err.message);
    next();
  });
}, adminController.postUpdateAdmin);
router.post('/admins/:id/delete', isSuperAdmin, adminController.postDeleteAdmin);

router.get('/animals', isAdmin, adminController.getAnimals);
router.get('/animals/:id/edit', isAdmin, (req, res, next) => {
  uploadAnimalPhoto(req, res, (err) => {
    if (err) return res.status(400).send(err.message);
    next();
  });
}, adminController.getEditAnimal);
router.post('/animals/:id', isAdmin, (req, res, next) => {
  uploadAnimalPhoto(req, res, (err) => {
    if (err) return res.status(400).send(err.message);
    next();
  });
}, adminController.postUpdateAnimal);
router.post('/animals/:id/delete', isAdmin, adminController.postDeleteAnimal);

module.exports = router;
