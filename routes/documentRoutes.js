const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  updateSignatureFields,
} = require('../controllers/documentController');

const auth = require('../middleware/auth');
const Document = require('../models/Document'); // Import your Document model here

// Setup upload dir
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Upload document
router.post(
  '/upload',
  auth,
  (req, res, next) => {
    upload.single('pdf')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadDocument
);

// Update document status (protected route)
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = status;
    await doc.save();

    res.json({ message: 'Status updated', document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});
router.get('/mydocs', auth, getMyDocuments);
router.get('/:id', auth, getDocumentById);
router.delete('/:id', auth, deleteDocument);
router.put('/:id/fields', auth, updateSignatureFields);

module.exports = router;
