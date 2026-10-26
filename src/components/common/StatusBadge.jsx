import React from 'react';

export default function StatusBadge({ status, type = 'stock' }) {
  let colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
  let dotColor = "bg-slate-400";
  let label = status;

  const normalized = String(status || '').toUpperCase();

  if (type === 'stock') {
    switch (normalized) {
      case 'IN_STOCK':
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        dotColor = "bg-emerald-500";
        label = "In Stock";
        break;
      case 'LOW_STOCK':
        colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
        dotColor = "bg-amber-500";
        label = "Low Stock";
        break;
      case 'OUT_OF_STOCK':
        colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
        dotColor = "bg-rose-500";
        label = "Out of Stock";
        break;
      default:
        colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
        dotColor = "bg-slate-400";
        break;
    }
  } else if (type === 'po') {
    switch (normalized) {
      case 'RECEIVED':
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        dotColor = "bg-emerald-500";
        label = "Received";
        break;
      case 'ORDERED':
        colorClasses = "bg-sky-50 text-sky-700 border-sky-200";
        dotColor = "bg-sky-500";
        label = "Ordered";
        break;
      case 'PENDING':
        colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
        dotColor = "bg-amber-500";
        label = "Pending";
        break;
      case 'DRAFT':
        colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
        dotColor = "bg-slate-400";
        label = "Draft";
        break;
      case 'CANCELLED':
        colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
        dotColor = "bg-rose-500";
        label = "Cancelled";
        break;
      default:
        break;
    }
  } else if (type === 'supplier') {
    switch (normalized) {
      case 'PREFERRED':
        colorClasses = "bg-teal-50 text-teal-700 border-teal-200";
        dotColor = "bg-teal-500";
        label = "Preferred";
        break;
      case 'ACTIVE':
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        dotColor = "bg-emerald-500";
        label = "Active";
        break;
      case 'INACTIVE':
        colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
        dotColor = "bg-slate-400";
        label = "Inactive";
        break;
      default:
        break;
    }
  } else if (type === 'rack') {
    switch (normalized) {
      case 'NEAR_FULL':
        colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
        dotColor = "bg-rose-500";
        label = "Near Full (>90%)";
        break;
      case 'OPTIMAL':
        colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
        dotColor = "bg-amber-500";
        label = "Optimal (70-90%)";
        break;
      case 'AVAILABLE':
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        dotColor = "bg-emerald-500";
        label = "Available (<70%)";
        break;
      default:
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
    </span>
  );
}
