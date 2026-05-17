const db = require('../config/db');

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('guest', 'client', 'vet', 'admin')),
        is_super_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        position VARCHAR(255),
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS vets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        experience INTEGER,
        photo_url VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS animals (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        species VARCHAR(100),
        breed VARCHAR(100),
        birth_date DATE,
        gender VARCHAR(20),
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration_min INTEGER,
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_slots (
        id SERIAL PRIMARY KEY,
        vet_id INTEGER NOT NULL,
        slot_date DATE NOT NULL,
        slot_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vet_id) REFERENCES vets(id) ON DELETE CASCADE,
        UNIQUE(vet_id, slot_date, slot_time)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        vet_id INTEGER NOT NULL,
        animal_id INTEGER NOT NULL,
        slot_id INTEGER,
        service_id INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (vet_id) REFERENCES vets(id) ON DELETE CASCADE,
        FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
        FOREIGN KEY (slot_id) REFERENCES schedule_slots(id) ON DELETE SET NULL,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS med_cards (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        med_card_id INTEGER NOT NULL,
        appointment_id INTEGER,
        vet_id INTEGER NOT NULL,
        visit_date DATE NOT NULL,
        diagnosis TEXT,
        treatment TEXT,
        prescriptions TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (med_card_id) REFERENCES med_cards(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
        FOREIGN KEY (vet_id) REFERENCES vets(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS visit_photos (
        id SERIAL PRIMARY KEY,
        visit_id INTEGER NOT NULL,
        photo_url VARCHAR(500) NOT NULL,
        caption VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_vets_user_id ON vets(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_animals_client_id ON animals(client_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_schedule_slots_vet_id ON schedule_slots(vet_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_appointments_vet_id ON appointments(vet_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_appointments_animal_id ON appointments(animal_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_med_cards_animal_id ON med_cards(animal_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visits_med_card_id ON visits(med_card_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visits_vet_id ON visits(vet_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_photos_visit_id ON visit_photos(visit_id)`);

    await db.query(`
      CREATE OR REPLACE FUNCTION protect_last_super_admin()
      RETURNS TRIGGER AS $$
      DECLARE
        super_count INTEGER;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.is_super_admin = TRUE THEN
            SELECT COUNT(*) INTO super_count FROM users WHERE is_super_admin = TRUE;
            IF super_count <= 1 THEN
              RAISE EXCEPTION 'Нельзя удалить последнего супер-администратора (id=%, email=%)', OLD.id, OLD.email
                USING ERRCODE = 'check_violation';
            END IF;
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.is_super_admin = TRUE AND (NEW.is_super_admin = FALSE OR NEW.role <> 'admin') THEN
            SELECT COUNT(*) INTO super_count FROM users WHERE is_super_admin = TRUE AND id <> OLD.id;
            IF super_count = 0 THEN
              RAISE EXCEPTION 'Нельзя снять флаг супер-администратора или сменить роль у последнего супер-администратора (id=%, email=%)', OLD.id, OLD.email
                USING ERRCODE = 'check_violation';
            END IF;
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.query(`DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON users`);
    await db.query(`
      CREATE TRIGGER trg_protect_last_super_admin
      BEFORE DELETE OR UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION protect_last_super_admin();
    `);

    const bcrypt = require('bcryptjs');
    const superAdminCheck = await db.query(`SELECT id FROM users WHERE is_super_admin = TRUE LIMIT 1`);
    if (superAdminCheck.rows.length === 0) {
      const email = process.env.SUPER_ADMIN_EMAIL;
      const password = process.env.SUPER_ADMIN_PASSWORD;
      if (!email || !password) {
        throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env');
      }
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        `INSERT INTO users (email, password_hash, role, is_super_admin)
         VALUES ($1, $2, 'admin', TRUE)
         ON CONFLICT (email) DO UPDATE SET is_super_admin = TRUE`,
        [email, hash]
      );
      console.log(`✓ Super admin created: ${email}`);
    }

    console.log('✓ All tables created successfully');
  } catch (err) {
    console.error('Error running migrations:', err);
  }
};

module.exports = runMigrations;
