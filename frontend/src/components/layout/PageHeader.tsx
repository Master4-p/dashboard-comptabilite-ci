import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Download } from 'lucide-react';

interface PageHeaderProps {
  breadcrumb: { label: string; to?: string }[];
  title: string;
  subtitle: string;
  primaryAction?: { label: string; icon?: React.ReactNode; onClick?: () => void; to?: string };
  secondaryAction?: { label: string; icon?: React.ReactNode; onClick?: () => void };
}

export default function PageHeader({ breadcrumb, title, subtitle, primaryAction, secondaryAction }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      {/* Breadcrumb */}
      <nav className="text-xs text-[#94A3B8] mb-2 flex items-center gap-1">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[#CBD5E1]">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-[#64748B] transition-colors">{crumb.label}</Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
          <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
            >
              {secondaryAction.icon || <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{secondaryAction.label}</span>
            </button>
          )}
          {primaryAction && (
            primaryAction.to ? (
              <Link
                to={primaryAction.to}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173B6C] text-white text-sm font-medium hover:bg-[#1e4a8a] transition-colors shadow-sm"
              >
                {primaryAction.icon || <Plus className="w-4 h-4" />}
                {primaryAction.label}
              </Link>
            ) : (
              <button
                onClick={primaryAction.onClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173B6C] text-white text-sm font-medium hover:bg-[#1e4a8a] transition-colors shadow-sm"
              >
                {primaryAction.icon || <Plus className="w-4 h-4" />}
                {primaryAction.label}
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
