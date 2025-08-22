"use server"

import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import connectDB from "../db/mongo"
import ChatSession from "../db/chatSession"
import { createRetriever, formatChatHistory, llm, ragPrompt } from "../../lib/chat"

export async function sendMessage(sessionId, message) {
  try {
    await connectDB()
    
    const session = await ChatSession.findById(sessionId).populate('documentId')
    if (!session) {
      return { success: false, error: "Chat session not found" }
    }

    const document = session.documentId
    if (!document) {
      return { success: false, error: "Associated document not found" }
    }

    // Create retriever for the document
    const retriever = await createRetriever(document.collectionName, 4)

    // Format chat history for context
    const chatHistory = formatChatHistory(session.messages, 6)

    // Create RAG chain
    const ragChain = RunnableSequence.from([
      {
        context: (input) => retriever.invoke(input.question).then(docs => 
          docs.map(doc => doc.pageContent).join('\n\n')
        ),
        chat_history: () => chatHistory,
        question: (input) => input.question,
      },
      ragPrompt,
      llm,
      new StringOutputParser(), //to get clean string response 
    ])

    const response = await ragChain.invoke({ question: message })

    // Save user message and AI response to session
    session.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: response, timestamp: new Date() }
    )

    await session.save()

    return {
      success: true,
      response: response,
      messageCount: session.messages.length
    }

  } catch (error) {
    console.error("Error sending message:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send message" 
    }
  }
}