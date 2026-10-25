import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'indigo', 
  trend,
  className = '' 
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    brand: {
      bg: 'bg-brand-500/10',
      text: 'text-brand-400',
      border: 'border-brand-500/20'
    },
    teal: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      border: 'border-teal-500/20'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20'
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20'
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card rounded-2xl p-5 flex flex-col justify-between glass-card-hover ${className}`}>
      <div className="flex items-center justify-between text-slate-400 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center border ${scheme.border}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-black text-white tracking-tight">{value}</div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
        <span className="text-[11px] text-slate-400">{subtitle}</span>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
