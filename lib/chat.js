import { QdrantVectorStore } from "@langchain/qdrant"
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai"
import { QdrantClient } from "@qdrant/js-client-rest"
import { PromptTemplate } from "@langchain/core/prompts"

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

export const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini", 
  temperature: 0.3,
})

export const createQdrantClient = () => {
  return new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  })
}

const RAG_TEMPLATE = `You are an AI assistant that answers questions based on the provided context from uploaded documents.

Context from the document:
{context}

Chat History:
{chat_history}

Question: {question}

Instructions:
- Answer the question using the provided context from the document
- If the context doesn't contain relevant information, say so clearly
- Be concise but comprehensive in your response
- Reference specific parts of the document when applicable
- Maintain conversation context from the chat history

Answer:`

export const ragPrompt = PromptTemplate.fromTemplate(RAG_TEMPLATE)

export async function createVectorStore(collectionName) {
  const client = createQdrantClient()
  return new QdrantVectorStore(embeddings, {
    client,
    collectionName,
  })
}

export function formatChatHistory(messages, limit) {
  return messages
    .slice(-limit) // Last N messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n')
}

export async function createRetriever(collectionName, k) {
  const vectorStore = await createVectorStore(collectionName)
  return vectorStore.asRetriever({ k })
}