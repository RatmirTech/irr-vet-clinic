const express = require('express');
const router = express.Router();
const { isClient } = require('../middleware/auth');
const clientController = require('../controllers/clientController');
const animalController = require('../controllers/animalController');
const { uploadAnimalPhoto } = require('../config/multer');

// Client dashboard and profile
router.get('/dashboard', isClient, clientController.getDashboard);
router.get('/profile', isClient, clientController.getProfile);
router.post('/profile', isClient, clientController.postProfile);

// Animals CRUD
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

module.exports = router;
