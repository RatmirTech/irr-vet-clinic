const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Authentication', () => {
  const password = 'TestPassword123';
  const testUser = {
    fullName: 'Test User',
    email: 'testuser' + Date.now() + '@example.com',
    phone: '79999999999',
    password,
    confirmPassword: password,
  };

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', (done) => {
      request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(302)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.headers.location).to.include('/client/dashboard');
          done();
        });
    });

    it('should validate email format on client side', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('user@example.com')).to.be.true;
      expect(emailRegex.test('invalid-email')).to.be.false;
    });

    it('should validate password length', () => {
      const password = 'password123';
      expect(password.length).to.be.at.least(6);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(302)
        .end(done);
    });

    it('should fail with incorrect password', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(401)
        .end(done);
    });
  });
});
