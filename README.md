# RAG Chat System

## What is this project?

This is a **RAG (Retrieval-Augmented Generation)** system that lets users upload PDF documents and have intelligent conversations about their content. Think of it as "ChatGPT for your documents" - you can ask questions and get answers based on what's actually in your PDFs.

## What does RAG mean?

**RAG = Retrieval-Augmented Generation**

1. **Retrieval**: Find relevant information from your documents
2. **Augmented**: Add that information to the AI's context
3. **Generation**: Let AI generate answers based on your document content

Instead of AI making up answers, it uses YOUR document content to answer questions accurately.

## Architecture Overview

```
[PDF Upload] → [Text Extraction] → [Chunking] → [Embeddings] → [Vector Database]
                                                                      ↓
[User Question] → [Vector Search] → [Relevant Chunks] → [AI + Context] → [Answer]
```

## Tech Stack Explained

### Frontend
- **Next.js 14** - React framework with server components
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend  
- **Server Actions** - Next.js server-side functions (no separate API needed)
- **LangChain** - Framework for building AI applications
- **OpenAI GPT-4** - Large Language Model for generating responses

### Databases
- **MongoDB** - Stores document metadata and chat sessions
- **Qdrant** - Vector database for storing document embeddings

### AI/ML
- **OpenAI Embeddings** - Converts text to numerical vectors
- **Vector Similarity Search** - Finds relevant document chunks

## How it Works - Step by Step

### 1. Document Upload Flow
```javascript
// User uploads PDF
PDF File → PDFLoader (LangChain) → Extract text
→ TextSplitter → Create chunks (1000 chars each)
→ OpenAI Embeddings → Convert chunks to vectors
→ Store in Qdrant (vectors) + MongoDB (metadata)
```

### 2. Chat Flow
```javascript
// User asks question
Question → OpenAI Embeddings → Query vector
→ Qdrant similarity search → Get relevant chunks
→ Combine with chat history → Send to GPT-4
→ Generate response → Save to MongoDB → Show to user
```

## Key Concepts to Understand

### 1. **Embeddings**
- Text converted to numbers (vectors)
- Similar meaning = similar numbers
- Allows mathematical comparison of text

### 2. **Chunking**
- Breaking large documents into smaller pieces
- Each chunk = ~1000 characters with 200 character overlap
- Prevents losing context at boundaries

### 3. **Vector Similarity Search**
- Mathematical way to find "similar" text
- User question → find most relevant document chunks
- Uses cosine similarity or similar metrics

### 4. **Server Components vs Client Components**
- **Server**: Runs on server, can't use useState/hooks
- **Client**: Runs in browser, can use React state
- Next.js 14 encourages server-first approach

## Getting Started

### Prerequisites
```bash
Node.js 18+
MongoDB Atlas account (free)
Qdrant Cloud account (free)
OpenAI API key
```

### Installation
```bash
# Clone and install
git clone [your-repo]
cd rag-chat-system
npm install

# Required packages
npm install @langchain/qdrant @langchain/openai langchain @langchain/core
npm install @qdrant/js-client-rest
npm install mongoose lucide-react
```

### Environment Setup
```bash
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
OPENAI_API_KEY=sk-your-openai-key
QDRANT_URL=https://your-cluster.qdrant.cloud:6333
QDRANT_API_KEY=your-qdrant-key
```

## Understanding the Code

### 1. Start with the Data Flow

**Look at `app/actions/document.ts`** first:
```javascript
// This is where PDFs become searchable data
uploadDocument() // Handles the entire pipeline
```

### 2. Understand Server Actions

Server Actions are Next.js functions that run on the server:
```javascript
"use server" // This makes it a server action

export async function sendMessage(sessionId, message) {
  // This runs on server, has access to databases
}
```

### 3. Study the RAG Chain

In `app/actions/chatMessage.ts`:
```javascript
const ragChain = RunnableSequence.from([
  {
    context: (input) => retriever.invoke(input.question), // Get relevant chunks
    chat_history: () => chatHistory,                      // Add conversation context
    question: (input) => input.question,                  // User's question
  },
  ragPrompt,    // Combine into prompt
  llm,          // Send to AI
  new StringOutputParser(), // Parse response
])
```

### 4. Component Communication

```
ChatPageWrapper (state management)
├── DocumentUploader (uploads, shows document list)  
└── ChatBox (handles conversations)
```

State flows down via props, events flow up via callbacks.

## Key Files to Study (In Order)

1. **`app/page.tsx`** - Entry point, understand server components
2. **`components/ChatPageWrapper.tsx`** - State management pattern
3. **`app/db/`** - Database schemas, understand data structure
4. **`app/actions/document.ts`** - PDF processing pipeline
5. **`app/actions/chatMessage.ts`** - RAG implementation
6. **`lib/utils/chat.ts`** - Shared configurations
7. **Components** - UI layer understanding

## Testing Your Understanding

Try these experiments:

1. **Upload a PDF** - Watch console logs, check MongoDB & Qdrant
2. **Ask questions** - See what chunks are retrieved
3. **Modify chunk size** - See how it affects responses
4. **Change system prompt** - Alter AI behavior
5. **Add logging** - Trace the data flow

## Common Issues & Solutions

### "Can't use useState in server component"
- Server components can't have state
- Use client components ('use client') for interactivity
- Lift state up to client wrapper

### Multiple chat sessions created
- Check for existing sessions before creating new ones
- Implement proper session management

## Learning Resources

### LangChain
- [LangChain Docs](https://docs.langchain.com/)
- [RAG Tutorial](https://docs.langchain.com/docs/use-cases/question-answering)

### Vector Databases
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Understanding Embeddings](https://openai.com/blog/introducing-text-and-code-embeddings)

### Next.js 14
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

## Next Steps for Learning

1. **Understand each component** individually
2. **Trace data flow** from PDF to answer
3. **Experiment with parameters** (chunk size, retrieval count)
4. **Add features** (chat history, document management)
5. **Optimize performance** (caching, streaming)

## Potential Improvements

- [ ] Add streaming responses
- [ ] Implement chat history sidebar
- [ ] Add document deletion
- [ ] Support multiple file formats
- [ ] Add source citations
- [ ] Implement user authentication
- [ ] Add conversation export
- [ ] Add different LLM tools/models (Google Gemini, Anthropic etc.)

## Contributing

This is a learning project! Try:
- Adding new features
- Improving error handling
- Optimizing performance
- Adding tests
- Improving UI/UX

**Remember**: This project combines many concepts. Don't worry if it feels overwhelming initially. Focus on understanding one piece at a time, and the bigger picture will emerge!

Happy learning! 🎉