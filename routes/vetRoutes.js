const express = require('express');
const router = express.Router();
const { isVet } = require('../middleware/auth');
const vetController = require('../controllers/vetController');
const appointmentController = require('../controllers/appointmentController');
const medCardController = require('../controllers/medCardController');
const { uploadVisitPhotos } = require('../config/multer');

router.get('/dashboard', isVet, vetController.getDashboard);
router.get('/schedule', isVet, vetController.getSchedule);

router.get('/appointments', isVet, vetController.getAppointments);
router.get('/appointments/:id', isVet, appointmentController.getAppointmentDetail);
router.post('/appointments/:id/confirm', isVet, appointmentController.confirmAppointment);
router.post('/appointments/:id/complete', isVet, vetController.postCompleteAppointment);
router.post('/appointments/:id/cancel', isVet, vetController.postCancelAppointment);

router.get('/medcards', isVet, medCardController.getVetMedCards);
router.get('/medcards/:animalId', isVet, medCardController.getMedCardDetail);
router.get('/medcards/:animalId/visits/new', isVet, medCardController.getNewVisit);
router.post('/medcards/:animalId/visits', isVet, (req, res, next) => {
  uploadVisitPhotos(req, res, (err) => {
    if (err) {
      req.flash('error', 'Ошибка загрузки фото: ' + err.message);
      return res.redirect(`/vet/medcards/${req.params.animalId}/visits/new`);
    }
    next();
  });
}, medCardController.postCreateVisit);
router.get('/visits/:visitId/edit', isVet, medCardController.getEditVisit);
router.post('/visits/:visitId', isVet, (req, res, next) => {
  uploadVisitPhotos(req, res, (err) => {
    if (err) {
      req.flash('error', 'Ошибка загрузки фото: ' + err.message);
      return res.redirect(`/vet/visits/${req.params.visitId}/edit`);
    }
    next();
  });
}, medCardController.postUpdateVisit);
router.post('/visits/:visitId/delete', isVet, medCardController.postDeleteVisit);
router.post('/visits/:visitId/photos/:photoId/delete', isVet, medCardController.postDeleteVisitPhoto);

module.exports = router;
