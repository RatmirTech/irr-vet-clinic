# Ветеринарная клиника - Web Application

КАИ 4311 Курсовая по веб программированию

Полнофункциональное веб-приложение для управления ветеринарной клиникой с поддержкой различных ролей пользователей.

## Технологический стек

- **Сервер**: Node.js + Express
- **Шаблонизатор**: Pug
- **База данных**: PostgreSQL
- **ORM/Queries**: pg (node-postgres)
- **Аутентификация**: bcryptjs, express-session
- **Файловые загрузки**: Multer
- **Flash-сообщения**: connect-flash
- **Стили**: CSS (CSS Custom Properties)
- **Клиентский JS**: Vanilla JS (vanilla form validation)
- **Тесты**: Mocha, Chai, Supertest

## Структура проекта

```
.
├── config/              # Конфигурация приложения
│   ├── db.js           # Подключение PostgreSQL
│   ├── session.js      # express-session конфигурация
│   └── multer.js       # Multer загрузчики (вет, животные, услуги)
├── controllers/         # Бизнес-логика (auth, admin, vet, client, animals, appointments, medcards)
├── models/             # Слой доступа к данным
├── routes/             # Express маршруты (auth, guest, client, vet, admin, api)
├── middleware/         # Middleware (auth guards, error handler)
├── views/              # Pug шаблоны (по ролям)
├── public/
│   ├── css/            # Стили (style.css, auth.css, dashboard.css, cards.css)
│   ├── js/             # Клиентский JS (validation, AJAX, appointment slots)
│   └── images/         # Изображения (placeholder-animal.svg)
├── db/
│   ├── schema.sql      # Schema с 9 таблицами
│   ├── seed.sql        # Начальные данные
│   └── migrations.js   # Автомиграции при запуске
├── test/               # Mocha тесты (auth, animals, appointments)
├── uploads/            # Каталог загруженных файлов (создаётся автоматически)
└── server.js           # Точка входа
```

## 📚 Документация

- **[ACCOUNTS.md](./ACCOUNTS.md)** - Управление аккаунтами, восстановление администратора
- **[TESTING.md](./TESTING.md)** - Полный сценарий тестирования (браузеры, вкладки, валидация)
- **[FAQ.md](./FAQ.md)** - Ответы на частые вопросы

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/RatmirTech/irr-vet-clinic.git
cd irr-vet-clinic
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Конфигурация переменных окружения

Создайте файл `.env` в корневой директории:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=vetclinic_user
DB_PASSWORD=vetclinic_password
DB_NAME=vetclinic_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret
SESSION_SECRET=your-secret-key-here
```

### 4. Подготовка базы данных

**Вариант A: Автоматически (рекомендуется)**
При первом запуске сервера выполняются миграции автоматически:

```bash
npm start
```

**Вариант B: Вручную**
```bash
# Создайте пользователя PostgreSQL
psql -U postgres
CREATE USER vetclinic_user WITH PASSWORD 'vetclinic_password';
CREATE DATABASE vetclinic_db OWNER vetclinic_user;
\q

# Выполните схему и seed
psql -U vetclinic_user -d vetclinic_db -f db/schema.sql
psql -U vetclinic_user -d vetclinic_db -f db/seed.sql
```

### 5. Запуск приложения

```bash
npm start
```

Приложение доступна на `http://localhost:3000`

### 6. Запуск тестов

```bash
npm test
```

## Роли пользователей и функции

### 👤 Гость
- Просмотр списка ветеринаров
- Просмотр услуг
- Просмотр информации о клинике
- Регистрация / Вход

### 🐾 Клиент
- Личный кабинет с статистикой
- Управление животными (добавление, редактирование, удаление с фото)
- Запись на приём к ветеринару (многошаговая форма с выбором дня/времени через AJAX)
- Просмотр своих записей (фильтрация по статусу)
- Отмена записей
- Просмотр медкарт своих животных с историей приёмов
- Редактирование профиля

### 🩺 Ветеринар
- Кабинет с ближайшими приёмами
- Просмотр расписания на дату
- Подтверждение/отмена записей
- Просмотр и управление медкартами животных
- Добавление записей о приёмах (диагноз, лечение, назначения)
- Редактирование и удаление записей о приёмах

