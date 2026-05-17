const multer = require('multer');
const path = require('path');
const fs = require('fs');

const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}. Разрешены: JPEG, PNG, WebP`), false);
  }
};

const vetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/vets');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    cb(null, filename);
  },
});

const uploadVetPhoto = multer({
  storage: vetStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo');

const animalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/animals');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    cb(null, filename);
  },
});

const uploadAnimalPhoto = multer({
  storage: animalStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo');

const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/services');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    cb(null, filename);
  },
});

const uploadServicePhoto = multer({
  storage: serviceStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo');

const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/admins');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const uploadAdminPhoto = multer({
  storage: adminStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo');

const visitStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/visits');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname));
  },
});

const uploadVisitPhotos = multer({
  storage: visitStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
}).array('photos', 10);

const uploadScheduleFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || /\.(xlsx?|csv)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Недопустимый тип файла: ${file.mimetype}. Только XLSX/CSV.`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

module.exports = {
  uploadVetPhoto,
  uploadAnimalPhoto,
  uploadServicePhoto,
  uploadAdminPhoto,
  uploadVisitPhotos,
  uploadScheduleFile,
};
