import mongoose from 'mongoose'

const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
    unique: true,
  },
  chunkCount: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema)

export default Document;