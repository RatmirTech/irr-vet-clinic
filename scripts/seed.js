

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const runMigrations = require('../db/migrations');

const ADMINS = [
  { email: 'manager.kozlova@vetclinic.ru', password: 'admin123', fullName: 'Козлова Анна Викторовна', phone: '+7 (495) 123-45-01', position: 'Старший менеджер' },
  { email: 'manager.fedorov@vetclinic.ru', password: 'admin123', fullName: 'Фёдоров Дмитрий Сергеевич', phone: '+7 (495) 123-45-02', position: 'Администратор смены' },
  { email: 'manager.lebedeva@vetclinic.ru', password: 'admin123', fullName: 'Лебедева Ольга Игоревна', phone: '+7 (495) 123-45-03', position: 'Менеджер по работе с клиентами' },
];

const VETS = [
  { email: 'ivanov@vetclinic.ru', password: 'vet123', fullName: 'Иванов Алексей Петрович', specialization: 'Хирургия', experience: 15, bio: 'Опытный хирург с 15-летним стажем. Специализируется на ортопедических операциях и стерилизации. Прошёл обучение в ведущих ветеринарных клиниках Европы.' },
  { email: 'petrova@vetclinic.ru', password: 'vet123', fullName: 'Петрова Мария Александровна', specialization: 'Терапия', experience: 12, bio: 'Терапевт широкого профиля. Член Российской ассоциации практикующих ветеринарных врачей. Особый интерес — внутренние болезни кошек.' },
  { email: 'smirnov@vetclinic.ru', password: 'vet123', fullName: 'Смирнов Игорь Васильевич', specialization: 'Стоматология', experience: 8, bio: 'Ветеринарный стоматолог. Проводит профессиональную чистку зубов под анестезией, удаление и пломбирование. Работает с собаками, кошками и грызунами.' },
  { email: 'kuznetsova@vetclinic.ru', password: 'vet123', fullName: 'Кузнецова Елена Дмитриевна', specialization: 'Дерматология', experience: 10, bio: 'Дерматолог-аллерголог. Лечение хронических кожных заболеваний, аллергий, грибковых и паразитарных инфекций.' },
  { email: 'volkov@vetclinic.ru', password: 'vet123', fullName: 'Волков Сергей Николаевич', specialization: 'Кардиология', experience: 14, bio: 'Кардиолог. ЭКГ, эхокардиография, лечение сердечно-сосудистых заболеваний у животных. Кандидат ветеринарных наук.' },
  { email: 'morozova@vetclinic.ru', password: 'vet123', fullName: 'Морозова Татьяна Владимировна', specialization: 'Офтальмология', experience: 7, bio: 'Офтальмолог. Диагностика и лечение заболеваний глаз. Микрохирургия глаза, удаление катаракты.' },
];

const CLIENTS = [
  { email: 'anna.petrova@mail.ru', password: 'client123', fullName: 'Петрова Анна Михайловна', phone: '+7 (916) 234-56-01' },
  { email: 'sergey.ivanov@gmail.com', password: 'client123', fullName: 'Иванов Сергей Олегович', phone: '+7 (903) 345-67-02' },
  { email: 'maria.smirnova@yandex.ru', password: 'client123', fullName: 'Смирнова Мария Андреевна', phone: '+7 (925) 456-78-03' },
  { email: 'dmitry.kozlov@mail.ru', password: 'client123', fullName: 'Козлов Дмитрий Викторович', phone: '+7 (985) 567-89-04' },
  { email: 'elena.morozova@gmail.com', password: 'client123', fullName: 'Морозова Елена Сергеевна', phone: '+7 (916) 678-90-05' },
  { email: 'alexey.volkov@yandex.ru', password: 'client123', fullName: 'Волков Алексей Игоревич', phone: '+7 (903) 789-01-06' },
  { email: 'olga.fedorova@mail.ru', password: 'client123', fullName: 'Фёдорова Ольга Петровна', phone: '+7 (925) 890-12-07' },
  { email: 'andrey.lebedev@gmail.com', password: 'client123', fullName: 'Лебедев Андрей Николаевич', phone: '+7 (985) 901-23-08' },
  { email: 'tatiana.sokolova@mail.ru', password: 'client123', fullName: 'Соколова Татьяна Дмитриевна', phone: '+7 (916) 012-34-09' },
  { email: 'mikhail.popov@yandex.ru', password: 'client123', fullName: 'Попов Михаил Александрович', phone: '+7 (903) 123-45-10' },
  { email: 'natalia.vasilieva@gmail.com', password: 'client123', fullName: 'Васильева Наталья Юрьевна', phone: '+7 (925) 234-56-11' },
  { email: 'pavel.novikov@mail.ru', password: 'client123', fullName: 'Новиков Павел Романович', phone: '+7 (985) 345-67-12' },
];

