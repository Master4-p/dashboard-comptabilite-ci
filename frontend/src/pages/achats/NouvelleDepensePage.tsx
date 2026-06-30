import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, XCircle, CreditCard, FileText, User } from 'lucide-react';
import { fournisseursApi, type FournisseurItem } from '../../lib/api';
import { todayInputValue } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

const CATEGORIES = [
  { value: '', label: '— Choisir une catégorie —' },
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

export default function NouvelleDepensePage() {
  useScrollToTop();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<Partial<FournisseurItem>>({
    type: 'depense',
    numero: '',
    fournisseur: '',
    categorie: '',
    montant: 0,
    date_depense: todayInputValue(),
    date_echeance: '',
    statut: 'impayee',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof FournisseurItem, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.fournisseur || !formData.montant || !formData.date_depense) {
        addToast('error', 'Veuillez remplir les champs obligatoires.');
        return;
      }
      setSubmitting(true);
      try {
        await fournisseursApi.create({
          ...formData,
          categorie: formData.categorie || null,
          date_echeance: formData.date_echeance || null,
          montant_acompte: 0,
        });
        addToast('success', 'Dépense enregistrée avec succès.');
        navigate('/achats/depenses');
      } catch (err) {
        addToast('error', 'Erreur lors de l\'enregistrement.');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, addToast, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate('/achats/depenses');
  }, [navigate]);

  const isAcompteVisible = formData.statut === 'acompte_verse';

  return (
    <div className="max-w-[960px] mx-auto" data-testid="nouvelle-depense-page">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleCancel}
          className="btn-icon hover:bg-slate-100 text-slate-500"
          title="Retour aux dépenses"
          data-testid="depense-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-[#94A3B8]">Retour à la liste des dépenses</span>
      </div>

      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Achats', to: '/achats/depenses' },
          { label: 'Nouvelle dépense' },
        ]}
        title="Nouvelle dépense"
        subtitle="Créez une dépense directe ou une facture fournisseur."
      />

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onSubmit={handleSubmit}
        className="card"
        data-testid="depense-form"
      >
        {/* Section 1 — Document */}
        <div className="form-section">
          <div className="form-section-title">
            <FileText className="w-4 h-4 text-[#173B6C]" />
            Document
          </div>
          <div className="form-section-subtitle">Type et référence de la dépense</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type *</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                data-testid="depense-type"
              >
                <option value="facture_fournisseur">Facture fournisseur</option>
                <option value="depense">Dépense directe</option>
              </select>
            </div>
            <div>
              <label className="form-label">N° / Référence</label>
              <input
                className="form-input"
                placeholder="FV-2026-001"
                value={formData.numero || ''}
                onChange={(e) => handleChange('numero', e.target.value)}
                data-testid="depense-numero"
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Fournisseur */}
        <div className="form-section">
          <div className="form-section-title">
            <User className="w-4 h-4 text-[#173B6C]" />
            Fournisseur
          </div>
          <div className="form-section-subtitle">Bénéficiaire de la dépense</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom du fournisseur *</label>
              <input
                className="form-input"
                required
                placeholder="Ex. Bureau Vallée"
                value={formData.fournisseur}
                onChange={(e) => handleChange('fournisseur', e.target.value)}
                data-testid="depense-fournisseur"
              />
            </div>
            <div>
              <label className="form-label">Catégorie</label>
              <select
                className="form-select"
                value={formData.categorie || ''}
                onChange={(e) => handleChange('categorie', e.target.value || null)}
                data-testid="depense-categorie"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3 — Montant & dates */}
        <div className="form-section">
          <div className="form-section-title">
            <CreditCard className="w-4 h-4 text-[#173B6C]" />
            Montant &amp; dates
          </div>
          <div className="form-section-subtitle">Détails financiers et échéances</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Montant (FCFA) *</label>
              <input
                className="form-input text-right"
                type="number"
                required
                min={0}
                value={formData.montant}
                onChange={(e) => handleChange('montant', Number(e.target.value))}
                data-testid="depense-montant"
              />
            </div>
            <div>
              <label className="form-label">Date de la dépense *</label>
              <input
                className="form-input"
                type="date"
                required
                value={formData.date_depense}
                onChange={(e) => handleChange('date_depense', e.target.value)}
                data-testid="depense-date"
              />
            </div>
            <div>
              <label className="form-label">Date d'échéance</label>
              <input
                className="form-input"
                type="date"
                value={formData.date_echeance || ''}
                onChange={(e) => handleChange('date_echeance', e.target.value || null)}
                data-testid="depense-echeance"
              />
            </div>
            <div>
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={formData.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
                data-testid="depense-statut"
              >
                <option value="impayee">Impayée</option>
                <option value="acompte_verse">Acompte versé</option>
                <option value="payee">Payée</option>
              </select>
            </div>
            {isAcompteVisible && (
              <div className="md:col-span-2">
                <label className="form-label">Montant acompte (FCFA)</label>
                <input
                  className="form-input text-right"
                  type="number"
                  min={0}
                  value={formData.montant_acompte || 0}
                  onChange={(e) => handleChange('montant_acompte', Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4 — Notes */}
        <div className="form-section">
          <div className="form-section-title">Notes complémentaires</div>
          <div className="form-section-subtitle">Mode de règlement, commentaires…</div>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Détails de la dépense, mode de règlement…"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            data-testid="depense-notes"
          />
        </div>

        {/* Actions */}
        <div className="form-section flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-sm"
            data-testid="depense-submit-btn"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Enregistrement…' : 'Enregistrer la dépense'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary btn-sm"
            data-testid="depense-cancel-btn"
          >
            <XCircle className="w-4 h-4" />
            Annuler
          </button>
        </div>
      </motion.form>
    </div>
  );
}
