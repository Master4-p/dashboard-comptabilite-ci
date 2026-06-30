import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Eye, Pencil, Download, CreditCard, CheckCircle, Send, Copy, Trash2 } from 'lucide-react';

interface Action {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  actions: Action[];
}

const MENU_WIDTH = 224; // matches min-width:200 + small headroom
const MENU_GAP = 6;

export default function ActionMenu({ actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const computePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const estimatedMenuHeight = Math.min(actions.length * 40 + 16, 360);

    // Decide vertical placement: bottom by default, switch to top if not enough space
    const spaceBelow = viewportH - rect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow < estimatedMenuHeight + 16 && rect.top > estimatedMenuHeight + 16 ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + MENU_GAP : rect.top - estimatedMenuHeight - MENU_GAP;

    // Horizontal placement: align right edge with button right edge, clamp to viewport
    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > viewportW - 8) left = viewportW - MENU_WIDTH - 8;

    setPos({ top, left, placement });
  }, [actions.length]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Close (or re-position) on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const handle = () => setOpen(false);
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!open) {
      computePosition();
    }
    setOpen((prev) => !prev);
  }, [open, computePosition]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="overflow-menu-btn btn-icon"
        title="Actions"
        data-testid="action-menu-trigger"
      >
        <MoreHorizontal className="w-4 h-4 text-[#64748B]" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="action-menu-dropdown dropdown-menu fixed"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            data-testid="action-menu-dropdown"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                className={`dropdown-item w-full text-left ${action.danger ? 'danger' : ''}`}
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                data-testid={`action-menu-item-${action.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              >
                <action.icon className={`w-4 h-4 ${action.danger ? 'text-[#DC2626]' : 'text-[#64748B]'}`} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export { Eye, Pencil, Download, CreditCard, CheckCircle, Send, Copy, Trash2 };
