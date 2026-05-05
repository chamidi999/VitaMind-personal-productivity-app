import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Zap, BrainCircuit, User, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, ContextSummary } from '../../types';

interface AIOracleViewProps {
  chat: ChatMessage[];
  input: string;
  isLoading: boolean;
  contextSummary: ContextSummary | null;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AIOracleView({ chat, input, isLoading, contextSummary, onInputChange, onSubmit }: AIOracleViewProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [insight, setInsight] = useState('Loading Oracle insight...');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    const loadInsight = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('/api/oracle-daily-insight', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        const topHabit = contextSummary?.topHabits?.[0];
        const topGoal = contextSummary?.activeGoals?.[0];
        const contextualInsight = topHabit && topGoal
          ? `Habit "${topHabit.name}" (${topHabit.streak}-day streak) is supporting your goal "${topGoal.title}" (${topGoal.progress}% complete).`
          : data.insight;
        setInsight(contextualInsight || 'Momentum is stable. Keep advancing one objective at a time.');
      } catch (error) {
        setInsight('Momentum is stable. Keep advancing one objective at a time.');
      }
    };
    loadInsight();
  }, [contextSummary]);

  return (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    className="w-full h-full flex flex-col items-start px-0 pt-2 pb-8">
      <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 md:p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-card border border-white/10 text-royal flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] text-midnight/55 uppercase tracking-[0.2em] mb-1">Proactive Insight</p>
            <p className="text-sm md:text-base text-midnight font-medium">{insight}</p>
          </div>
        </div>
      </div>
      <div className="w-full flex-1 overflow-y-auto pr-1 md:pr-4 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
        <AnimatePresence mode="popLayout">
          {chat.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-10 w-10 min-w-10 rounded-2xl flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-royal text-white' : 'bg-card border border-white/5 text-royal'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <BrainCircuit size={20} />}
                </div>
                <div className={`p-4 md:p-5 rounded-3xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-midnight border border-blue-200 rounded-tr-none shadow-royal/10' 
                    : 'bg-background text-midnight border border-border rounded-tl-none shadow-midnight/5'
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
                <div className="bg-background p-4 rounded-3xl rounded-tl-none border border-border shadow-sm shadow-midnight/5">
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

      <div className="w-full bg-card/95 p-3 md:p-4 rounded-3xl border border-white/10 shadow-lg sticky bottom-0">
        <form onSubmit={onSubmit} className="flex w-full gap-2 md:gap-3">
          <input 
            type="text" 
            placeholder="Ask the Oracle about your lifestyle complexity..." 
            value={input}
            onChange={e => onInputChange(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-white border border-royal rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base outline-none focus:border-royal focus:ring-2 focus:ring-royal/20 transition-all text-midnight placeholder:text-muted-foreground shadow-lg"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-royal text-white px-4 md:px-6 min-w-12 md:min-w-14 rounded-2xl font-bold hover:bg-royal-light transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-[10px] text-midnight/55 mt-3 text-left uppercase tracking-[0.2em]">
          <Zap size={10} className="inline mr-1" /> Powered by VitaMind Neural Infrastructure
        </p>
      </div>
    </motion.div>
  );
}
