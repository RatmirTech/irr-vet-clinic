# Структура проекта «Ветеринарная клиника»

Курсовая работа КАИ 4311. Веб-приложение на **Node.js + Express + PostgreSQL + Pug**.
Архитектурный паттерн — **MVC** (Model–View–Controller).

---

## 1. Дерево файлов

```
irr-vet-clinic/
├── server.js                 # точка входа: настройка Express, миграции, запуск
├── package.json              # зависимости и npm-скрипты
├── docker-compose.yml        # PostgreSQL в Docker (порт 5433)
├── .env                      # секреты, БД, часы работы клиники
│
├── config/                   # конфигурация инфраструктуры
│   ├── db.js                 # pg.Pool — единый пул соединений к PostgreSQL
│   ├── session.js            # express-session + connect-pg-simple (persistent store)
│   ├── multer.js             # загрузка файлов: фото врачей/животных/визитов/xlsx
│   └── clinic.js             # часы работы клиники из .env
│
├── db/
│   └── migrations.js         # CREATE TABLE IF NOT EXISTS — все таблицы создаются в коде
│
├── middleware/
│   ├── auth.js               # isAuthenticated, isClient, isVet, isAdmin, isSuperAdmin
│   └── errorHandler.js       # глобальная ловушка ошибок (рендерит 500)
│
├── models/                   # слой работы с БД: SQL-запросы через pg
│   ├── userModel.js          # users (email, hash, role, is_super_admin)
│   ├── clientModel.js        # clients (профиль клиента)
│   ├── vetModel.js           # vets (профиль ветеринара, фильтры, специализации)
│   ├── animalModel.js        # animals (питомцы клиентов)
│   ├── serviceModel.js       # services (услуги клиники)
│   ├── scheduleModel.js      # schedule_slots (свободные/занятые слоты)
│   ├── appointmentModel.js   # appointments (записи на приём)
│   ├── medCardModel.js       # med_cards (медкарта на питомца)
│   └── visitModel.js         # visits + visit_photos (приёмы и фото)
│
├── controllers/              # бизнес-логика: получает req, дергает модели, рендерит view
│   ├── authController.js     # login, register, logout
│   ├── guestController.js    # главная, список ветеринаров, услуги
│   ├── clientController.js   # дашборд клиента, профиль
│   ├── vetController.js      # дашборд врача, приёмы, расписание врача
│   ├── adminController.js    # CRUD по всем сущностям (самый большой)
│   ├── appointmentController.js  # запись на приём, отмена, подтверждение
│   ├── animalController.js   # питомцы клиента
│   ├── medCardController.js  # медкарты + визиты + фото
│   └── scheduleController.js # API для слотов (используется AJAX)
│
├── routes/                   # маршрутизация по префиксам URL
│   ├── index.js              # подключает все sub-роутеры
│   ├── authRoutes.js         # /auth/*
│   ├── guestRoutes.js        # /, /vets, /services
│   ├── clientRoutes.js       # /client/*  (только role=client)
│   ├── vetRoutes.js          # /vet/*     (только role=vet)
│   ├── adminRoutes.js        # /admin/*   (только role=admin, часть — super_admin)
│   └── apiRoutes.js          # /api/*     (JSON для AJAX)
│
├── views/                    # шаблоны Pug
│   ├── layout/
│   │   ├── base.pug          # базовый layout: <html>, шапка, контейнер, flash
│   │   ├── nav.pug           # верхняя навигация
│   │   └── footer.pug
│   ├── auth/                 # login.pug, register.pug
│   ├── guest/                # index.pug, vets.pug, vetDetail.pug, services.pug
│   ├── client/               # dashboard, animals, animalForm, medcards, medcard,
│   │                         # appointments, newAppointment, profile
│   ├── vet/                  # dashboard, appointments, appointmentDetail, schedule,
│   │                         # medcards, medcard, visitForm
│   ├── admin/                # 18 файлов — самая большая папка:
│   │                         # dashboard, vets/vetForm/vetRequests/vetSchedule,
│   │                         # services/serviceForm, schedule, animals/animalEditForm,
│   │                         # clients/clientForm/clientAnimalForm/clientAppointmentForm,
│   │                         # medcards/medcard, admins/adminForm
│   └── errors/               # 403.pug, 404.pug
│
├── public/                   # статические файлы (раздаются express.static)
│   ├── css/style.css         # общие стили: layout, sidebar, кнопки, badges
│   ├── js/                   # клиентский JS
│   ├── images/               # логотипы
│   └── uploads/              # загруженные пользователями фото
│       ├── vets/
│       ├── animals/
│       ├── visits/
│       ├── services/
│       └── admins/
│
├── scripts/                  # утилиты, запускаемые вручную через npm
│   ├── seed.js               # `npm run seed` — заполнение БД шаблонными данными
│   └── strip-comments.js     # удаляет комментарии из всех .js/.pug/.sql
│
├── test/                     # тесты (если есть)
│
└── docs/
    └── Structure.md          # этот файл
```

