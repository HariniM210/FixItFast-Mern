const mongoose = require('mongoose');

const complaintProgressImageSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true,
  },
  imageType: {
    type: String,
    enum: ['before', 'after'],
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    required: true,
    index: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    public_id: { type: String },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
  }
}, { timestamps: true });

complaintProgressImageSchema.index({ complaint: 1, imageType: 1, uploadedAt: -1 });

module.exports = mongoose.model('ComplaintProgressImage', complaintProgressImageSchema);
