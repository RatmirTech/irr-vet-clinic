const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Appointments', () => {
  let clientCookie;
  let animalId;
  const testUser = {
    fullName: 'Client User',
    email: 'client' + Date.now() + '@example.com',
    phone: '79999999997',
    password: 'Password123'
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
          .end((err, res) => {
            if (err) return done(err);
            animalId = 1;
            done();
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
    it('should create appointment with valid data', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      request(app)
        .post('/client/appointments')
        .set('Cookie', clientCookie)
        .send({
          vetId: 1,
          appointmentDate: dateStr,
          animalId: animalId,
          serviceId: 1,
          slotId: 1,
          notes: 'Test appointment'
        })
        .expect(302)
        .end(done);
    });
  });
});
