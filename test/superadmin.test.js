const { expect } = require('chai');
const db = require('../config/db');

describe('Защита супер-администратора на уровне БД', () => {
  it('Нельзя удалить последнего супер-администратора через DELETE', async () => {
    try {
      await db.query(`DELETE FROM users WHERE is_super_admin = TRUE`);
      throw new Error('DELETE прошёл, хотя должен был упасть');
    } catch (err) {
      expect(err.message).to.include('супер-администратор');
    }

    const result = await db.query(`SELECT COUNT(*)::int AS c FROM users WHERE is_super_admin = TRUE`);
    expect(result.rows[0].c).to.be.at.least(1);
  });

  it('Нельзя снять флаг is_super_admin у последнего супер-админа через UPDATE', async () => {
    try {
      await db.query(`UPDATE users SET is_super_admin = FALSE WHERE is_super_admin = TRUE`);
      throw new Error('UPDATE прошёл, хотя должен был упасть');
    } catch (err) {
      expect(err.message).to.include('супер-администратор');
    }

    const result = await db.query(`SELECT COUNT(*)::int AS c FROM users WHERE is_super_admin = TRUE`);
    expect(result.rows[0].c).to.be.at.least(1);
  });

  it('Нельзя сменить роль супер-админу на не-admin через UPDATE', async () => {
    try {
      await db.query(`UPDATE users SET role = 'client' WHERE is_super_admin = TRUE`);
      throw new Error('UPDATE прошёл, хотя должен был упасть');
    } catch (err) {
      expect(err.message).to.include('супер-администратор');
    }
  });
});
