import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, CheckCircle, FileText, Download, X, Paperclip, Filter, XCircle, Truck, CreditCard, Copy, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import { fournisseursApi, uploadFile, exportFournisseurs, type FournisseurItem } from '../lib/api';
import { exportExpensePDF } from '../lib/exportPDF';
import { formatFCFA, formatDate, todayInputValue } from '../lib/utils';
import KpiCard from '../components/ui/KpiCard';
import StatusBadge from '../components/ui/StatusBadge';
import ActionMenu from '../components/ui/ActionMenu';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export default function AchatsPage() {
  const [items, setItems] = useState<FournisseurItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FournisseurItem | null>(null);
  const [formData, setFormData] = useState<Partial<FournisseurItem>>({
    type: 'facture_fournisseur', numero: '', fournisseur: '', categorie: '',
    montant: 0, date_depense: todayInputValue(), date_echeance: '',
    statut: 'impayee', montant_acompte: 0, notes: '',
    pj_filename: '', pj_path: '',
  });
  const [uploading, setUploading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const routeToTab: Record<string, string> = {
    '/fournisseurs': 'depenses',
    '/factures-fournisseurs': 'factures',
    '/decaissements': 'paiements',
    '/fournisseurs-list': 'fournisseurs',
  };

  const activeTab = (routeToTab[location.pathname] || 'depenses') as 'depenses' | 'factures' | 'paiements' | 'fournisseurs';

  const handleTabChange = (tab: 'depenses' | 'factures' | 'paiements' | 'fournisseurs') => {
    const tabToRoute: Record<string, string> = {
      'depenses': '/fournisseurs',
      'factures': '/factures-fournisseurs',
      'paiements': '/decaissements',
      'fournisseurs': '/fournisseurs-list',
    };
    navigate(tabToRoute[tab] || '/fournisseurs');
    setCurrentPage(1);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const itemsPerPage = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatut) params.statut = filterStatut;
      if (filterCategorie) params.categorie = filterCategorie;
      const data = await fournisseursApi.list(params);
      setItems(data);
    } catch (e) {
      addToast('error', 'Erreur chargement des données.');
      console.error(e);
    }
    finally { setLoading(false); }
  }, [search, filterStatut, filterCategorie, addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await fournisseursApi.update(editing.id, formData);
      else await fournisseursApi.create(formData);
      resetForm(); fetchItems();
      addToast('success', editing ? 'Dépense modifiée.' : 'Dépense créée.');
    } catch (e) {
      addToast('error', 'Erreur lors de la sauvegarde.');
      console.error(e);
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({
      type: 'facture_fournisseur', numero: '', fournisseur: '', categorie: '',
      montant: 0, date_depense: todayInputValue(), date_echeance: '',
      statut: 'impayee', montant_acompte: 0, notes: '',
      pj_filename: '', pj_path: '',
    });
  };

  const startEdit = (item: FournisseurItem) => {
    setEditing(item); setFormData({ ...item });
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ?')) return;
    try { await fournisseursApi.remove(id); fetchItems(); addToast('success', 'Dépense supprimée.'); }
    catch (e) { addToast('error', 'Erreur lors de la suppression.'); }
  };

  const handleChangeStatut = async (id: number, statut: string) => {
    try {
      const item = items.find(i => i.id === id);
      const ma = statut === 'payee' ? item?.montant : item?.montant_acompte;
      await fournisseursApi.changeStatut(id, statut, ma);
      fetchItems();
      addToast('success', 'Statut mis à jour.');
    } catch (e) { addToast('error', 'Erreur lors de la mise à jour du statut.'); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setFormData((prev: Partial<FournisseurItem>) => ({ ...prev, pj_filename: res.filename, pj_path: res.url }));
      addToast('success', 'Fichier uploadé.');
    } catch (e) {
      addToast('error', 'Erreur upload.');
    }
    finally { setUploading(false); }
  };

  const isAcompteVisible = formData.statut === 'acompte_verse';
  const hasActiveFilters = search || filterStatut || filterCategorie;

  const categories = [
    { value: '', label: '-- Choisir --' },
    { value: 'matiere_premiere', label: 'Matière première' },
    { value: 'fourniture', label: 'Fourniture bureau' },
    { value: 'transport', label: 'Transport' },
    { value: 'loyer', label: 'Loyer / Local' },
    { value: 'services', label: 'Services' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'equipement', label: 'Équipement' },
    { value: 'salaire', label: 'Salaires' },
    { value: 'impots', label: 'Impôts / Taxes' },
    { value: 'divers', label: 'Divers' },
  ];

  // Summary stats
  const depensesMois = items.filter(i => i.date_depense.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, i) => s + i.montant, 0);
  const montantPaye = items.filter(i => i.statut === 'payee').reduce((s, i) => s + i.montant, 0);
  const restantAPayer = items.filter(i => i.statut !== 'payee').reduce((s, i) => s + (i.montant - i.montant_acompte), 0);
  const prochainesEcheances = items.filter(i => i.date_echeance && new Date(i.date_echeance) >= new Date() && i.statut !== 'payee').length;

  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(paginatedItems.map(i => i.id)));
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1>Achats et dépenses</h1>
            <p>Dépenses, factures fournisseurs et paiements</p>
          </div>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { addToast('info', 'Export CSV en cours...'); exportFournisseurs(); }} className="btn-outline btn-sm">
              <Download className="w-4 h-4" /> Exporter
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Nouveau
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Dépenses du mois" amount={formatFCFA(depensesMois)} icon={<CreditCard className="w-5 h-5" />} iconColor="#173B6C" />
        <KpiCard label="Montant payé" amount={formatFCFA(montantPaye)} icon={<CheckCircle className="w-5 h-5" />} iconColor="#059669" />
        <KpiCard label="Restant à payer" amount={formatFCFA(restantAPayer)} icon={<FileText className="w-5 h-5" />} iconColor="#DC2626" />
        <KpiCard label="Prochaines échéances" amount={String(prochainesEcheances)} icon={<Truck className="w-5 h-5" />} iconColor="#F59E0B" />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden mb-6"
          >
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title">
                  <Truck className="w-5 h-5 text-[#173B6C]" />
                  {editing ? 'Modifier' : 'Nouvelle dépense / facture fournisseur'}
                </h2>
                <button onClick={resetForm} className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                      <option value="facture_fournisseur">Facture fournisseur</option>
                      <option value="depense">Dépense directe</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">N° / Référence</label>
                    <input className="form-input" placeholder="FV-2026-001" value={formData.numero || ''} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Fournisseur</label>
                    <input className="form-input" required placeholder="Nom du fournisseur" value={formData.fournisseur} onChange={e => setFormData({ ...formData, fournisseur: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Catégorie</label>
                    <select className="form-input" value={formData.categorie || ''} onChange={e => setFormData({ ...formData, categorie: e.target.value || null })}>
                      {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Montant (FCFA)</label>
                    <input className="form-input" type="number" required min={0} value={formData.montant} onChange={e => setFormData({ ...formData, montant: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="form-label">Date de la dépense</label>
                    <input className="form-input" type="date" required value={formData.date_depense} onChange={e => setFormData({ ...formData, date_depense: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Date d'échéance</label>
                    <input className="form-input" type="date" value={formData.date_echeance || ''} onChange={e => setFormData({ ...formData, date_echeance: e.target.value || null })} />
                  </div>
                  <div>
                    <label className="form-label">Statut</label>
                    <select className="form-input" value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value as any })}>
                      <option value="impayee">Impayée</option>
                      <option value="acompte_verse">Acompte versé</option>
                      <option value="payee">Payée</option>
                    </select>
                  </div>
                  {isAcompteVisible && (
                    <div>
                      <label className="form-label">Montant acompte (FCFA)</label>
                      <input className="form-input" type="number" min={0} value={formData.montant_acompte} onChange={e => setFormData({ ...formData, montant_acompte: Number(e.target.value) })} />
                    </div>
                  )}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" rows={2} placeholder="Détails de la dépense, mode de règlement..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="form-label">Pièce jointe</label>
                    <div className="flex items-center gap-3">
                      <label className="file-upload">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{uploading ? 'Upload...' : formData.pj_filename ? 'Changer le fichier' : 'Cliquer pour ajouter un fichier'}</span>
                        <input type="file" className="hidden" onChange={handleFileChange} />
                      </label>
                      {formData.pj_filename && (
                        <span className="text-sm text-slate-600 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                          <FileText className="w-4 h-4 text-[#2563EB]" />
                          {formData.pj_filename}
                          <a href={formData.pj_path || ''} target="_blank" rel="noreferrer" className="text-[#2563EB] underline text-xs">Télécharger</a>
                          <button type="button" onClick={() => setFormData({ ...formData, pj_filename: '', pj_path: '' })} className="text-rose-400 hover:text-rose-600"><X className="w-3 h-3" /></button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn-primary">💾 Enregistrer</button>
                  <button type="button" onClick={resetForm} className="btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="tabs mb-4">
        <button className={`tab ${activeTab === 'depenses' ? 'active' : ''}`} onClick={() => handleTabChange('depenses')}>Dépenses</button>
        <button className={`tab ${activeTab === 'factures' ? 'active' : ''}`} onClick={() => handleTabChange('factures')}>Factures fournisseurs</button>
        <button className={`tab ${activeTab === 'paiements' ? 'active' : ''}`} onClick={() => handleTabChange('paiements')}>Paiements</button>
        <button className={`tab ${activeTab === 'fournisseurs' ? 'active' : ''}`} onClick={() => handleTabChange('fournisseurs')}>Fournisseurs</button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-field">
          <input
            className="form-input"
            placeholder="Rechercher fournisseur ou n°..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select className="form-select w-40 text-sm" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="impayee">Impayée</option>
            <option value="acompte_verse">Acompte</option>
            <option value="payee">Payée</option>
          </select>
          <select className="form-select w-48 text-sm" value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}>
            <option value="">Toutes catégories</option>
            {categories.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterCategorie(''); }} className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500" title="Effacer les filtres">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300" />
                </th>
                <th>N°</th>
                <th>Fournisseur</th>
                <th>Catégorie</th>
                <th className="text-right">Montant</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th className="text-right">Acompte</th>
                <th className="text-right">Reste</th>
                <th>PJ</th>
                <th className="text-right w-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-12 text-slate-400">Chargement...</td></tr>
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan={12}>
                  <EmptyState
                    title="Aucune dépense ou facture fournisseur"
                    text="Commencez par créer une nouvelle dépense ou facture fournisseur."
                    primaryAction={{ label: 'Ajouter une dépense', onClick: () => { resetForm(); setShowForm(true); } }}
                    secondaryAction={{ label: 'Importer un justificatif', onClick: () => {} }}
                    icon={<Truck className="w-8 h-8" />}
                  />
                </td></tr>
              ) : (
                paginatedItems.map(item => {
                  const reste = item.montant - item.montant_acompte;
                  const echeanceAtteinte = item.date_echeance && new Date(item.date_echeance) <= new Date() && item.statut !== 'payee';
                  const selected = selectedItems.has(item.id);
                  return (
                    <tr key={item.id} className={`${echeanceAtteinte ? 'urgent' : ''} ${selected ? 'bg-blue-50/30' : ''}`}>
                      <td>
                        <input type="checkbox" checked={selected} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-slate-300" />
                      </td>
                      <td className="font-mono text-xs text-[#2563EB] link-cell">{item.numero || '—'}</td>
                      <td className="font-semibold text-[#111827]">{item.fournisseur}</td>
                      <td className="text-xs text-[#64748B]">{item.categorie || '—'}</td>
                      <td className="text-right amount">{formatFCFA(item.montant)}</td>
                      <td className="text-[#111827]">{formatDate(item.date_depense)}</td>
                      <td>
                        {item.date_echeance ? (
                          <span className={`text-xs font-semibold ${echeanceAtteinte ? 'text-[#DC2626]' : ''}`}>
                            {formatDate(item.date_echeance)}
                          </span>
                        ) : '—'}
                      </td>
                      <td><StatusBadge statut={item.statut} type="fournisseur" /></td>
                      <td className="text-right amount text-[#64748B]">{item.montant_acompte ? formatFCFA(item.montant_acompte) : '—'}</td>
                      <td className={`text-right amount font-bold ${reste > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>{formatFCFA(reste)}</td>
                      <td>
                        {item.pj_filename ? (
                          <a href={item.pj_path || ''} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {item.pj_filename}
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        <ActionMenu
                          actions={[
                            { label: 'Voir', icon: Eye, onClick: () => {} },
                            { label: 'Modifier', icon: Edit2, onClick: () => startEdit(item) },
                            { label: 'Télécharger PDF', icon: Download, onClick: () => exportExpensePDF(item) },
                            { label: 'Enregistrer acompte', icon: CreditCard, onClick: () => {} },
                            { label: 'Marquer payée', icon: CheckCircle, onClick: () => handleChangeStatut(item.id, 'payee') },
                            { label: 'Dupliquer', icon: Copy, onClick: () => {} },
                            { label: 'Supprimer', icon: Trash2, onClick: () => handleDelete(item.id), danger: true },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
            <div className="text-sm text-[#64748B]">
              {selectedItems.size > 0 && <span>{selectedItems.size} sélectionné(s)</span>}
            </div>
            <div className="pagination">
              <button
                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
