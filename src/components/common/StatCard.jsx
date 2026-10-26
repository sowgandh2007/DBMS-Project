import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'teal', 
  trend,
  className = '' 
}) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-100'
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100'
    },
    lavender: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100'
    },
    peach: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100'
    }
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div className={`premium-card rounded-2xl p-5 flex flex-col justify-between premium-card-hover ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center border ${scheme.border} shadow-sm`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{value}</div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-500 font-medium">{subtitle}</span>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
