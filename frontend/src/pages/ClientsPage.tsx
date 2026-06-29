import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, RefreshCw, CheckCircle, FileText, Download, X, Paperclip, Filter, XCircle } from 'lucide-react';
import { clientsApi, uploadFile, exportClients, type ClientItem } from '../lib/api';
import { formatFCFA, formatDate, daysSince, statutClientLabels, statutClientColors, todayInputValue } from '../lib/utils';

export default function ClientsPage() {
  const [items, setItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClientItem | null>(null);
  const [formData, setFormData] = useState<Partial<ClientItem>>({
    type: 'facture', numero: '', client: '', montant: 0,
    date_emission: todayInputValue(), date_relance: '',
    statut: 'envoye', montant_acompte: 0, notes: '',
    pj_filename: '', pj_path: '',
  });
  const [uploading, setUploading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatut) params.statut = filterStatut;
      if (filterType) params.type = filterType;
      const data = await clientsApi.list(params);
      setItems(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterStatut, filterType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await clientsApi.update(editing.id, formData);
      else await clientsApi.create(formData);
      resetForm(); fetchItems();
    } catch (e) { alert('Erreur'); console.error(e); }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({
      type: 'facture', numero: '', client: '', montant: 0,
      date_emission: todayInputValue(), date_relance: '',
      statut: 'envoye', montant_acompte: 0, notes: '',
      pj_filename: '', pj_path: '',
    });
  };

  const startEdit = (item: ClientItem) => {
    setEditing(item); setFormData({ ...item });
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ?')) return;
    try { await clientsApi.remove(id); fetchItems(); }
    catch (e) { alert('Erreur'); }
  };

  const handleChangeStatut = async (id: number, statut: string) => {
    try {
      const item = items.find(i => i.id === id);
      const ma = statut === 'solde' ? item?.montant : item?.montant_acompte;
      await clientsApi.changeStatut(id, statut, ma);
      fetchItems();
    } catch (e) { alert('Erreur'); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setFormData(prev => ({ ...prev, pj_filename: res.filename, pj_path: res.url }));
    } catch (e) { alert('Erreur upload'); }
    finally { setUploading(false); }
  };

  const isAcompteVisible = formData.statut === 'acompte';
  const hasActiveFilters = search || filterStatut || filterType;

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1>Clients</h1>
            <p>Factures et proformas — gérez vos encaissements</p>
          </div>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => exportClients()} className="btn-outline btn-sm">
              <Download className="w-4 h-4" /> Exporter
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Nouveau
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-6"
          >
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title">
                  <FileText className="w-5 h-5 text-blue-500" />
                  {editing ? 'Modifier' : 'Nouvelle facture / proforma'}
                </h2>
                <button onClick={resetForm} className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'facture' | 'proforma' })}>
                      <option value="facture">Facture</option>
                      <option value="proforma">Proforma</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Numéro</label>
                    <input className="form-input" required placeholder="FA-2026-001" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Client</label>
                    <input className="form-input" required placeholder="Nom du client" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Montant (FCFA)</label>
                    <input className="form-input" type="number" required min={0} value={formData.montant} onChange={e => setFormData({ ...formData, montant: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="form-label">Date d'émission</label>
                    <input className="form-input" type="date" required value={formData.date_emission} onChange={e => setFormData({ ...formData, date_emission: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Date de relance prévue</label>
                    <input className="form-input" type="date" value={formData.date_relance || ''} onChange={e => setFormData({ ...formData, date_relance: e.target.value || null })} />
                  </div>
                  <div>
                    <label className="form-label">Statut</label>
                    <select className="form-input" value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value as any })}>
                      <option value="envoye">Envoyé</option>
                      <option value="relance">Relancé</option>
                      <option value="acompte">Acompte reçu</option>
                      <option value="solde">Soldé</option>
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
                    <textarea className="form-input" rows={2} placeholder="Commentaire, détails de la prestation..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
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
                          <FileText className="w-4 h-4 text-blue-500" />
                          {formData.pj_filename}
                          <a href={formData.pj_path || ''} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Télécharger</a>
                          <button type="button" onClick={() => setFormData({ ...formData, pj_filename: '', pj_path: '' })} className="text-rose-400 hover:text-rose-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn-primary">💾 Enregistrer</button>
                  <button type="button" onClick={resetForm} className="btn-outline">Annuler</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="filter-bar mb-4">
        <div className="search-input flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="form-input pl-10" placeholder="Rechercher client ou n°..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select className="form-input w-40 text-sm" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="envoye">Envoyé</option>
            <option value="relance">Relancé</option>
            <option value="acompte">Acompte</option>
            <option value="solde">Soldé</option>
          </select>
          <select className="form-input w-40 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tous types</option>
            <option value="facture">Facture</option>
            <option value="proforma">Proforma</option>
          </select>
          {hasActiveFilters && (
            <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterType(''); }} className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500" title="Effacer les filtres">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>N°</th><th>Client</th><th className="text-right">Montant</th>
                <th>Émission</th><th>Relance</th><th>Statut</th>
                <th className="text-right">Acompte</th><th className="text-right">Reste</th><th>PJ</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12 text-slate-400">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-slate-200" />
                    <p>Aucune facture ou proforma</p>
                  </div>
                </td></tr>
              ) : (
                items.map(item => {
                  const reste = item.montant - item.montant_acompte;
                  const jours = daysSince(item.date_emission);
                  const urgent = item.type === 'facture' && item.statut !== 'solde' && jours > 30;
                  const relanceAtteinte = item.date_relance && new Date(item.date_relance) <= new Date() && item.statut !== 'solde';
                  return (
                    <tr key={item.id} className={urgent || relanceAtteinte ? 'urgent' : ''}>
                      <td><span className={item.type === 'facture' ? 'tag-blue' : 'tag-slate'}>{item.type === 'facture' ? 'Facture' : 'Proforma'}</span></td>
                      <td className="font-mono text-xs text-slate-500">{item.numero}</td>
                      <td className="font-semibold text-slate-800">{item.client}</td>
                      <td className="text-right font-mono font-bold text-slate-900">{formatFCFA(item.montant)}</td>
                      <td><div className="text-slate-700">{formatDate(item.date_emission)}</div><div className="text-xs text-slate-400">{jours}j</div></td>
                      <td>{item.date_relance ? <span className={`text-xs font-semibold ${relanceAtteinte ? 'text-rose-500' : 'text-emerald-500'}`}>{formatDate(item.date_relance)}</span> : <span className="text-xs text-slate-300">—</span>}</td>
                      <td><span className={`badge ${statutClientColors[item.statut]}`}>{statutClientLabels[item.statut]}</span></td>
                      <td className="text-right font-mono text-slate-600">{item.montant_acompte ? formatFCFA(item.montant_acompte) : '—'}</td>
                      <td className={`text-right font-mono font-bold ${reste > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatFCFA(reste)}</td>
                      <td>{item.pj_filename ? <a href={item.pj_path || ''} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> {item.pj_filename}</a> : '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => startEdit(item)} className="btn-icon bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                          {item.type === 'facture' && item.statut !== 'solde' && (
                            <>
                              <button onClick={() => handleChangeStatut(item.id, 'relance')} className="btn-icon bg-amber-100 text-amber-600 hover:bg-amber-200" title="Relancer"><RefreshCw className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleChangeStatut(item.id, 'solde')} className="btn-icon bg-emerald-100 text-emerald-600 hover:bg-emerald-200" title="Solder"><CheckCircle className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          <button onClick={() => handleDelete(item.id)} className="btn-icon bg-rose-100 text-rose-500 hover:bg-rose-200" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
