-- Insert admin user
INSERT INTO users (email, password_hash, role)
VALUES ('admin@vetclinic.ru', '$2a$10$W/SYQ.d7.6CRHmDfJIEqOOcj/YG6VyMkdYJgbZOKNzb0aB8XCx9yK', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert vet users and their profiles
INSERT INTO users (email, password_hash, role)
VALUES
  ('dr.ivanov@vetclinic.ru', '$2a$10$W/SYQ.d7.6CRHmDfJIEqOOcj/YG6VyMkdYJgbZOKNzb0aB8XCx9yK', 'vet'),
  ('dr.petrova@vetclinic.ru', '$2a$10$W/SYQ.d7.6CRHmDfJIEqOOcj/YG6VyMkdYJgbZOKNzb0aB8XCx9yK', 'vet'),
  ('dr.smirnov@vetclinic.ru', '$2a$10$W/SYQ.d7.6CRHmDfJIEqOOcj/YG6VyMkdYJgbZOKNzb0aB8XCx9yK', 'vet')
ON CONFLICT (email) DO NOTHING;

-- Insert vet profiles
INSERT INTO vets (user_id, full_name, specialization, experience, bio)
SELECT u.id, 'Иванов Иван Игоревич', 'Хирургия', 8, 'Специалист по хирургическим вмешательствам'
FROM users u WHERE u.email = 'dr.ivanov@vetclinic.ru' AND NOT EXISTS (SELECT 1 FROM vets WHERE user_id = u.id);

INSERT INTO vets (user_id, full_name, specialization, experience, bio)
SELECT u.id, 'Петрова Мария Сергеевна', 'Терапия', 10, 'Опытный врач с специализацией в терапии'
FROM users u WHERE u.email = 'dr.petrova@vetclinic.ru' AND NOT EXISTS (SELECT 1 FROM vets WHERE user_id = u.id);

INSERT INTO vets (user_id, full_name, specialization, experience, bio)
SELECT u.id, 'Смирнов Петр Алексеевич', 'Стоматология', 6, 'Специалист по ветеринарной стоматологии'
FROM users u WHERE u.email = 'dr.smirnov@vetclinic.ru' AND NOT EXISTS (SELECT 1 FROM vets WHERE user_id = u.id);

-- Insert services
INSERT INTO services (name, description, price, duration_min)
VALUES
  ('Первичный осмотр', 'Общий осмотр и сбор анамнеза', 500.00, 30),
  ('УЗИ диагностика', 'Ультразвуковое исследование', 1500.00, 30),
  ('Профилактическая вакцинация', 'Вакцинация против основных инфекций', 1000.00, 20),
  ('Чистка зубов', 'Профессиональная чистка зубов под анестезией', 3000.00, 60),
  ('Кастрация/Стерилизация', 'Хирургическая операция', 4000.00, 90)
ON CONFLICT (name) DO NOTHING;
