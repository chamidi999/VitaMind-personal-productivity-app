import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Zap, BrainCircuit, User } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../../types';

interface AIOracleViewProps {
  chat: ChatMessage[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AIOracleView({ chat, input, isLoading, onInputChange, onSubmit }: AIOracleViewProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto h-175 flex flex-col">
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence mode="popLayout">
          {chat.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-10 w-10 min-w-10 rounded-2xl flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-royal text-white' : 'bg-card border border-white/5 text-royal'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <BrainCircuit size={20} />}
                </div>
                <div className={`p-5 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-royal/10 text-white border border-royal/20 rounded-tr-none' 
                    : 'bg-card text-gray-300 border border-white/5 rounded-tl-none'
                }`}>
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-royal animate-pulse">
                  <BrainCircuit size={20} />
                </div>
                <div className="bg-card p-4 rounded-3xl rounded-tl-none border border-white/5">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-royal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-royal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-royal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <div className="mt-8 bg-card p-4 rounded-3xl border border-white/5">
        <form onSubmit={onSubmit} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Ask the Oracle about your lifestyle complexity..." 
            value={input}
            onChange={e => onInputChange(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-background border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-royal/50 transition-all text-white placeholder:text-gray-600"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-royal text-white px-6 rounded-2xl font-bold hover:bg-royal-light transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-[10px] text-gray-600 mt-3 text-center uppercase tracking-[0.2em]">
          <Zap size={10} className="inline mr-1" /> Powered by Zenith Neural Infrastructure
        </p>
      </div>
    </motion.div>
  );
}
