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
  // Ensure the primary action label never starts with a stray "+ " (avoids the famous double-plus bug)
  const cleanPrimaryLabel = primaryAction?.label.replace(/^\s*\+\s*/, '').trim();
  const cleanSecondaryLabel = secondaryAction?.label.replace(/^\s*\+\s*/, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-5"
      data-testid="page-header"
    >
      {/* Breadcrumb */}
      <nav className="text-xs text-[#94A3B8] mb-2 flex items-center gap-1 flex-wrap" data-testid="page-breadcrumb">
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#111827] leading-tight" data-testid="page-title">{title}</h1>
          <p className="text-sm text-[#64748B] mt-1" data-testid="page-subtitle">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn btn-secondary btn-sm"
              data-testid="page-header-secondary-action"
            >
              {secondaryAction.icon || <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{cleanSecondaryLabel}</span>
            </button>
          )}
          {primaryAction && (
            primaryAction.to ? (
              <Link
                to={primaryAction.to}
                className="btn btn-primary btn-sm"
                data-testid="page-header-primary-action"
              >
                {primaryAction.icon || <Plus className="w-4 h-4" />}
                {cleanPrimaryLabel}
              </Link>
            ) : (
              <button
                onClick={primaryAction.onClick}
                className="btn btn-primary btn-sm"
                data-testid="page-header-primary-action"
              >
                {primaryAction.icon || <Plus className="w-4 h-4" />}
                {cleanPrimaryLabel}
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
