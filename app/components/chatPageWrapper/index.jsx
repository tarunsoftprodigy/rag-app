"use client";
import { useState } from "react";
import { getChatSessions } from "../../actions/chatSession";
import DocumentUploader from "../documentUploader";
import ChatBox from "../chat";

export default function ChatPageWrapper() {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [chatSessions, setChatSessions] = useState([]);

    const handleDocumentUploaded = (result) => {
        if (result.success) {
            const newDocument = {
                _id: result.documentId,
                originalName: result.documentName || "New Document",
                chunkCount: result.chunkCount,
                collectionName: result.collectionName,
            };

            setDocuments((prev) => [newDocument, ...prev]);
            setSelectedDocument(newDocument);
            setCurrentSessionId(null); 
            setChatSessions([]); 
        }
    };

    const handleDocumentSelected = async (document) => {
        setSelectedDocument(document);
        setCurrentSessionId(null);

        await loadChatSessions(document._id);
    };

    const loadChatSessions = async (documentId) => {
        const result = await getChatSessions(documentId);
        if (result.success) {
            setChatSessions(result.sessions);

            // Auto-select the most recent session
            if (result.sessions.length > 0) {
                setCurrentSessionId(result.sessions[0].id);
            }
        }
    };

    const handleSessionCreated = (sessionId) => {
        setCurrentSessionId(sessionId);
        if (selectedDocument) {
            loadChatSessions(selectedDocument._id);
        }
    };

    const handleSessionSelected = (sessionId) => {
        setCurrentSessionId(sessionId);
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
    };

    return (
        <div className="h-screen flex">
            <aside className="w-1/3 border-r bg-gray-50">
                <DocumentUploader
                    onUploadComplete={handleDocumentUploaded}
                    documents={documents}
                    selectedDocument={selectedDocument}
                    onDocumentSelect={handleDocumentSelected}
                    chatSessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onSessionSelect={handleSessionSelected}
                    onNewChat={handleNewChat}
                />
            </aside>
            <main className="flex-1 flex flex-col bg-gray-100">
                <ChatBox
                    selectedDocument={selectedDocument}
                    sessionId={currentSessionId}
                    onSessionCreated={handleSessionCreated}
                />
            </main>
        </div>
    );
}
