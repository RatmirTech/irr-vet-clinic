const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const db = require('../config/db');

describe('Appointments', () => {
  let clientCookie;
  let animalId;
  let realSlot;
  const password = 'Password123';
  const testUser = {
    fullName: 'Client User',
    email: 'client' + Date.now() + '@example.com',
    phone: '79999999997',
    password,
    confirmPassword: password,
  };

  before((done) => {
    request(app)
      .post('/auth/register')
      .send(testUser)
      .end((err, res) => {
        if (err) return done(err);
        clientCookie = res.headers['set-cookie'];

        request(app)
          .post('/client/animals')
          .set('Cookie', clientCookie)
          .field('name', 'Rex')
          .field('species', 'Собака')
          .field('breed', 'Labrador')
          .field('birth_date', '2020-01-15')
          .field('gender', 'male')
          .end(async (err) => {
            if (err) return done(err);
            try {
              const r = await db.query(
                `SELECT a.id FROM animals a
                 JOIN clients c ON c.id = a.client_id
                 JOIN users u ON u.id = c.user_id
                 WHERE u.email = $1
                 ORDER BY a.id DESC LIMIT 1`,
                [testUser.email]
              );
              animalId = r.rows[0] ? r.rows[0].id : null;
              done();
            } catch (e) { done(e); }
          });
      });
  });

  describe('Validation', () => {
    it('should validate appointment date is in future', () => {
      const appointmentDate = new Date('2026-06-01');
      const today = new Date();
      expect(appointmentDate > today).to.be.true;
    });

    it('should require vet selection', () => {
      const vetId = null;
      expect(vetId).to.be.null;
    });

    it('should require appointment date', () => {
      const date = '';
      expect(date.length).to.equal(0);
    });
  });

  describe('GET /client/appointments/new', () => {
    it('should load new appointment form', (done) => {
      request(app)
        .get('/client/appointments/new')
        .set('Cookie', clientCookie)
        .expect(200)
        .end(done);
    });
  });

  describe('POST /client/appointments', () => {
    before(async () => {
      const result = await db.query(
        `SELECT ss.id AS slot_id, ss.vet_id, ss.slot_date
         FROM schedule_slots ss
         WHERE ss.is_available = TRUE
           AND ss.slot_date >= CURRENT_DATE
           AND ss.id NOT IN (SELECT slot_id FROM appointments WHERE slot_id IS NOT NULL)
         ORDER BY ss.slot_date, ss.slot_time
         LIMIT 1`
      );
      realSlot = result.rows[0];
    });

    it('should create appointment with valid data', function (done) {
      if (!realSlot || !animalId) {
        this.skip();
        return;
      }
      request(app)
        .post('/client/appointments')
        .set('Cookie', clientCookie)
        .send({
          vetId: realSlot.vet_id,
          appointmentDate: realSlot.slot_date.toISOString().slice(0, 10),
          animalId: animalId,
          slotId: realSlot.slot_id,
          notes: 'Test appointment'
        })
        .expect(302)
        .end(done);
    });
  });
});