const SERVICES = [
  { name: 'Первичный осмотр', description: 'Общий осмотр животного, сбор анамнеза, термометрия, аускультация. Включает консультацию по уходу.', price: 1500, duration: 30 },
  { name: 'Вакцинация комплексная', description: 'Прививка от основных инфекций (для собак — DHPPi+L, для кошек — PCH). Включает паспорт вакцинации.', price: 2500, duration: 20 },
  { name: 'УЗИ брюшной полости', description: 'Ультразвуковое исследование внутренних органов: печени, селезёнки, почек, мочевого пузыря, кишечника.', price: 3500, duration: 40 },
  { name: 'Профессиональная чистка зубов', description: 'Снятие зубного камня ультразвуком, полировка под общей анестезией. Включает осмотр стоматолога.', price: 6500, duration: 90 },
  { name: 'Кастрация / Стерилизация', description: 'Хирургическая операция под общей анестезией. Включает наблюдение в день операции и снятие швов.', price: 7500, duration: 120 },
  { name: 'Анализы крови (общий + биохимия)', description: 'Забор крови, общий клинический и биохимический анализ. Результат — в течение суток.', price: 2800, duration: 15 },
];

const ANIMALS_DATA = [
  
  [0, 'Мурзик', 'Кошка', 'Британская короткошёрстная', '2021-03-15', 'Самец'],
  [0, 'Бусинка', 'Кошка', 'Шотландская вислоухая', '2022-07-20', 'Самка'],
  [1, 'Рекс', 'Собака', 'Немецкая овчарка', '2019-05-10', 'Самец'],
  [2, 'Барсик', 'Кошка', 'Беспородная', '2020-11-25', 'Самец'],
  [2, 'Соня', 'Собака', 'Йоркширский терьер', '2023-01-12', 'Самка'],
  [3, 'Граф', 'Собака', 'Лабрадор', '2018-08-30', 'Самец'],
  [3, 'Маркиза', 'Кошка', 'Мейн-кун', '2021-12-05', 'Самка'],
  [4, 'Кеша', 'Птица', 'Волнистый попугай', '2022-04-18', 'Самец'],
  [4, 'Бэлла', 'Собака', 'Чихуахуа', '2020-09-22', 'Самка'],
  [5, 'Тимоша', 'Кролик', 'Декоративный', '2022-02-14', 'Самец'],
  [5, 'Лаки', 'Собака', 'Хаски', '2019-06-08', 'Самец'],
  [6, 'Маша', 'Кошка', 'Сфинкс', '2021-10-03', 'Самка'],
  [7, 'Бим', 'Собака', 'Бигль', '2020-04-17', 'Самец'],
  [7, 'Снежок', 'Кролик', 'Карликовый баран', '2023-03-28', 'Самец'],
  [8, 'Дуся', 'Кошка', 'Сиамская', '2019-01-30', 'Самка'],
  [9, 'Бакс', 'Собака', 'Бульдог', '2017-11-11', 'Самец'],
  [9, 'Рыжик', 'Кошка', 'Беспородная', '2020-05-25', 'Самец'],
  [10, 'Тоша', 'Грызун', 'Морская свинка', '2022-08-15', 'Самец'],
  [10, 'Афина', 'Кошка', 'Русская голубая', '2021-06-19', 'Самка'],
  [11, 'Чарли', 'Собака', 'Корги', '2022-09-07', 'Самец'],
];

