const express = require('express');
const router = express.Router();
const { isClient } = require('../middleware/auth');
const clientController = require('../controllers/clientController');
const animalController = require('../controllers/animalController');
const appointmentController = require('../controllers/appointmentController');
const { uploadAnimalPhoto } = require('../config/multer');

router.get('/dashboard', isClient, clientController.getDashboard);
router.get('/profile', isClient, clientController.getProfile);
router.post('/profile', isClient, clientController.postProfile);

router.get('/animals', isClient, animalController.getAnimals);
router.get('/animals/new', isClient, animalController.getNewAnimal);
router.post('/animals', isClient, (req, res, next) => {
  uploadAnimalPhoto(req, res, (err) => {
    if (err) {
      return res.status(400).render('client/animalForm', { error: err.message });
    }
    next();
  });
}, animalController.postCreateAnimal);
router.get('/animals/:id/edit', isClient, animalController.getEditAnimal);
router.post('/animals/:id', isClient, (req, res, next) => {
  uploadAnimalPhoto(req, res, (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }
    next();
  });
}, animalController.postUpdateAnimal);
router.post('/animals/:id/delete', isClient, animalController.postDeleteAnimal);

router.get('/appointments', isClient, appointmentController.getAppointments);
router.get('/appointments/new', isClient, appointmentController.getNewAppointment);
router.post('/appointments', isClient, appointmentController.postAppointment);
router.post('/appointments/:id/cancel', isClient, appointmentController.cancelAppointment);

const medCardController = require('../controllers/medCardController');
router.get('/medcards', isClient, medCardController.getClientMedCards);
router.get('/medcards/:medCardId', isClient, medCardController.getClientMedCardDetail);

module.exports = router;
