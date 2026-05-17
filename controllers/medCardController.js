const MedCardModel = require('../models/medCardModel');
const VisitModel = require('../models/visitModel');
const AnimalModel = require('../models/animalModel');
const VetModel = require('../models/vetModel');
const ClientModel = require('../models/clientModel');

async function getVetFromSession(req) {
  return await VetModel.findByUserId(req.session.userId);
}

async function getClientFromSession(req) {
  return await ClientModel.findByUserId(req.session.userId);
}

const medCardController = {
  async getClientMedCards(req, res) {
    try {
      const client = await getClientFromSession(req);
      if (!client) return res.status(403).render('errors/403');
      const medCards = await MedCardModel.getAllForClient(client.id);
      res.render('client/medcards', { medCards });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке медкарт');
    }
  },

  async getClientMedCardDetail(req, res) {
    try {
      const client = await getClientFromSession(req);
      if (!client) return res.status(403).render('errors/403');

      const animalId = parseInt(req.params.animalId || req.params.medCardId, 10);
      const animal = await AnimalModel.findById(animalId);
      if (!animal) return res.status(404).send('Питомец не найден');
      if (Number(animal.client_id) !== Number(client.id)) {
        console.warn(`Доступ запрещён: animal.client_id=${animal.client_id}, client.id=${client.id}`);
        return res.status(403).render('errors/403');
      }

      await MedCardModel.getOrCreate(animal.id);

      const medCard = await MedCardModel.getByAnimalIdWithDetails(animal.id);
      const visits = await VisitModel.getByMedCardId(medCard.id);
      const photosByVisit = await VisitModel.getPhotosForVisits(visits.map(v => v.id));
      res.render('client/medcard', { medCard, visits, photosByVisit });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  async getVetMedCards(req, res) {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');

      const allAnimals = await AnimalModel.getAll();
      const medCardsWithData = await Promise.all(
        allAnimals.map(async (animal) => {
          const medCard = await MedCardModel.getByAnimalId(animal.id);
          const visits = medCard ? await VisitModel.getByMedCardId(medCard.id) : [];
          return { animal, medCard, visitCount: visits.length };
        })
      );

      res.render('vet/medcards', { medCards: medCardsWithData });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при загрузке медкарт');
    }
  },

  async getMedCardDetail(req, res) {
    try {
      const { animalId } = req.params;
      const medCard = await MedCardModel.getByAnimalIdWithDetails(animalId);
      if (!medCard) return res.status(404).send('Медкарта не найдена');

      const visits = await VisitModel.getByMedCardId(medCard.id);
      const photosByVisit = await VisitModel.getPhotosForVisits(visits.map(v => v.id));
      res.render('vet/medcard', { medCard, visits, photosByVisit });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  async getNewVisit(req, res) {
    try {
      const { animalId } = req.params;
      const medCard = await MedCardModel.getByAnimalIdWithDetails(animalId);
      if (!medCard) return res.status(404).send('Медкарта не найдена');

      const today = new Date().toISOString().split('T')[0];
      res.render('vet/visitForm', { medCard, today, isEdit: false, visit: null });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  async postCreateVisit(req, res) {
    try {
      const vet = await getVetFromSession(req);
      if (!vet) return res.status(403).render('errors/403');

      const { animalId } = req.params;
      const { visit_date, diagnosis, treatment, prescriptions, notes, appointment_id, photo_captions } = req.body;

      const medCard = await MedCardModel.getByAnimalIdWithDetails(animalId);
      if (!medCard) return res.status(404).send('Медкарта не найдена');

      const appointmentId = appointment_id ? parseInt(appointment_id) : null;

      const visit = await VisitModel.create(medCard.id, appointmentId, vet.id, {
        visit_date, diagnosis, treatment, prescriptions, notes
      });

      if (req.files && req.files.length) {
        const captions = Array.isArray(photo_captions) ? photo_captions : (photo_captions ? [photo_captions] : []);
        for (let i = 0; i < req.files.length; i++) {
          await VisitModel.addPhoto(visit.id, `/uploads/visits/${req.files[i].filename}`, captions[i] || null);
        }
      }

      req.flash('success', 'Приём добавлен');
      res.redirect(`/vet/medcards/${animalId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка при создании приёма');
    }
  },

  async getEditVisit(req, res) {
    try {
      const { visitId } = req.params;
      const visit = await VisitModel.getById(visitId);
      if (!visit) return res.status(404).send('Приём не найден');

      const photos = await VisitModel.getPhotos(visitId);
      const medCard = {
        id: visit.med_card_id,
        animal_id: await AnimalModel.getAnimalIdFromMedCard(visit.med_card_id),
        animal_name: visit.animal_name,
        client_name: visit.client_name,
      };
      const today = new Date().toISOString().split('T')[0];
      res.render('vet/visitForm', { visit, medCard, isEdit: true, today, photos });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  async postUpdateVisit(req, res) {
    try {
      const { visitId } = req.params;
      const { diagnosis, treatment, prescriptions, notes, photo_captions } = req.body;

      const visit = await VisitModel.getById(visitId);
      if (!visit) return res.status(404).send('Приём не найден');

      await VisitModel.update(visitId, { diagnosis, treatment, prescriptions, notes });

      if (req.files && req.files.length) {
        const captions = Array.isArray(photo_captions) ? photo_captions : (photo_captions ? [photo_captions] : []);
        for (let i = 0; i < req.files.length; i++) {
          await VisitModel.addPhoto(visitId, `/uploads/visits/${req.files[i].filename}`, captions[i] || null);
        }
      }

      const animalId = await AnimalModel.getAnimalIdFromMedCard(visit.med_card_id);
      req.flash('success', 'Приём обновлён');
      res.redirect(`/vet/medcards/${animalId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  async postDeleteVisit(req, res) {
    try {
      const { visitId } = req.params;
      const visit = await VisitModel.getById(visitId);
      if (!visit) return res.status(404).send('Приём не найден');

      await VisitModel.delete(visitId);
      const animalId = await AnimalModel.getAnimalIdFromMedCard(visit.med_card_id);
      req.flash('success', 'Приём удалён');
      res.redirect(`/vet/medcards/${animalId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },

  async postDeleteVisitPhoto(req, res) {
    try {
      const { visitId, photoId } = req.params;
      await VisitModel.deletePhoto(photoId);
      req.flash('success', 'Фото удалено');
      res.redirect(`/vet/visits/${visitId}/edit`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка');
    }
  },
};

module.exports = medCardController;
