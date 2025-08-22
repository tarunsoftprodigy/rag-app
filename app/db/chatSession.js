import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const ChatSessionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  title: {
    type: String,
    default: 'New Chat',
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema)

export default ChatSession;