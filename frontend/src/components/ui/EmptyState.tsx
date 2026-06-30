import { Plus, Upload } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  text: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export default function EmptyState({ title, text, primaryAction, secondaryAction, icon }: EmptyStateProps) {
  // Strip any leading "+" the caller may have prefixed — the icon already shows one
  const cleanPrimary = primaryAction?.label.replace(/^\s*\+\s*/, '').trim();
  const cleanSecondary = secondaryAction?.label.replace(/^\s*\+\s*/, '').trim();

  return (
    <div className="empty-state" data-testid="empty-state">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
          {icon}
        </div>
      )}
      <div className="empty-state-title" data-testid="empty-state-title">{title}</div>
      <div className="empty-state-text" data-testid="empty-state-text">{text}</div>
      {(primaryAction || secondaryAction) && (
        <div className="empty-state-actions">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="btn btn-primary btn-sm"
              data-testid="empty-state-primary-action"
            >
              <Plus className="w-4 h-4" />
              {cleanPrimary}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn btn-secondary btn-sm"
              data-testid="empty-state-secondary-action"
            >
              <Upload className="w-4 h-4" />
              {cleanSecondary}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
