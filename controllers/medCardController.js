const MedCardModel = require('../models/medCardModel');
const VisitModel = require('../models/visitModel');
const AnimalModel = require('../models/animalModel');

const medCardController = {
  async getClientMedCards(req, res) {
    try {
      const clientId = req.session.userId;
      const medCards = await MedCardModel.getAllForClient(clientId);
      res.render('client/medcards', { medCards });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading medical cards' });
    }
  },

  async getClientMedCardDetail(req, res) {
    try {
      const { medCardId } = req.params;
      const clientId = req.session.userId;

      const medCard = await MedCardModel.getByAnimalIdWithDetails(req.params.animalId || null);
      if (!medCard || medCard.client_id !== clientId) {
        return res.status(403).render('error', { error: 'Access denied' });
      }

      const visits = await VisitModel.getByMedCardId(medCard.id);
      res.render('client/medcard', { medCard, visits });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading medical card' });
    }
  },

  async getVetMedCards(req, res) {
    try {
      const vetId = req.session.userId;
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
      res.status(500).render('error', { error: 'Error loading medical cards' });
    }
  },

  async getMedCardDetail(req, res) {
    try {
      const { animalId } = req.params;

      const medCard = await MedCardModel.getByAnimalIdWithDetails(animalId);
      if (!medCard) {
        return res.status(404).render('error', { error: 'Medical card not found' });
      }

      const visits = await VisitModel.getByMedCardId(medCard.id);
      res.render('vet/medcard', { medCard, visits });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading medical card' });
    }
  },

  async getNewVisit(req, res) {
    try {
      const { animalId } = req.params;

      const medCard = await MedCardModel.getByAnimalIdWithDetails(animalId);
      if (!medCard) {
        return res.status(404).render('error', { error: 'Medical card not found' });
      }

      const today = new Date().toISOString().split('T')[0];
      res.render('vet/visitForm', { medCard, today });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading visit form' });
    }
  },

  async postCreateVisit(req, res) {
    try {
      const { animalId } = req.params;
      const vetId = req.session.userId;
      const { visit_date, diagnosis, treatment, prescriptions, notes, appointment_id } = req.body;

      const medCard = await MedCardModel.getByAnimalIdWithDetails(animalId);
      if (!medCard) {
        return res.status(404).render('error', { error: 'Medical card not found' });
      }

      const appointmentId = appointment_id ? parseInt(appointment_id) : null;

      const visit = await VisitModel.create(medCard.id, appointmentId, vetId, {
        visit_date,
        diagnosis,
        treatment,
        prescriptions,
        notes
      });

      res.redirect(`/vet/medcards/${animalId}`);
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error creating visit' });
    }
  },

  async getEditVisit(req, res) {
    try {
      const { visitId } = req.params;

      const visit = await VisitModel.getById(visitId);
      if (!visit) {
        return res.status(404).render('error', { error: 'Visit not found' });
      }

      res.render('vet/visitForm', { visit, isEdit: true });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error loading visit' });
    }
  },

  async postUpdateVisit(req, res) {
    try {
      const { visitId } = req.params;
      const { diagnosis, treatment, prescriptions, notes } = req.body;

      const visit = await VisitModel.getById(visitId);
      if (!visit) {
        return res.status(404).render('error', { error: 'Visit not found' });
      }

      await VisitModel.update(visitId, {
        diagnosis,
        treatment,
        prescriptions,
        notes
      });

      const animalId = await AnimalModel.getAnimalIdFromMedCard(visit.med_card_id);
      res.redirect(`/vet/medcards/${animalId}`);
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error updating visit' });
    }
  },

  async postDeleteVisit(req, res) {
    try {
      const { visitId } = req.params;

      const visit = await VisitModel.getById(visitId);
      if (!visit) {
        return res.status(404).render('error', { error: 'Visit not found' });
      }

      await VisitModel.delete(visitId);
      const animalId = await AnimalModel.getAnimalIdFromMedCard(visit.med_card_id);

      res.redirect(`/vet/medcards/${animalId}`);
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { error: 'Error deleting visit' });
    }
  }
};

module.exports = medCardController;
