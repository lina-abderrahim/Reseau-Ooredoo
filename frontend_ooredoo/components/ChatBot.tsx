'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Cpu } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const SUGGESTIONS = [
  "Comment créer une carte ?",
  "Comment créer une demande ?",
  "Comment associer une carte à une demande ?",
  "Comment modifier une carte refusée ?",
  "Comment importer un fichier Shapefile ?",
  "Comment publier une carte ?",
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: messageText }),
      });
      const data = await res.json();
      const botText = typeof data.answer === 'string' ? data.answer : "Désolé, je rencontre une difficulté technique.";
      setMessages(prev => [...prev, { role: 'ai', text: botText }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Erreur : impossible de joindre le serveur." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-white border border-gray-100 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">

          {/* Header */}
          <div className="bg-[#ED1C24] p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest italic">Ooredoo Assistant</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[9px] text-white/80 font-bold uppercase">En ligne</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center mt-6 space-y-3">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <Cpu size={32} />
                  </div>
                  <h4 className="text-xs font-black text-gray-800 uppercase italic">Support Technique SIG</h4>
                  <p className="text-gray-400 text-[10px] px-6 leading-relaxed uppercase font-bold tracking-tighter">
                    Une question sur l'application ? Je suis là pour vous aider.
                  </p>
                </div>

                {/* ✅ Suggestions rapides */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Questions fréquentes</p>
                  {SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion)}
                      className="w-full text-left px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-700 hover:border-[#ED1C24] hover:text-[#ED1C24] transition-all shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-50 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Écrivez ici..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-5 py-3 text-[11px] font-bold focus:ring-2 focus:ring-red-500/20 text-gray-900 outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-[#ED1C24] text-white p-3 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#ED1C24] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 hover:-rotate-3 transition-all active:scale-95 group"
      >
        {isOpen
          ? <X size={28} />
          : <MessageSquare size={28} className="group-hover:scale-110 transition-transform" />
        }
      </button>
    </div>
  );
}


