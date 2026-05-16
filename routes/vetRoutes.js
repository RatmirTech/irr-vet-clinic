const express = require('express');
const router = express.Router();
const { isVet } = require('../middleware/auth');
const vetController = require('../controllers/vetController');
const appointmentController = require('../controllers/appointmentController');
const medCardController = require('../controllers/medCardController');

router.get('/dashboard', isVet, vetController.getDashboard);
router.get('/schedule', isVet, vetController.getSchedule);
router.get('/appointments/:id', isVet, appointmentController.getAppointmentDetail);
router.post('/appointments/:id/confirm', isVet, appointmentController.confirmAppointment);

// Medical cards
router.get('/medcards', isVet, medCardController.getVetMedCards);
router.get('/medcards/:animalId', isVet, medCardController.getMedCardDetail);
router.get('/medcards/:animalId/visits/new', isVet, medCardController.getNewVisit);
router.post('/medcards/:animalId/visits', isVet, medCardController.postCreateVisit);
router.get('/visits/:visitId/edit', isVet, medCardController.getEditVisit);
router.post('/visits/:visitId', isVet, medCardController.postUpdateVisit);
router.post('/visits/:visitId/delete', isVet, medCardController.postDeleteVisit);

module.exports = router;
