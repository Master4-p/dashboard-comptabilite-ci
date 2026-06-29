import { useState, useRef, useEffect, useCallback } from 'react';
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

export default function ActionMenu({ actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target)) {
        const menu = document.querySelector('.action-menu-dropdown');
        if (!menu || !menu.contains(target)) {
          setOpen(false);
        }
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left - 200 + rect.width });
    }
    setOpen((prev) => !prev);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="overflow-menu-btn btn-icon"
        title="Actions"
      >
        <MoreHorizontal className="w-4 h-4 text-[#64748B]" />
      </button>
      {open && (
        <div
          className="action-menu-dropdown dropdown-menu fixed z-[9999] w-56"
          style={{ top: pos.top, left: pos.left }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              className={`dropdown-item w-full text-left ${action.danger ? 'danger' : ''}`}
              onClick={() => { action.onClick(); setOpen(false); }}
            >
              <action.icon className={`w-4 h-4 ${action.danger ? 'text-[#DC2626]' : 'text-[#64748B]'}`} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export { Eye, Pencil, Download, CreditCard, CheckCircle, Send, Copy, Trash2 };
