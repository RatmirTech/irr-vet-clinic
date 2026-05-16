const multer = require('multer');
const path = require('path');
const fs = require('fs');

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Vet photo upload
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

// Animal photo upload
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

// Service photo upload
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

module.exports = {
  uploadVetPhoto,
  uploadAnimalPhoto,
  uploadServicePhoto,
};
