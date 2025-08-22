'use client';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { createChatSession, getChatSession } from '../../actions/chatSession';
import { sendMessage } from '../../actions/chatMessage';
import ReactMarkdown from "react-markdown"

function ChatBox({ selectedDocument, sessionId, onSessionCreated }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [error, setError] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      loadExistingSession(sessionId);
    } else if (!sessionId && selectedDocument && currentSessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [sessionId, selectedDocument]);

  const loadExistingSession = async (sessionId) => {
    try {
      setError('');
      const result = await getChatSession(sessionId);
      if (result.success) {
        setMessages(result.session.messages.map(msg => ({
          role: msg.role,
          text: msg.content,
          timestamp: msg.timestamp
        })));
        setCurrentSessionId(sessionId);
      } else {
        setError(result.error || 'Failed to load chat session');
      }
    } catch (error) {
      setError('Failed to load chat history');
      console.error('Session loading error:', error);
    }
  };

  const createNewSession = async () => {
    if (!selectedDocument) return null;

    try {
      const result = await createChatSession(selectedDocument._id);
      if (result.success) {
        setCurrentSessionId(result.sessionId);
        onSessionCreated?.(result.sessionId);
        setMessages([]);
        setError('');
        return result.sessionId;
      } else {
        setError(result.error || 'Failed to create chat session');
        return null;
      }
    } catch (error) {
      setError('Failed to initialize chat');
      console.error('Chat initialization error:', error);
      return null;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const question = e.target.elements.question.value.trim();
    
    if (!question || !selectedDocument) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = await createNewSession();
      if (!activeSessionId) return; 
    }

    setMessages((m) => [...m, { role: 'user', text: question }]);
    e.target.reset();
    
    setIsLoading(true);
    setError('');

    try {
      const result = await sendMessage(activeSessionId, question);
      
      if (result.success) {
        setMessages((m) => [...m, { role: 'assistant', text: result.response }]);
      } else {
        setError(result.error || 'Failed to get response');
        setMessages((m) => m.slice(0, -1));
      }
    } catch (error) {
      setError('Failed to send message');
      console.error('Message sending error:', error);
      setMessages((m) => m.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDocument) {
    return (
      <div className="flex flex-col flex-1 h-full">
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">No Document Selected</p>
            <p className="text-sm">Please upload and select a document to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 truncate">
            📄 {selectedDocument.originalName}
          </h3>
          <div className="text-xs text-gray-500">
            {currentSessionId ? (
              sessionId ? 'Existing Chat' : 'New Chat'
            ) : 'Ready to chat'}
          </div>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">
                {currentSessionId && sessionId 
                  ? 'Continue your conversation...' 
                  : 'Ask me anything about your document!'
                }
              </p>
            </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-100 text-indigo-900'
                  : 'bg-purple-100 text-purple-900'
              }`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Form */}
      <form onSubmit={handleSend} className="p-4 border-t flex space-x-2">
        <Input
          name="question"
          placeholder={`Ask about ${selectedDocument.originalName}...`}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}

export default ChatBox;