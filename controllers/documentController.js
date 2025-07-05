const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, filename, size } = req.file;
    const relativePath = `uploads/${filename}`;

    const doc = new Document({
      owner: req.user.id,
      originalName: originalname,
      path: relativePath,
      size,
      createdAt: new Date(),
      status: 'pending',
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .populate('signers', 'id name status');

    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('signers', 'id name email status');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(document);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching document', error: err.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const filePath = path.resolve(__dirname, '..', doc.path);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn('Failed to delete file:', err.message);
      }
    });

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

const updateSignatureFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this document' });
    }

    document.signatureFields = fields;
    await document.save();

    res.status(200).json({ message: 'Signature fields saved successfully', document });
  } catch (error) {
    console.error('Error updating signature fields:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  updateSignatureFields, // ✅ export added controller
};
