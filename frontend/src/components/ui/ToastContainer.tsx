import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const toastConfig = {
  success: { bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', text: 'text-[#065F46]', icon: CheckCircle, iconColor: '#059669' },
  error: { bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]', text: 'text-[#991B1B]', icon: XCircle, iconColor: '#DC2626' },
  info: { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#1E40AF]', icon: Info, iconColor: '#2563EB' },
  warning: { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', text: 'text-[#92400E]', icon: AlertTriangle, iconColor: '#F59E0B' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-[360px] max-w-[90vw]">
      <AnimatePresence>
        {toasts.map(toast => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`${config.bg} ${config.border} border rounded-xl p-4 shadow-lg flex items-start gap-3`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: config.iconColor }} />
              <span className={`${config.text} text-sm font-medium flex-1`}>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 hover:opacity-70">
                <X className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
