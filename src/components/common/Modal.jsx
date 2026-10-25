import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className={`relative w-full ${maxWidth} glass-card rounded-2xl border border-slate-700/60 shadow-2xl p-6 flex flex-col gap-5 z-10 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
