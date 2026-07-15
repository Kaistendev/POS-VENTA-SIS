import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { useAiStore } from '../../store/useAiStore.ts';
import AiDraftModal from './AiDraftModal.tsx';

export default function AiChatPanel() {
  const { messages, isLoading, isOpen, addMessage, setLoading, toggleOpen, clearMessages } = useAiStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [draftModal, setDraftModal] = useState<{ type: 'DRAFT_PRODUCT' | 'DRAFT_CLIENT' | 'DRAFT_SALE'; payload: Record<string, unknown> } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: '¡Hola! Soy el asistente IA de InventarioPOS. Puedes preguntarme sobre ventas, stock, productos, ganancias o cualquier dato del sistema.',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    setInput('');
    addMessage({ role: 'user', content: query });
    setLoading(true);

    try {
      const res = await window.api.askAi(query);
      if (res.success && res.data) {
        if (res.data.type === 'ACTION') {
          addMessage({
            role: 'assistant',
            content: `Datos extraídos. Revisa y confirma en la ventana que aparece.`,
          });
          setDraftModal({ type: res.data.action, payload: res.data.payload });
        } else {
          addMessage({ role: 'assistant', content: res.data.content });
        }
      } else {
        addMessage({
          role: 'assistant',
          content: res.message || 'Ocurrió un error al procesar tu consulta.',
        });
      }
    } catch {
      addMessage({
        role: 'assistant',
        content: 'Error de conexión. Asegúrate de que Ollama esté ejecutándose.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
          title="Asistente IA"
        >
          <MessageCircle size={24} />
        </button>
      )}

      <div className={cn(
        "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)]",
        "bg-[#1a1b23] border border-[#2e303a] rounded-2xl shadow-2xl flex flex-col",
        "transition-all duration-300 origin-bottom-right",
        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e303a] shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            <span className="font-semibold text-white text-sm">Asistente IA</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-1.5 rounded-lg hover:bg-[#2e303a] text-gray-400 hover:text-white transition-colors"
                title="Limpiar conversación"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={toggleOpen}
              className="p-1.5 rounded-lg hover:bg-[#2e303a] text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#3a3c4a] [&::-webkit-scrollbar-thumb]:rounded-full">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === 'user'
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-[#252630] text-gray-200 rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <span className="text-[10px] font-bold text-white">U</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="bg-[#252630] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-[#2e303a] shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre ventas, stock..."
              disabled={isLoading}
              className="flex-1 bg-[#252630] border border-[#3a3c4a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 text-center">
            El asistente usa IA local (Ollama). Los datos son 100% offline.
          </p>
        </div>
      </div>

      <AiDraftModal
        isOpen={draftModal !== null}
        onClose={() => setDraftModal(null)}
        draftType={draftModal?.type ?? null}
        draftPayload={draftModal?.payload ?? {}}
      />
    </>
  );
}