const VISIT_TEMPLATES = [
  {
    diagnosis: 'Острый отит наружного уха',
    treatment: 'Промывание ушных раковин раствором хлоргексидина 0.05%. Закладывание мази "Отибиовин" 2 раза в день.',
    prescriptions: 'Отибиовин — по 3 капли в каждое ухо, 10 дней. Контрольный осмотр через 7 дней.',
    notes: 'Владельцу рекомендовано избегать попадания воды в уши при купании.',
  },
  {
    diagnosis: 'Гастрит на фоне пищевого расстройства',
    treatment: 'Голодная диета 24 часа. Назначен Смекта по 1/2 пакетика 3 раза в день. Ветом-1.1 курсом 10 дней.',
    prescriptions: 'Лечебный корм Royal Canin Gastro Intestinal — 2 недели. Дробное кормление 4 раза в день.',
    notes: 'Состояние удовлетворительное, аппетит сохранён. Рвоты нет.',
  },
  {
    diagnosis: 'Дерматит аллергической этиологии',
    treatment: 'Антигистаминная терапия: Супрастин 1/4 таб 2 раза в день, 7 дней. Местно — крем Адвантан 0.1%.',
    prescriptions: 'Гипоаллергенная диета Hill\'s z/d минимум 8 недель. Исключить любые лакомства.',
    notes: 'Подозрение на пищевую аллергию. Рекомендована элиминационная диета.',
  },
  {
    diagnosis: 'Зубной камень II степени, гингивит',
    treatment: 'Проведена ультразвуковая чистка зубов под общей анестезией. Полировка эмали.',
    prescriptions: 'Гель Стоматидин — обрабатывать дёсны 2 раза в день, 14 дней. Профилактическая чистка раз в год.',
    notes: 'Удалены 2 шатающихся зуба. Восстановление после анестезии без осложнений.',
  },
  {
    diagnosis: 'Вирусная инфекция верхних дыхательных путей (ринотрахеит)',
    treatment: 'Антибиотикотерапия: Синулокс 50 мг 2 раза в день, 10 дней. Промывание носа физраствором.',
    prescriptions: 'Иммунофан подкожно через день, курс 5 инъекций. Витамины Канвит.',
    notes: 'Изолировать от других животных. Обеспечить тёплое и сухое помещение.',
  },
  {
    diagnosis: 'Профилактическая вакцинация',
    treatment: 'Вакцинирован препаратом Nobivac DHPPi+L. Реакции на вакцину не наблюдалось.',
    prescriptions: 'Карантин 2 недели — ограничить контакты с другими животными. Ревакцинация через год.',
    notes: 'Прививочный паспорт обновлён. Следующая вакцинация — через 12 месяцев.',
  },
  {
    diagnosis: 'Кастрация плановая',
    treatment: 'Проведена кастрация под общей анестезией. Операция прошла без осложнений.',
    prescriptions: 'Послеоперационный воротник — 7 дней. Обработка швов мирамистином 2 раза в день.',
    notes: 'Снятие швов — через 10 дней. Ограничить активность на 3-5 дней.',
  },
  {
    diagnosis: 'Конъюнктивит бактериальной этиологии',
    treatment: 'Промывание глаз раствором фурацилина. Капли Ципровет 4 раза в день, 7 дней.',
    prescriptions: 'Тетрациклиновая мазь на ночь, 5 дней. Контрольный осмотр через неделю.',
    notes: 'Аккуратно убирать корочки тёплой влажной салфеткой.',
  },
  {
    diagnosis: 'Шумы сердца, подозрение на ГКМП',
    treatment: 'Проведена ЭХО-КГ. Назначен Атенолол 6.25 мг 1 раз в день.',
    prescriptions: 'Атенолол длительно. Контрольное ЭХО через 3 месяца. Ограничить физические нагрузки.',
    notes: 'Предрасположенность породы. Рекомендовано наблюдение у кардиолога.',
  },
  {
    diagnosis: 'Травма мягких тканей задней конечности',
    treatment: 'Обработка раны хлоргексидином, наложение давящей повязки. Антибиотик Цефтриаксон 1 г в/м, 5 дней.',
    prescriptions: 'Локсиком 1.5 мг/мл — 0.1 мл/кг 1 раз в день, 5 дней. Покой, ограничение прогулок.',
    notes: 'Перевязка через день. Рекомендация владельцу — следить за активностью.',
  },
];