---

## 2. Что делает каждый файл

### Точка входа

- **server.js** — создаёт Express app, подключает body-parser, session, flash, статику,
  кладёт `userId/role/isSuperAdmin` в `res.locals` (чтобы Pug-шаблоны их видели),
  запускает миграции и слушает порт.

### config/

- **db.js** — `new Pool({ connectionString: process.env.DATABASE_URL })`.
  Экспортирует `query(sql, params)` и сам `pool`. Все модели импортируют его.
- **session.js** — `express-session` + `connect-pg-simple`. Сессии хранятся
  в таблице `user_sessions` в PostgreSQL → переживают рестарт сервера.
- **multer.js** — 5 разных middleware для загрузки файлов (фото в `uploads/`,
  xlsx в память — для парсинга). Лимит 5 МБ, фильтр по mime-типу.
- **clinic.js** — читает `CLINIC_OPEN_HOUR`, `CLINIC_CLOSE_HOUR`,
  `CLINIC_SLOT_MINUTES` из .env. Функция `buildSlotTimes()` — генерирует
  массив времён вида `['09:00','09:15',...,'18:45']`.

### db/migrations.js

Запускается при старте сервера. Создаёт 11 таблиц `IF NOT EXISTS`:
`users → admin_profiles → clients → vets → animals → services →
schedule_slots → appointments → med_cards → visits → visit_photos`.

Создаёт супер-админа из `SUPER_ADMIN_EMAIL/PASSWORD` если в `users`
нет ни одной записи с `is_super_admin=TRUE`.

### middleware/

- **auth.js** — функции-привратники для роутов. Проверяют `req.session.role`
  и либо вызывают `next()`, либо рендерят `errors/403`.
  - `isSuperAdmin` — отдельно для `/admin/admins/*` (только супер-админ
    может управлять другими администраторами).

### models/ (слой данных)

Каждый файл — объект с асинхронными методами, делающий SQL-запросы.
Никакого ORM — чистый `db.query(text, params)`.

Пример (`vetModel.js`): `findAll`, `findById`, `findByUserId`, `create`,
`update`, `delete`, `getAllSpecializations`.

### controllers/

Каждый метод — `async (req, res) => {...}`. Структура:
1. Достать данные из сессии / `req.params` / `req.body` / `req.file(s)`.
2. Валидация.
3. Один или несколько вызовов `XxxModel.method(...)`.
4. `res.render('view', { data })` или `res.redirect(...)` или `res.json(...)`.

### routes/

Связывают URL + HTTP-метод + middleware + контроллер.
Пример: `router.post('/vets/:id/delete', isAdmin, adminController.postDeleteVet)`.

### views/ (Pug)

Все шаблоны наследуют `layout/base.pug` через `extends`. Внутри используют
блок `content`. Передаваемые контроллером переменные доступны напрямую.

Глобальные переменные из `res.locals` (видны во всех шаблонах):
`role`, `isAuthenticated`, `isSuperAdmin`, `flash`.

---

## 3. Путь HTTP-запроса от фронта до БД и обратно

Пример: **клиент жмёт «Удалить питомца»**.

