const AnimalModel = require('../models/animalModel');
const ClientModel = require('../models/clientModel');

const animalController = {
  getAnimals: async (req, res) => {
    try {
      const client = await ClientModel.findByUserId(req.session.userId);
      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      const animals = await AnimalModel.findByClientId(client.id);

      res.render('client/animals', {
        pageTitle: 'Мои питомцы',
        animals,
        clientId: client.id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке животных');
    }
  },

  getNewAnimal: async (req, res) => {
    try {
      res.render('client/animalForm', {
        pageTitle: 'Добавить питомца',
        animal: null,
        isEdit: false,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postCreateAnimal: async (req, res) => {
    try {
      const { name, species, breed, birthDate, gender } = req.body;
      const client = await ClientModel.findByUserId(req.session.userId);

      if (!client) {
        return res.status(404).send('Клиент не найден');
      }

      if (!name || !species) {
        return res.status(400).render('client/animalForm', {
          pageTitle: 'Добавить питомца',
          error: 'Заполните обязательные поля',
          animal: null,
          isEdit: false,
        });
      }

      const photoUrl = req.file ? `/uploads/animals/${req.file.filename}` : null;

      const animal = await AnimalModel.create(
        client.id,
        name,
        species,
        breed,
        birthDate || null,
        gender,
        photoUrl
      );

      req.flash('success', `Питомец "${name}" успешно добавлен!`);
      res.redirect('/client/animals');
    } catch (err) {
      console.error(err);
      res.status(500).render('client/animalForm', {
        pageTitle: 'Добавить питомца',
        error: 'Ошибка при создании питомца',
        animal: null,
        isEdit: false,
      });
    }
  },

  getEditAnimal: async (req, res) => {
    try {
      const { id } = req.params;
      const animal = await AnimalModel.findById(id);

      if (!animal) {
        return res.status(404).send('Питомец не найден');
      }

      const client = await ClientModel.findByUserId(req.session.userId);
      if (animal.client_id !== client.id) {
        return res.status(403).render('errors/403');
      }

      res.render('client/animalForm', {
        pageTitle: 'Редактировать питомца',
        animal,
        isEdit: true,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  postUpdateAnimal: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, species, breed, birthDate, gender } = req.body;

      const animal = await AnimalModel.findById(id);
      if (!animal) {
        return res.status(404).send('Питомец не найден');
      }

      const client = await ClientModel.findByUserId(req.session.userId);
      if (animal.client_id !== client.id) {
        return res.status(403).render('errors/403');
      }

      const photoUrl = req.file ? `/uploads/animals/${req.file.filename}` : animal.photo_url;

      await AnimalModel.update(id, {
        name,
        species,
        breed,
        birthDate: birthDate || null,
        gender,
        photoUrl,
      });

      req.flash('success', 'Информация о питомце обновлена');
      res.redirect('/client/animals');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при обновлении питомца');
    }
  },

  postDeleteAnimal: async (req, res) => {
    try {
      const { id } = req.params;

      const animal = await AnimalModel.findById(id);
      if (!animal) {
        return res.status(404).send('Питомец не найден');
      }

      const client = await ClientModel.findByUserId(req.session.userId);
      if (animal.client_id !== client.id) {
        return res.status(403).render('errors/403');
      }

      const animalName = animal.name;
      await AnimalModel.delete(id);

      req.flash('success', `Питомец "${animalName}" удалён`);
      res.redirect('/client/animals');
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при удалении питомца');
    }
  },
};

module.exports = animalController;