function logSection(title) {
  console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`);
}

function logStep(msg) {
  console.log(`  ✓ ${msg}`);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log('\n🌱 Запуск сидера базы данных...\n');

  await runMigrations();

  logSection('1. Создание администраторов');
  for (const admin of ADMINS) {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [admin.email]);
    if (exists.rows.length) {
      logStep(`Уже существует: ${admin.email}`);
      continue;
    }
    const hash = await bcrypt.hash(admin.password, 10);
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, role, is_super_admin) VALUES ($1, $2, 'admin', FALSE) RETURNING id`,
      [admin.email, hash]
    );
    await db.query(
      `INSERT INTO admin_profiles (user_id, full_name, phone, position) VALUES ($1, $2, $3, $4)`,
      [userResult.rows[0].id, admin.fullName, admin.phone, admin.position]
    );
    logStep(`Создан: ${admin.fullName} (${admin.email})`);
  }

  logSection('2. Создание ветеринаров');
  const vetIds = [];
  for (const vet of VETS) {
    const exists = await db.query('SELECT u.id, v.id as vet_id FROM users u LEFT JOIN vets v ON v.user_id = u.id WHERE u.email = $1', [vet.email]);
    if (exists.rows.length && exists.rows[0].vet_id) {
      vetIds.push(exists.rows[0].vet_id);
      logStep(`Уже существует: ${vet.email} (vet_id=${exists.rows[0].vet_id})`);
      continue;
    }
    const hash = await bcrypt.hash(vet.password, 10);
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'vet') RETURNING id`,
      [vet.email, hash]
    );
    const vetResult = await db.query(
      `INSERT INTO vets (user_id, full_name, specialization, experience, bio) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userResult.rows[0].id, vet.fullName, vet.specialization, vet.experience, vet.bio]
    );
    vetIds.push(vetResult.rows[0].id);
    logStep(`Создан: ${vet.fullName} — ${vet.specialization} (${vet.experience} лет опыта)`);
  }

  logSection('3. Создание клиентов');
  const clientIds = [];
  for (const client of CLIENTS) {
    const exists = await db.query('SELECT u.id, c.id as client_id FROM users u LEFT JOIN clients c ON c.user_id = u.id WHERE u.email = $1', [client.email]);
    if (exists.rows.length && exists.rows[0].client_id) {
      clientIds.push(exists.rows[0].client_id);
      logStep(`Уже существует: ${client.email} (client_id=${exists.rows[0].client_id})`);
      continue;
    }
    const hash = await bcrypt.hash(client.password, 10);
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'client') RETURNING id`,
      [client.email, hash]
    );
    const clientResult = await db.query(
      `INSERT INTO clients (user_id, full_name, phone) VALUES ($1, $2, $3) RETURNING id`,
      [userResult.rows[0].id, client.fullName, client.phone]
    );
    clientIds.push(clientResult.rows[0].id);
    logStep(`Создан: ${client.fullName} (${client.phone})`);
  }

  logSection('4. Создание услуг');
  const serviceIds = [];
  for (const service of SERVICES) {
    const exists = await db.query('SELECT id FROM services WHERE name = $1', [service.name]);
    if (exists.rows.length) {
      serviceIds.push(exists.rows[0].id);
      logStep(`Уже существует: ${service.name}`);
      continue;
    }
    const result = await db.query(
      `INSERT INTO services (name, description, price, duration_min) VALUES ($1, $2, $3, $4) RETURNING id`,
      [service.name, service.description, service.price, service.duration]
    );
    serviceIds.push(result.rows[0].id);
    logStep(`Создана: ${service.name} — ${service.price} ₽ (${service.duration} мин)`);
  }

  logSection('5. Создание животных и медкарт');
  const animalIds = [];
  for (const [clientIdx, name, species, breed, birthDate, gender] of ANIMALS_DATA) {
    const clientId = clientIds[clientIdx];
    if (!clientId) continue;
    const exists = await db.query(
      'SELECT id FROM animals WHERE client_id = $1 AND name = $2',
      [clientId, name]
    );
    let animalId;
    if (exists.rows.length) {
      animalId = exists.rows[0].id;
      logStep(`Уже существует: ${name} (${species})`);
    } else {
      const result = await db.query(
        `INSERT INTO animals (client_id, name, species, breed, birth_date, gender) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [clientId, name, species, breed, birthDate, gender]
      );
      animalId = result.rows[0].id;
      logStep(`Создан: ${name} — ${species} (${breed})`);
    }
    animalIds.push(animalId);
    
    await db.query(
      `INSERT INTO med_cards (animal_id) VALUES ($1) ON CONFLICT (animal_id) DO NOTHING`,
      [animalId]
    );
  }

  logSection('6. Генерация расписания на 14 дней');
  const DAYS = 14;
  const SLOTS_PER_DAY = ['09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45','12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45','16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45'];
  let slotsCreated = 0;
  let slotsSkipped = 0;
  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    if (d.getDay() === 0 || d.getDay() === 6) continue; 
    const dateStr = d.toISOString().slice(0, 10);
    for (const vetId of vetIds) {
      for (const time of SLOTS_PER_DAY) {
        try {
          const result = await db.query(
            `INSERT INTO schedule_slots (vet_id, slot_date, slot_time, is_available) VALUES ($1, $2, $3, TRUE) ON CONFLICT DO NOTHING RETURNING id`,
            [vetId, dateStr, time]
          );
          if (result.rows.length) slotsCreated++; else slotsSkipped++;
        } catch (e) {  slotsSkipped++; }
      }
    }
  }
  logStep(`Создано слотов: ${slotsCreated}, пропущено (дубли): ${slotsSkipped}`);

  logSection('7. Создание записей на приём');
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  const statusWeights = ['pending', 'pending', 'confirmed', 'confirmed', 'confirmed', 'completed', 'completed', 'cancelled'];
  let appointmentsCreated = 0;
  const appointmentsForVisit = [];
  for (let i = 0; i < 25; i++) {
    const animalId = randomChoice(animalIds);
    const animalRow = await db.query('SELECT client_id FROM animals WHERE id = $1', [animalId]);
    if (!animalRow.rows.length) continue;
    const clientId = animalRow.rows[0].client_id;
    const vetId = randomChoice(vetIds);
    
    const slotResult = await db.query(
      `SELECT id FROM schedule_slots WHERE vet_id = $1 AND is_available = TRUE
       AND id NOT IN (SELECT slot_id FROM appointments WHERE slot_id IS NOT NULL)
       ORDER BY RANDOM() LIMIT 1`,
      [vetId]
    );
    if (!slotResult.rows.length) continue;
    const slotId = slotResult.rows[0].id;
    const serviceId = randomChoice(serviceIds);
    const status = randomChoice(statusWeights);
    const notes = ['', 'Питомец нервничает', 'Постоянный клиент', 'Жалобы на отказ от еды', 'Профилактический осмотр', ''][randomInt(0, 5)];
    const apptResult = await db.query(
      `INSERT INTO appointments (client_id, vet_id, animal_id, slot_id, service_id, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [clientId, vetId, animalId, slotId, serviceId, status, notes]
    );
    if (status === 'completed') {
      appointmentsForVisit.push({ appointmentId: apptResult.rows[0].id, animalId, vetId });
    }
    appointmentsCreated++;
  }
  logStep(`Создано записей: ${appointmentsCreated}`);

  logSection('8. Создание визитов в медкартах');
  let visitsCreated = 0;
  for (const { appointmentId, animalId, vetId } of appointmentsForVisit) {
    const medCardResult = await db.query('SELECT id FROM med_cards WHERE animal_id = $1', [animalId]);
    if (!medCardResult.rows.length) continue;
    const medCardId = medCardResult.rows[0].id;
    const template = randomChoice(VISIT_TEMPLATES);
    const visitDate = dateOffset(-randomInt(1, 30));
    await db.query(
      `INSERT INTO visits (med_card_id, appointment_id, vet_id, visit_date, diagnosis, treatment, prescriptions, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [medCardId, appointmentId, vetId, visitDate, template.diagnosis, template.treatment, template.prescriptions, template.notes]
    );
    visitsCreated++;
  }
  
  for (let i = 0; i < 8; i++) {
    const animalId = randomChoice(animalIds);
    const vetId = randomChoice(vetIds);
    const medCardResult = await db.query('SELECT id FROM med_cards WHERE animal_id = $1', [animalId]);
    if (!medCardResult.rows.length) continue;
    const medCardId = medCardResult.rows[0].id;
    const template = randomChoice(VISIT_TEMPLATES);
    const visitDate = dateOffset(-randomInt(30, 365));
    await db.query(
      `INSERT INTO visits (med_card_id, appointment_id, vet_id, visit_date, diagnosis, treatment, prescriptions, notes)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)`,
      [medCardId, vetId, visitDate, template.diagnosis, template.treatment, template.prescriptions, template.notes]
    );
    visitsCreated++;
  }
  logStep(`Создано визитов: ${visitsCreated}`);

  

  logSection('Итоги');
  const counts = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role='admin')::int AS admins,
      (SELECT COUNT(*) FROM users WHERE role='vet')::int AS vets,
      (SELECT COUNT(*) FROM users WHERE role='client')::int AS clients,
      (SELECT COUNT(*) FROM animals)::int AS animals,
      (SELECT COUNT(*) FROM services)::int AS services,
      (SELECT COUNT(*) FROM schedule_slots)::int AS slots,
      (SELECT COUNT(*) FROM appointments)::int AS appointments,
      (SELECT COUNT(*) FROM visits)::int AS visits,
      (SELECT COUNT(*) FROM med_cards)::int AS medcards
  `);
  const s = counts.rows[0];
  console.log(`
  📊 В базе сейчас:
     Администраторов:  ${s.admins}
     Ветеринаров:      ${s.vets}
     Клиентов:         ${s.clients}
     Животных:         ${s.animals}
     Медкарт:          ${s.medcards}
     Услуг:            ${s.services}
     Слотов:           ${s.slots}
     Записей:          ${s.appointments}
     Визитов:          ${s.visits}

  🔑 Тестовые учётные данные:
     Супер-админ:  superadmin@vetclinic.ru / admin123
     Админ:        manager.kozlova@vetclinic.ru / admin123
     Ветеринар:    ivanov@vetclinic.ru / vet123
     Клиент:       anna.petrova@mail.ru / client123

  ✅ Готово!
  `);

  await db.pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Ошибка при заполнении базы:');
  console.error(err);
  process.exit(1);
});
