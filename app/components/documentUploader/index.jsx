'use client';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useRef, useState, useEffect } from 'react';
import { uploadDocument, getDocuments } from '../../actions/document';
import { deleteChatSession } from '../../actions/chatSession';
import { MessageCircle, Plus, Trash2, FileText } from 'lucide-react';

export default function DocumentUploader({ 
  onUploadComplete, 
  documents = [], 
  selectedDocument, 
  onDocumentSelect,
  chatSessions = [],
  currentSessionId,
  onSessionSelect,
  onNewChat
}) {
  const fileInputRef = useRef();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [localDocuments, setLocalDocuments] = useState(documents);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const loadDocuments = async () => {
    const result = await getDocuments();
    if (result.success) {
      setLocalDocuments(result.documents);
    }
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
  };

  const onUpload = async (file) => {
    setIsUploading(true);
    setUploadStatus('Processing document...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadDocument(formData);
      
      if (result.success) {
        setUploadStatus(`✅ Uploaded! ${result.chunkCount} chunks created.`);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        await loadDocuments();
        onUploadComplete?.(result);
        
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setUploadStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation(); // Prevent triggering session selection
    
    if (!confirm('Delete this chat session?')) return;
    
    const result = await deleteChatSession(sessionId);
    if (result.success) {
      if (selectedDocument) {
        const { getChatSessions } = await import('../../actions/chatSession');
        const sessionsResult = await getChatSessions(selectedDocument._id);
        if (sessionsResult.success) {
          window.location.reload(); // Simple refresh for now
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Upload Document</h2>
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="mb-2"
          onChange={handleChange}
          disabled={isUploading}
        />
        
        <p className="text-sm text-gray-600 mb-2">
          {isUploading ? 'Processing...' : 'Upload a PDF document'}
        </p>
        
        {uploadStatus && (
          <div className={`text-xs p-2 rounded-md text-center ${
            uploadStatus.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : uploadStatus.includes('❌')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {uploadStatus}
          </div>
        )}
        
        {isUploading && (
          <div className="flex justify-center mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <div className="p-4 border-b">
        <h3 className="text-md font-semibold mb-3">Your Documents</h3>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {localDocuments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No documents uploaded yet
            </p>
          ) : (
            localDocuments.map((doc) => (
              <div
                key={doc._id}
                onClick={() => onDocumentSelect?.(doc)}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  selectedDocument?._id === doc._id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{doc.originalName}</h4>
                    <p className="text-xs text-gray-500">
                      {doc.chunkCount} chunks
                    </p>
                  </div>
                  {selectedDocument?._id === doc._id && (
                    <div className="text-blue-600">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedDocument && (
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-semibold">Chat Sessions</h3>
            <Button
              onClick={onNewChat}
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              New Chat
            </Button>
          </div>
          
          <div className="space-y-2 overflow-y-auto h-full">
            {chatSessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No chat sessions yet
              </p>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSessionSelect?.(session.id)}
                  className={`p-2 border rounded cursor-pointer transition-colors group ${
                    currentSessionId === session.id
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {session.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400">
                        {session.messageCount} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}