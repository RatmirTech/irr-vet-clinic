const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Role guards (доступ по ролям)', () => {
  let clientCookie;

  before((done) => {
    const password = 'Password123';
    request(app)
      .post('/auth/register')
      .send({
        fullName: 'Guard Test',
        email: 'guard' + Date.now() + '@example.com',
        phone: '70000000000',
        password,
        confirmPassword: password,
      })
      .end((err, res) => {
        if (err) return done(err);
        clientCookie = res.headers['set-cookie'];
        done();
      });
  });

  it('Неавторизованный пользователь не имеет доступа к /client/dashboard → 403', (done) => {
    request(app)
      .get('/client/dashboard')
      .expect(403, done);
  });

  it('Клиент не имеет доступа к /admin/dashboard → 403', (done) => {
    request(app)
      .get('/admin/dashboard')
      .set('Cookie', clientCookie)
      .expect(403, done);
  });

  it('Клиент не имеет доступа к /vet/dashboard → 403', (done) => {
    request(app)
      .get('/vet/dashboard')
      .set('Cookie', clientCookie)
      .expect(403, done);
  });

  it('Клиент имеет доступ к собственному /client/dashboard → 200', (done) => {
    request(app)
      .get('/client/dashboard')
      .set('Cookie', clientCookie)
      .expect(200, done);
  });

  it('Несуществующий маршрут возвращает 404', (done) => {
    request(app)
      .get('/this-route-does-not-exist-12345')
      .expect(404, done);
  });
});
