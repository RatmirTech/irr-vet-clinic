const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { uploadVetPhoto, uploadServicePhoto } = require('../config/multer');

// Dashboard
router.get('/dashboard', isAdmin, adminController.getDashboard);

// Vets CRUD
router.get('/vets', isAdmin, adminController.getVets);
router.get('/vets/new', isAdmin, adminController.getNewVet);
router.post('/vets', isAdmin, (req, res, next) => {
  uploadVetPhoto(req, res, (err) => {
    if (err) {
      return res.status(400).render('admin/vetForm', { error: err.message });
    }
    next();
  });
}, adminController.postVet);
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

// Services CRUD
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

// Schedule
router.get('/schedule', isAdmin, adminController.getSchedule);
router.post('/schedule/generate', isAdmin, adminController.postGenerateSlots);

// Clients
router.get('/clients', isAdmin, adminController.getClients);

module.exports = router;
