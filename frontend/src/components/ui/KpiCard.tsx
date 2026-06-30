import { type ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  amount: string;
  comparison?: string;
  comparisonPositive?: boolean;
  icon: ReactNode;
  iconColor?: string;
  secondary?: string;
}

export default function KpiCard({ label, amount, comparison, comparisonPositive, icon, iconColor = '#173B6C', secondary }: KpiCardProps) {
  return (
    <div className="card-hover p-5" data-testid="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-bold text-[#111827] mt-2 tracking-tight">{amount}</div>
          {comparison && (
            <div className={`text-xs font-semibold mt-1.5 ${comparisonPositive ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
              {comparison}
            </div>
          )}
          {secondary && !comparison && (
            <div className="text-xs text-[#94A3B8] mt-1.5">{secondary}</div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}15` }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