### 🔐 Администратор
- Управление ветеринарами (добавление, редактирование, удаление)
- Управление услугами (создание, редактирование, удаление)
- Управление расписанием (генерация слотов по датам)
- Просмотр списка клиентов (с пагинацией)
- Статистика системы

## Технические особенности

### Аутентификация
- Регистрация с валидацией email и пароля
- Хеширование паролей bcryptjs
- Сессии с cookie (24-часовой maxAge)
- Автоматический логин после регистрации
- Защита роутов через middleware

### Валидация
- Клиентская валидация (public/js/validate.js):
  - Проверка пустых полей
  - Формат email
  - Длина пароля (минимум 6 символов)
  - Дата не раньше сегодня
- Серверная валидация в контроллерах

### Файловые загрузки
- Multer для загрузки фото (вет, животные, услуги)
- Разные каталоги для разных типов (`uploads/vets/`, `uploads/animals/`, `uploads/services/`)
- Автоматическое создание каталогов
- Placeholder-изображение если фото не загружено

### Flash-сообщения
- connect-flash для уведомлений об успехе/ошибке
- Автоматический вывод в layout (success, error, warning, info)
- CSS анимация появления

### API
- RESTful `/api/slots` - получение доступных слотов по дате и ветеринару
- Используется в многошаговой форме записи на приём (AJAX)

### Пагинация
- Реализована для таблицы клиентов в админ-панели
- 20 записей на странице
- Навигация на предыдущую/следующую страницу

### Миграции БД
- Автоматические миграции при запуске
- Таблица `migrations` для отслеживания статуса
- Безопасное запуск seed-данных (игнорирует дубликаты)

## Учётные данные для тестирования

### Administrator
- **Email**: admin@vetclinic.ru
- **Пароль**: password

### Ветеринар (примеры)
- **Email**: vet1@clinic.ru
- **Пароль**: password

## Основные маршруты

### Гость
- `GET /` - Главная страница
- `GET /vets` - Список ветеринаров
- `GET /vets/:id` - Профиль ветеринара
- `GET /services` - Список услуг
- `GET /auth/login` - Форма входа
- `GET /auth/register` - Форма регистрации

### Клиент
- `GET/POST /client/dashboard` - Личный кабинет
- `GET/POST /client/profile` - Редактирование профиля
- `GET/POST /client/animals` - Управление животными
- `GET/POST /client/appointments` - Мои записи
- `GET /client/medcards` - Медкарты животных

### Ветеринар
- `GET /vet/dashboard` - Кабинет с приёмами
- `GET /vet/schedule` - Расписание по датам
- `GET /vet/medcards` - Список медкарт
- `GET /vet/medcards/:animalId` - Медкарта животного
- `POST /vet/appointments/:id/confirm` - Подтверждение записи

### Администратор
- `GET /admin/dashboard` - Статистика
- `GET/POST /admin/vets` - Управление ветеринарами
- `GET/POST /admin/services` - Управление услугами
- `GET /admin/schedule` - Управление расписанием
- `GET /admin/clients` - Список клиентов (с пагинацией)

### API
- `GET /api/slots?vetId=:id&date=:date` - Доступные слоты

## Тестирование

Все тесты написаны с использованием Mocha, Chai и Supertest:

```bash
# Запуск всех тестов
npm test

# Тесты охватывают:
# - Регистрацию и вход (auth.test.js)
# - Создание животных (animals.test.js)
# - Создание и отмену записей (appointments.test.js)
```

## Полный сценарий использования

1. **Гость регистрируется** → `POST /auth/register`
2. **Добавляет питомца** → `POST /client/animals`
3. **Записывается на приём** → `POST /client/appointments` (с выбором слота через AJAX)
4. **Ветеринар подтверждает** → `POST /vet/appointments/:id/confirm`
5. **Ветеринар добавляет диагноз** → `POST /vet/medcards/:animalId/visits`
6. **Клиент видит медкарту** → `GET /client/medcards/:medCardId`

## Проблемы и решения

### Миграции не выполняются
Убедитесь, что `NODE_ENV` не равен `test`. Проверьте права доступа БД.

### Фото не загружаются
Убедитесь, что каталог `uploads/` существует и имеет права на запись.
Проверьте `config/multer.js` для путей к каталогам.

### AJAX слоты не загружаются
Убедитесь, что в расписании есть доступные слоты для выбранной даты.
Проверьте консоль браузера для ошибок.

## Лицензия

ISC

## Автор

РатмирТех
