import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer finished
          setIsActive(false);
          const nextMode = mode === 'work' ? 'break' : 'work';
          setMode(nextMode);
          setMinutes(nextMode === 'work' ? 25 : 5);
          setSeconds(0);
          // Auto-trigger sound or notification here
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, minutes, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(mode === 'work' ? 25 : 5);
    setSeconds(0);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setMinutes(newMode === 'work' ? 25 : 5);
    setSeconds(0);
  };

  return (
    <div className="bg-card border border-white/5 rounded-3xl p-8 flex flex-col items-center shadow-xl">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => switchMode('work')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'work' ? 'bg-royal text-white shadow-lg shadow-royal/20' : 'text-gray-500 hover:text-white'}`}
        >
          <Zap size={16} /> Focus
        </button>
        <button 
          onClick={() => switchMode('break')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'break' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          <Coffee size={16} /> Break
        </button>
      </div>

      <div className="relative h-48 w-48 flex items-center justify-center mb-8">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96" cy="96" r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="96" cy="96" r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="553"
            animate={{ strokeDashoffset: 553 - (553 * (minutes * 60 + seconds)) / (mode === 'work' ? 25 * 60 : 5 * 60) }}
            className={mode === 'work' ? "text-royal" : "text-emerald-500"}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-black tracking-tight tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={toggleTimer}
          className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${isActive ? 'bg-white/10 text-white' : 'bg-royal text-white shadow-lg shadow-royal/20'}`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button 
          onClick={resetTimer}
          className="h-14 w-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-gray-400 transition-all"
        >
          <RotateCcw size={24} />
        </button>
      </div>
      
      <p className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-bold">
        {mode === 'work' ? 'Deep Work Session' : 'Relaxation Phase'}
      </p>
    </div>
  );
}
