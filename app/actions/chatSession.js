"use server"

import ChatSession from "../db/chatSession"
import Document from "../db/document"
import connectDB from "../db/mongo"

export async function createChatSession(documentId) {
  try {
    await connectDB()
    const document = await Document.findById(documentId)
    if (!document) {
      return { success: false, error: "Document not found" }
    }
    const chatSession = new ChatSession({
      documentId: documentId,
      title: `Chat with ${document.originalName}`,
      messages: []
    })
    await chatSession.save()
    return { 
      success: true, 
      sessionId: chatSession._id.toString(),
      documentName: document.originalName
    }
  } catch (error) {
    console.error("Error creating chat session:", error)
    return { success: false, error: "Failed to create chat session" }
  }
}

export async function getChatSession(sessionId) {
  try {
    await connectDB()
    const session = await ChatSession.findById(sessionId).populate('documentId')
    if (!session) {
      return { success: false, error: "Chat session not found" }
    }
    return {
      success: true,
      session: {
        id: session._id.toString(),
        title: session.title,
        messages: session.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        documentName: session.documentId?.originalName || 'Unknown Document',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    }
  } catch (error) {
    console.error("Error fetching chat session:", error)
    return { success: false, error: "Failed to fetch chat session" }
  }
}

export async function getChatSessions(documentId) {
  try {
    await connectDB()
    const sessions = await ChatSession.find({ documentId })
      .sort({ updatedAt: -1 })
      .populate('documentId')
    return {
      success: true,
      sessions: sessions.map(session => ({
        id: session._id.toString(),
        title: session.title,
        messageCount: session.messages.length,
        lastMessage: session.messages.length > 0 
          ? session.messages[session.messages.length - 1].content.slice(0, 100) + '...'
          : 'No messages yet',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        documentName: session.documentId?.originalName || 'Unknown Document'
      }))
    }
  } catch (error) {
    console.error("Error fetching chat sessions:", error)
    return { success: false, error: "Failed to fetch chat sessions" }
  }
}

export async function deleteChatSession(sessionId) {
  try {
    await connectDB()
    const session = await ChatSession.findByIdAndDelete(sessionId)
    if (!session) {
      return { success: false, error: "Chat session not found" }
    }
    return { success: true }
  } catch (error) {
    console.error("Error deleting chat session:", error)
    return { success: false, error: "Failed to delete chat session" }
  }
}