"use server"

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { QdrantVectorStore } from "@langchain/qdrant"
import { QdrantClient } from "@qdrant/js-client-rest"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import connectDB from '../db/mongo';
import Document from "../db/document"
import { createQdrantClient, embeddings } from "../../lib/chat"

export async function uploadDocument(formData) {
  try {
    const file = formData.get("file")
    
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are supported" }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, `${Date.now()}-${file.name}`)
    await writeFile(filePath, buffer)

    // Load PDF using LangChain
    const loader = new PDFLoader(filePath)
    const docs = await loader.load()

    // Split documents into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
    const splitDocs = await textSplitter.splitDocuments(docs)

    // Create collection name based on file
    const collectionName = file.name

    // initialize Qdrant client
    const client = createQdrantClient();

    // get embeddings from lib and Store in Qdrant
    await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
      client,
      collectionName,
    })

    // Connect to MongoDB and save document metadata
    await connectDB()
    
    const document = new Document({
      filename: file.name,
      originalName: file.name,
      filePath: filePath,
      collectionName: collectionName,
      chunkCount: splitDocs.length,
      uploadedAt: new Date(),
    })

    await document.save()

    // Clean up temporary file (optional)
    // await unlink(filePath)

    return { 
      success: true, 
      documentId: document._id.toString(),
      chunkCount: splitDocs.length,
      collectionName: collectionName
    }

  } catch (error) {
    console.error("Document upload error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

export async function getDocuments() {
  try {
    await connectDB()
    const documents = await Document.find().sort({ uploadedAt: -1 }).lean();
    
    return { 
      success: true, 
      documents 
    }
  } catch (error) {
    console.error("Error fetching documents:", error)
    return { success: false, error: "Failed to fetch documents" }
  }
}

export async function getDocumentById(documentId) {
  try {
    await connectDB()
    const document = await Document.findById(documentId)
    
    if (!document) {
      return { success: false, error: "Document not found" }
    }
    
    return { 
      success: true, 
      document: JSON.parse(JSON.stringify(document))
    }
  } catch (error) {
    console.error("Error fetching document:", error)
    return { success: false, error: "Failed to fetch document" }
  }
}

export async function deleteDocument(documentId) {
  try {
    await connectDB()
    const document = await Document.findById(documentId)
    
    if (!document) {
      return { success: false, error: "Document not found" }
    }

    // Delete from Qdrant
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    })

    await client.deleteCollection(document.collectionName)

    // Delete from MongoDB
    await Document.findByIdAndDelete(documentId)

    return { success: true }
  } catch (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: "Failed to delete document" }
  }
}