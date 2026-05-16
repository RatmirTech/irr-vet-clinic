const UserModel = require('../models/userModel');
const ClientModel = require('../models/clientModel');

const authController = {
  getLogin: (req, res) => {
    res.render('auth/login', { pageTitle: 'Вход' });
  },

  postLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).render('auth/login', {
          pageTitle: 'Вход',
          error: 'Email и пароль обязательны',
        });
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        return res.status(401).render('auth/login', {
          pageTitle: 'Вход',
          error: 'Неверные учётные данные',
        });
      }

      const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).render('auth/login', {
          pageTitle: 'Вход',
          error: 'Неверные учётные данные',
        });
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.isSuperAdmin = user.is_super_admin || false;

      if (user.role === 'client') {
        const client = await ClientModel.findByUserId(user.id);
        if (client) {
          req.session.fullName = client.full_name;
        }
      }

      const redirects = {
        admin: '/admin/dashboard',
        vet: '/vet/dashboard',
        client: '/client/dashboard',
      };

      const redirectUrl = redirects[user.role] || '/';
      req.flash('success', `Добро пожаловать, ${user.email}!`);
      res.redirect(redirectUrl);
    } catch (err) {
      console.error(err);
      res.status(500).render('auth/login', {
        pageTitle: 'Вход',
        error: 'Произошла ошибка при входе',
      });
    }
  },

  getRegister: (req, res) => {
    res.render('auth/register', { pageTitle: 'Регистрация' });
  },

  postRegister: async (req, res) => {
    try {
      const { email, password, confirmPassword, fullName, phone } = req.body;

      if (!email || !password || !confirmPassword || !fullName) {
        return res.status(400).render('auth/register', {
          pageTitle: 'Регистрация',
          error: 'Все поля обязательны',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).render('auth/register', {
          pageTitle: 'Регистрация',
          error: 'Пароли не совпадают',
        });
      }

      if (password.length < 6) {
        return res.status(400).render('auth/register', {
          pageTitle: 'Регистрация',
          error: 'Пароль должен быть не менее 6 символов',
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).render('auth/register', {
          pageTitle: 'Регистрация',
          error: 'Email уже зарегистрирован',
        });
      }

      const passwordHash = await UserModel.hashPassword(password);
      const user = await UserModel.create(email, passwordHash, 'client');

      const client = await ClientModel.create(user.id, fullName, phone);

      req.session.userId = user.id;
      req.session.role = 'client';
      req.session.fullName = fullName;

      req.flash('success', 'Регистрация успешна! Добро пожаловать!');
      res.redirect('/client/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).render('auth/register', {
        pageTitle: 'Регистрация',
        error: 'Произошла ошибка при регистрации',
      });
    }
  },

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Ошибка при выходе');
      }
      res.redirect('/');
    });
  },
};

module.exports = authController;
