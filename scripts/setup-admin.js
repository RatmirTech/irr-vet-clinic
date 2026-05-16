const db = require('../config/db');
const UserModel = require('../models/userModel');

const setupAdmin = async () => {
  try {
    console.log('Проверка администратора...');

    const result = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    );

    const adminCount = parseInt(result.rows[0].count);

    if (adminCount > 0) {
      console.log(`Админов найдено: ${adminCount}`);
      process.exit(0);
    }

    console.log('Администраторов не найдено. Создаю...');

    const email = 'admin@vetclinic.ru';
    const password = 'password';
    const passwordHash = await UserModel.hashPassword(password);

    const user = await UserModel.create(email, passwordHash, 'admin');

    console.log('Администратор успешно создан!');
    console.log(`Email: ${email}`);
    console.log(`Пароль: ${password}`);
    console.log(`ID: ${user.id}`);

    process.exit(0);
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
};

setupAdmin();
