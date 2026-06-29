import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, XCircle } from 'lucide-react';
import { fournisseursApi, type FournisseurItem } from '../../lib/api';
import { todayInputValue } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

const CATEGORIES = [
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
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Achats', to: '/achats/depenses' },
          { label: 'Nouvelle dépense' },
        ]}
        title="Nouvelle dépense"
        subtitle="Créez une dépense ou une facture fournisseur."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="facture_fournisseur">Facture fournisseur</option>
                <option value="depense">Dépense directe</option>
              </select>
            </div>

            {/* N° / Référence */}
            <div>
              <label className="form-label">N° / Référence</label>
              <input
                className="form-input"
                placeholder="FV-2026-001"
                value={formData.numero || ''}
                onChange={(e) => handleChange('numero', e.target.value)}
              />
            </div>

            {/* Fournisseur */}
            <div>
              <label className="form-label">Fournisseur *</label>
              <input
                className="form-input"
                required
                placeholder="Nom du fournisseur"
                value={formData.fournisseur}
                onChange={(e) => handleChange('fournisseur', e.target.value)}
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="form-label">Catégorie</label>
              <select
                className="form-input"
                value={formData.categorie || ''}
                onChange={(e) => handleChange('categorie', e.target.value || null)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Montant */}
            <div>
              <label className="form-label">Montant (FCFA) *</label>
              <input
                className="form-input"
                type="number"
                required
                min={0}
                value={formData.montant}
                onChange={(e) => handleChange('montant', Number(e.target.value))}
              />
            </div>

            {/* Date de la dépense */}
            <div>
              <label className="form-label">Date de la dépense *</label>
              <input
                className="form-input"
                type="date"
                required
                value={formData.date_depense}
                onChange={(e) => handleChange('date_depense', e.target.value)}
              />
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="form-label">Date d'échéance</label>
              <input
                className="form-input"
                type="date"
                value={formData.date_echeance || ''}
                onChange={(e) => handleChange('date_echeance', e.target.value || null)}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="form-label">Statut</label>
              <select
                className="form-input"
                value={formData.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
              >
                <option value="impayee">Impayée</option>
                <option value="acompte_verse">Acompte versé</option>
                <option value="payee">Payée</option>
              </select>
            </div>

            {/* Montant acompte */}
            {isAcompteVisible && (
              <div>
                <label className="form-label">Montant acompte (FCFA)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={formData.montant_acompte || 0}
                  onChange={(e) => handleChange('montant_acompte', Number(e.target.value))}
                />
              </div>
            )}

            {/* Notes */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Détails de la dépense, mode de règlement..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-outline flex items-center gap-2 ml-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux dépenses
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
