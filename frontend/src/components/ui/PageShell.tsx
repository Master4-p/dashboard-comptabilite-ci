import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function PageShell({ title, subtitle, children }: PageShellProps) {
  useEffect(() => { document.title = `Relais IT — ${title}`; }, [title]);
  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </motion.div>
      {children}
    </div>
  );
}
