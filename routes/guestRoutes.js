const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

router.get('/', guestController.getHome);
router.get('/vets', guestController.getVets);
router.get('/vets/:id', guestController.getVetDetail);
router.get('/services', guestController.getServices);

module.exports = router;
