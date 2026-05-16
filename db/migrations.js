const db = require('../config/db');

const createMigrationsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error creating migrations table:', err);
  }
};

const hasMigrationRun = async (name) => {
  try {
    const result = await db.query(
      'SELECT * FROM migrations WHERE name = $1',
      [name]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error checking migration status:', err);
    return false;
  }
};

const recordMigration = async (name) => {
  try {
    await db.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [name]
    );
  } catch (err) {
    console.error('Error recording migration:', err);
  }
};

const migration001 = async () => {
  try {
    const hasRun = await hasMigrationRun('001_init_schema');
    if (hasRun) return;

    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }

    await recordMigration('001_init_schema');
    console.log('✓ Migration 001_init_schema completed');
  } catch (err) {
    console.error('Error running migration 001:', err);
  }
};

const migration002 = async () => {
  try {
    const hasRun = await hasMigrationRun('002_seed_data');
    if (hasRun) return;

    const fs = require('fs');
    const path = require('path');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    const statements = seed.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
        } catch (err) {
          // Ignore duplicate key errors for seed data
          if (err.code !== '23505') {
            throw err;
          }
        }
      }
    }

    await recordMigration('002_seed_data');
    console.log('✓ Migration 002_seed_data completed');
  } catch (err) {
    console.error('Error running migration 002:', err);
  }
};

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    await createMigrationsTable();
    await migration001();
    await migration002();
    console.log('✓ All migrations completed');
  } catch (err) {
    console.error('Error running migrations:', err);
  }
};

module.exports = runMigrations;
