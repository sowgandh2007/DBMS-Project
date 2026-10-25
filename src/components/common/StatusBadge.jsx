import React from 'react';

export default function StatusBadge({ status, type = 'stock' }) {
  let colorClasses = "bg-slate-800 text-slate-300 border-slate-700";
  let label = status;

  if (type === 'stock') {
    switch (status) {
      case 'IN_STOCK':
        colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        label = "In Stock";
        break;
      case 'LOW_STOCK':
        colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/30";
        label = "Low Stock";
        break;
      case 'OUT_OF_STOCK':
        colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30";
        label = "Out of Stock";
        break;
      default:
        break;
    }
  } else if (type === 'po') {
    switch (status) {
      case 'RECEIVED':
        colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        label = "Received";
        break;
      case 'ORDERED':
        colorClasses = "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
        label = "Ordered";
        break;
      case 'PENDING':
        colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/30";
        label = "Pending";
        break;
      case 'DRAFT':
        colorClasses = "bg-slate-800 text-slate-400 border-slate-700";
        label = "Draft";
        break;
      case 'CANCELLED':
        colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30";
        label = "Cancelled";
        break;
      default:
        break;
    }
  } else if (type === 'supplier') {
    switch (status) {
      case 'PREFERRED':
        colorClasses = "bg-teal-500/10 text-teal-300 border-teal-500/30";
        label = "Preferred";
        break;
      case 'ACTIVE':
        colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        label = "Active";
        break;
      case 'INACTIVE':
        colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30";
        label = "Inactive";
        break;
      default:
        break;
    }
  } else if (type === 'rack') {
    switch (status) {
      case 'NEAR_FULL':
        colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30";
        label = "Near Full (>90%)";
        break;
      case 'OPTIMAL':
        colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/30";
        label = "Optimal (70-90%)";
        break;
      case 'AVAILABLE':
        colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        label = "Available (<70%)";
        break;
      default:
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {label}
    </span>
  );
}
