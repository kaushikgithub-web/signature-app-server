const mongoose = require('mongoose');

const SignatureFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['signature'], default: 'signature' },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  page: Number,
  required: { type: Boolean, default: true },
  assignedTo: String,
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: String,
  path: String,
  size: Number,
  createdAt: Date,
  status: {
    type: String,
    enum: ['pending', 'signed', 'completed'],
    default: 'pending'
  },
  signers: [
    {
      id: String,
      name: String,
      email: String,
      status: { type: String, enum: ['pending', 'signed'], default: 'pending' }
    }
  ],
  signatureFields: [SignatureFieldSchema]
});

module.exports = mongoose.model('Document', DocumentSchema);
