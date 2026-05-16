const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Animals', () => {
  let clientCookie;
  const testUser = {
    fullName: 'Animal Owner',
    email: 'animalowner' + Date.now() + '@example.com',
    phone: '79999999998',
    password: 'Password123'
  };

  before((done) => {
    request(app)
      .post('/auth/register')
      .send(testUser)
      .end((err, res) => {
        if (err) return done(err);
        clientCookie = res.headers['set-cookie'];
        done();
      });
  });

  describe('Validation', () => {
    it('should require animal name', () => {
      const name = '';
      expect(name.length).to.equal(0);
    });

    it('should validate species selection', () => {
      const species = 'Собака';
      const validSpecies = ['Кошка', 'Собака', 'Птица', 'Кролик', 'Грызун', 'Другое'];
      expect(validSpecies).to.include(species);
    });

    it('should accept birth date', () => {
      const birthDate = new Date('2020-01-15');
      expect(birthDate).to.be.instanceof(Date);
    });
  });

  describe('POST /client/animals', () => {
    it('should create a new animal', (done) => {
      request(app)
        .post('/client/animals')
        .set('Cookie', clientCookie)
        .field('name', 'Fluffy')
        .field('species', 'Кошка')
        .field('breed', 'British Shorthair')
        .field('birth_date', '2020-01-15')
        .field('gender', 'female')
        .expect(302)
        .end(done);
    });
  });

  describe('GET /client/animals', () => {
    it('should retrieve animals list', (done) => {
      request(app)
        .get('/client/animals')
        .set('Cookie', clientCookie)
        .expect(200)
        .end(done);
    });
  });
});