```
[Браузер]
    │
    │  POST /client/animals/42/delete
    │  Cookie: connect.sid=...   (id сессии)
    ▼
[Express: server.js]
    │
    │  1. bodyParser — парсит form-data
    │  2. session middleware — читает cookie, ходит в БД (таблица user_sessions),
    │                          восстанавливает req.session = { userId, role, ... }
    │  3. flash middleware — подключает req.flash()
    │  4. локальный middleware — кладёт role/userId в res.locals
    ▼
[routes/index.js]
    │  match: /client/* → routes/clientRoutes.js
    ▼
[routes/clientRoutes.js]
    │  match: POST /animals/:id/delete → isClient middleware
    ▼
[middleware/auth.js → isClient]
    │  Проверка: req.session.userId есть? role === 'client'?
    │  Если нет → res.status(403).render('errors/403')   ← запрос обрывается
    │  Если да → next()
    ▼
[controllers/animalController.js → postDeleteAnimal]
    │  1. const { id } = req.params
    │  2. AnimalModel.findById(id)              ─────► [models/animalModel.js]
    │                                                       │
    │                                                       │  db.query(
    │                                                       │   'SELECT * FROM animals WHERE id=$1',
    │                                                       │   [id])
    │                                                       ▼
    │                                                  [config/db.js → pg.Pool]
    │                                                       │
    │                                                       │  TCP → PostgreSQL :5433
    │                                                       ▼
    │                                                  [PostgreSQL]
    │                                                       │
    │                                                       │  возвращает rows
    │                                                       ▼
    │  3. Проверка animal.client_id === client.id (защита: не свой питомец → 403)
    │  4. AnimalModel.delete(id) → ещё один SQL: DELETE FROM animals WHERE id=$1
    │     (cascade удалит med_cards, visits, visit_photos благодаря FK ON DELETE CASCADE)
    │  5. req.flash('success', 'Питомец удалён')
    │  6. res.redirect('/client/animals')
    ▼
[Браузер]
    │
    │  HTTP 302 Location: /client/animals
    │
    │  Следующий GET /client/animals →
    │     animalController.getAnimals → AnimalModel.findByClientId →
    │     SELECT ... → res.render('client/animals', { animals }) →
    │     Pug компилирует шаблон → HTML →
    │
    ▼  HTTP 200 + HTML с обновлённым списком
[Браузер рендерит страницу]
```

### Что важно

- **Один pool.query() = один поход в БД**. Контроллер может сделать
  несколько запросов в одном HTTP-запросе.
- **Сессия** — НЕ в памяти. Каждый запрос → пакет к таблице `user_sessions`.
- **Cascade-delete** в SQL делает работу за нас: удалили `clients` →
  каскадом удалятся его `animals` → их `med_cards` → `visits` → фото.

### Формы и redirect (PRG-паттерн)

Все мутирующие действия следуют **POST → Redirect → GET**:
- POST форма → контроллер делает изменения → `res.redirect(...)`.
- Браузер делает новый GET → видим свежие данные.
- Защищает от двойной отправки формы при F5.

### AJAX (через apiRoutes)

Из `client/newAppointment.pug` JS делает `fetch('/api/slots?vetId=X&date=Y')`
→ `scheduleModel.findAvailableSlots()` → `res.json(slots)` → JS заполняет dropdown.
Без перезагрузки страницы.

---

## 4. О CSS (кратко)

- **Глобальный CSS**: `public/css/style.css` — общий layout: `.container`,
  `.dashboard` (grid sidebar + main), `.sidebar`, `.btn`, `.flash-message`,
  `.dashboard-title`.
- **Локальный CSS внутри Pug**: каждая страница имеет блок `style.` в конце —
  стили специфичные для этого экрана (таблицы, фильтры, бейджи).
  Это удобно для курсовой: всё в одном файле, нет билд-процесса.
- **Единый дизайн-токен**: основной цвет `#2E5FA3` (синий), вторичный `#6c757d`,
  опасность `#dc3545`. Кнопки `.btn`/`.btn-sm`/`.btn-lg` имеют одинаковую
  высоту (42/32/44 px) и единые `box-sizing:border-box`.
- **Таблицы**: `.data-table` с `table-layout:fixed` — фикс-ширина колонок,
  длинный текст обрезается через `-webkit-line-clamp` + `text-overflow:ellipsis`.
  Полный текст показывается в `title=...` (tooltip).
- **Без сборки**: никаких SASS/PostCSS/webpack. Чистый CSS, отдается статикой.

---

## 5. Сессии: где, как, какое подключение

### Где хранятся

В **PostgreSQL**, в таблице `user_sessions` (создаётся автоматически при
старте через `createTableIfMissing: true`). Колонки:
- `sid` (PK) — id сессии (то же, что в cookie `connect.sid`).
- `sess` (JSONB) — `{ userId, role, isSuperAdmin, fullName, ... }`.
- `expire` (TIMESTAMP) — срок жизни.

### Как работает поток

1. **Логин**: `authController.postLogin` проверяет пароль через bcrypt,
   пишет `req.session.userId / role / isSuperAdmin`. `express-session`
   автоматически делает INSERT в `user_sessions` и ставит cookie клиенту.
2. **Любой следующий запрос**: middleware читает cookie `connect.sid`,
   делает `SELECT sess FROM user_sessions WHERE sid=$1`, восстанавливает
   `req.session`.
