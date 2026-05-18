const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Регистрация: edge cases', () => {
  const email = 'dup' + Date.now() + '@example.com';

  before((done) => {
    request(app)
      .post('/auth/register')
      .send({
        fullName: 'Duplicate User',
        email,
        phone: '79990000000',
        password: 'Password123',
      })
      .end(done);
  });

  it('Повторная регистрация на тот же email возвращает 400', (done) => {
    request(app)
      .post('/auth/register')
      .send({
        fullName: 'Duplicate User 2',
        email,
        phone: '79990000001',
        password: 'Password123',
      })
      .expect(400, done);
  });

  it('Регистрация без обязательных полей возвращает 400', (done) => {
    request(app)
      .post('/auth/register')
      .send({ email: 'nopass@example.com' })
      .expect(400, done);
  });

  it('Короткий пароль (<6 символов) возвращает 400', (done) => {
    request(app)
      .post('/auth/register')
      .send({
        fullName: 'Short Pass',
        email: 'short' + Date.now() + '@example.com',
        phone: '79990000002',
        password: '123',
        confirmPassword: '123',
      })
      .expect(400, done);
  });

  it('Логин с несуществующим email возвращает 401', (done) => {
    request(app)
      .post('/auth/login')
      .send({
        email: 'nobody-' + Date.now() + '@example.com',
        password: 'whatever',
      })
      .expect(401, done);
  });
});
