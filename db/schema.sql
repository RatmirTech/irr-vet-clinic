-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('guest', 'client', 'vet', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create vets table
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
);

-- Create animals table
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
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_min INTEGER,
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create schedule_slots table
CREATE TABLE IF NOT EXISTS schedule_slots (
  id SERIAL PRIMARY KEY,
  vet_id INTEGER NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vet_id) REFERENCES vets(id) ON DELETE CASCADE,
  UNIQUE(vet_id, slot_date, slot_time)
);

-- Create appointments table
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
);

-- Create med_cards table
CREATE TABLE IF NOT EXISTS med_cards (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
);

-- Create visits table
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
);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_vets_user_id ON vets(user_id);
CREATE INDEX idx_animals_client_id ON animals(client_id);
CREATE INDEX idx_schedule_slots_vet_id ON schedule_slots(vet_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_vet_id ON appointments(vet_id);
CREATE INDEX idx_appointments_animal_id ON appointments(animal_id);
CREATE INDEX idx_med_cards_animal_id ON med_cards(animal_id);
CREATE INDEX idx_visits_med_card_id ON visits(med_card_id);
CREATE INDEX idx_visits_vet_id ON visits(vet_id);
