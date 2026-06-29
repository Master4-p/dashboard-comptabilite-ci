import { useState, useRef, useEffect } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="overflow-menu-btn btn-icon"
        title="Actions"
      >
        <MoreHorizontal className="w-4 h-4 text-[#64748B]" />
      </button>
      {open && (
        <div className="dropdown-menu absolute right-0 top-full mt-1 z-50 w-56">
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
    </div>
  );
}

export { Eye, Pencil, Download, CreditCard, CheckCircle, Send, Copy, Trash2 };
