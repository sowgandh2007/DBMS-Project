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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="fixed inset-0 bg-transparent" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div 
        className={`relative w-full max-w-[95vw] ${maxWidth} bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 flex flex-col gap-4 z-10 max-h-[90vh] overflow-y-auto my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="pr-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 text-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}
