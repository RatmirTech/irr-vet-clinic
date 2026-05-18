const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const db = require('../config/db');

describe('Медкарты', () => {
  let clientCookie;
  let userEmail;

  before((done) => {
    userEmail = 'medcard' + Date.now() + '@example.com';
    const password = 'Password123';
    request(app)
      .post('/auth/register')
      .send({
        fullName: 'Medcard Owner',
        email: userEmail,
        phone: '79991112233',
        password,
        confirmPassword: password,
      })
      .end((err, res) => {
        if (err) return done(err);
        clientCookie = res.headers['set-cookie'];
        done();
      });
  });

  it('При создании питомца автоматически создаётся медкарта', async () => {
    await request(app)
      .post('/client/animals')
      .set('Cookie', clientCookie)
      .field('name', 'Барсик-Тест')
      .field('species', 'Кошка')
      .field('breed', 'Тестовая')
      .field('gender', 'Самец')
      .expect(302);

    const result = await db.query(
      `SELECT mc.id
       FROM med_cards mc
       JOIN animals a ON a.id = mc.animal_id
       JOIN clients c ON c.id = a.client_id
       JOIN users u ON u.id = c.user_id
       WHERE u.email = $1 AND a.name = 'Барсик-Тест'`,
      [userEmail]
    );

    expect(result.rows.length).to.equal(1);
  });

  it('Список медкарт клиента возвращается со статусом 200', (done) => {
    request(app)
      .get('/client/medcards')
      .set('Cookie', clientCookie)
      .expect(200, done);
  });
});
