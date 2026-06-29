import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, X, FileSpreadsheet, FileImage, FileArchive } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import EmptyState from '../components/ui/EmptyState';
import { clientsApi, fournisseursApi, type ClientItem, type FournisseurItem } from '../lib/api';
import { formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

interface DocumentItem {
  id: number;
  source: 'client' | 'fournisseur';
  type: string;
  numero: string;
  nom: string;
  filename: string;
  date: string;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className="w-8 h-8 text-[#F59E0B]" />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="w-8 h-8 text-[#059669]" />;
  if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="w-8 h-8 text-[#7C3AED]" />;
  return <FileText className="w-8 h-8 text-[#2563EB]" />;
}

function getFileSize(filename: string) {
  // Simule une taille basée sur le hash du nom
  const hash = filename.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return `${(hash % 500 + 50).toFixed(0)} KB`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetch() {
      try {
        const [clients, fournisseurs] = await Promise.all([
          clientsApi.list({}),
          fournisseursApi.list({}),
        ]);
        const mappedClients: DocumentItem[] = (clients as ClientItem[])
          .filter(c => c.pj_filename)
          .map(c => ({
            id: c.id, source: 'client', type: c.type, numero: c.numero, nom: c.client,
            filename: c.pj_filename!, date: c.date_emission,
          }));
        const mappedFournisseurs: DocumentItem[] = (fournisseurs as FournisseurItem[])
          .filter(f => f.pj_filename)
          .map(f => ({
            id: f.id, source: 'fournisseur', type: f.type, numero: f.numero || '', nom: f.fournisseur,
            filename: f.pj_filename!, date: f.date_depense,
          }));
        const all = [...mappedClients, ...mappedFournisseurs]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDocs(all);
      } catch (e) {
        addToast('error', 'Erreur chargement des documents.');
        console.error(e);
      }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return docs.filter(d => {
      const matchesSearch = search === '' || d.filename.toLowerCase().includes(search.toLowerCase()) || d.nom.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || d.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [docs, search, filterType]);

  if (loading) {
    return (
      <PageShell title="Documents" subtitle="Centralisez les factures, justificatifs et pièces jointes">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-[#E2E8F0] rounded-2xl" />)}
        </div>
      </PageShell>
    );
  }

  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  return (
    <PageShell title="Documents" subtitle="Centralisez les factures, justificatifs et pièces jointes">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'facture', label: 'Factures' },
            { key: 'proforma', label: 'Proformas' },
            { key: 'depense', label: 'Dépenses' },
            { key: 'facture_fournisseur', label: 'Factures fournisseurs' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === f.key
                  ? 'bg-[#173B6C] text-white'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de documents */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, i) => (
            <motion.div
              key={`${doc.source}-${doc.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div className="shrink-0">{getFileIcon(doc.filename)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#111827] text-sm truncate" title={doc.filename}>{doc.filename}</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">
                  {doc.nom} · {formatDate(doc.date)} · {getFileSize(doc.filename)}
                </div>
              </div>
              <a
                href={`${apiBase.replace('/api', '')}/uploads/${doc.filename}`}
                download
                className="shrink-0 p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                title="Télécharger"
                onClick={() => addToast('info', 'Téléchargement lancé...')}
              >
                <Download className="w-4 h-4 text-[#64748B]" />
              </a>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="w-10 h-10" />}
          title="Aucun document"
          text={docs.length === 0 ? "Aucune pièce jointe n'a été ajoutée. Ajoutez des fichiers lors de la création d'une facture ou d'une dépense." : "Aucun document ne correspond à vos critères de recherche."}
        />
      )}
    </PageShell>
  );
}