3. **Изменение сессии**: `req.session.something = ...` → автосохранение
   в БД (UPDATE).
4. **Logout**: `req.session.destroy()` → DELETE FROM user_sessions.

### Какое подключение к БД

**Один общий `pg.Pool`** из `config/db.js`:
```js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

`DATABASE_URL` в .env:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/vetdb
```

- Хост: `localhost:5433` (PostgreSQL в docker-compose).
- БД: `vetdb`.
- Пользователь: `postgres`, пароль: `postgres`.

Этот же pool используется и моделями, и `connect-pg-simple` для сессий
(в `config/session.js`):
```js
const { pool } = require('./db');
new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true })
```

### Настройки cookie

В `config/session.js`:
- `httpOnly: true` — JS на клиенте не может прочитать cookie.
- `secure: true` в production — cookie шлётся только по HTTPS.
- `maxAge: 24 часа` — после этого нужно логиниться заново.
- `saveUninitialized: false` — гостям не создаём пустые записи в БД.

---

## 6. Что произойдёт, если вручную удалить ВСЕХ администраторов из БД

### Сценарий

```sql
DELETE FROM users WHERE role = 'admin';
```

Это удалит и обычных админов, и супер-админа.

### Что будет дальше — по шагам

1. **Активные сессии админов остаются в таблице `user_sessions`** —
   их `sess.userId` теперь указывает на несуществующих юзеров.
   Cookie у админов ещё валидна.

2. **Админ открывает любую страницу `/admin/...`**:
   - middleware `isAdmin` смотрит `req.session.role === 'admin'` → ✅ true.
   - Контроллер делает SQL-запрос: например, `getDashboard` дергает
     `AdminModel.getStats()` или `VetModel.findAll()` — это работает,
     там нет ссылок на удалённого юзера.
   - **Но**: некоторые контроллеры дергают `UserModel.findById(req.session.userId)`
     для подгрузки профиля — там вернётся `undefined`.
   - Если код обращается к `user.email` и т.п. — **TypeError**, 500.
   - Если код не обращается — страница откроется, но данные о текущем
     админе будут пустыми.

3. **При следующем логине админа** — `UserModel.findByEmail(email)` вернёт
   `null` → «Неверные учётные данные». Зайти невозможно.

4. **При рестарте сервера** запускаются миграции (`db/migrations.js`):

   ```js
   const superAdminCheck = await db.query(
     `SELECT id FROM users WHERE is_super_admin = TRUE LIMIT 1`
   );
   if (superAdminCheck.rows.length === 0) {
     // создать супер-админа из .env
   }
   ```

   **Это спасение**: если `SUPER_ADMIN_EMAIL` и `SUPER_ADMIN_PASSWORD`
   заданы в `.env` → миграция пересоздаст супер-админа с теми же
   credentials. Через минуту после рестарта можно снова логиниться.

5. **Если в .env переменные не заданы**, миграция выбросит ошибку:
   ```
   throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env');
   ```
   В этом случае нужно либо:
   - прописать значения в `.env` и перезапустить сервер,
   - или вручную вставить запись в БД:
     ```sql
     INSERT INTO users (email, password_hash, role, is_super_admin)
     VALUES ('rescue@vetclinic.ru',
             '$2a$10$...bcrypt-хэш...',
             'admin', TRUE);
     ```

6. **Сторонние последствия от каскадов**:
   - `users` имеет FK `ON DELETE CASCADE` для `admin_profiles`, `clients`, `vets`.
   - При `DELETE FROM users WHERE role='admin'` каскадно удалятся
     `admin_profiles` — это нормально, обычные клиенты/врачи не пострадают.
   - **НО**: записи в `appointments`, `med_cards`, `visits` ссылаются на
     `clients`/`vets`/`animals`, а не на `users` напрямую — они останутся целы.

### Краткий итог

> Удалить всех админов **не убивает приложение фатально**. Клиенты
> и врачи продолжают работать. При следующем рестарте сервера супер-админ
> восстанавливается автоматически из `.env`. Если `.env` пустой —
> рестарт упадёт, и нужно либо заполнить переменные, либо вставить
> запись в БД вручную с хэшем пароля.

### Рекомендация на будущее

Сделать колонку `users.role` защищённой на уровне БД — например, триггер,
запрещающий удаление последнего супер-админа. Сейчас защита есть только
в UI и в контроллере, но не на уровне SQL.
