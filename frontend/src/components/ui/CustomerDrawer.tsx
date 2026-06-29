import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, AlertTriangle, Loader2 } from 'lucide-react';
import { customersApi, type Customer } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
  existingCustomers?: Customer[];
}

const defaultFormData: Partial<Customer> = {
  type: 'entreprise',
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: "Côte d'Ivoire",
  tax_id: '',
  rccm: '',
  default_payment_terms_days: 30,
  notes: '',
  is_active: 1,
};

export default function CustomerDrawer({
  isOpen,
  onClose,
  onSave,
  customer,
  existingCustomers = [],
}: CustomerDrawerProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({ ...defaultFormData });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!customer?.id;

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({ ...customer });
      } else {
        setFormData({ ...defaultFormData });
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const handleChange = useCallback(
    (field: keyof Customer, value: string | number | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const nameTrimmed = formData.name?.trim() || '';

    // Duplicate detection for creation
    if (!isEditing) {
      const duplicate = existingCustomers.find(
        (c) => c.name.toLowerCase().trim() === nameTrimmed.toLowerCase()
      );
      if (duplicate) {
        const confirmed = window.confirm(
          `Un client "${duplicate.name}" existe déjà. Voulez-vous créer un doublon ?`
        );
        if (!confirmed) return;
      }
    }

    setIsLoading(true);
    try {
      let saved: Customer;
      const payload: Partial<Customer> = {
        ...formData,
        name: nameTrimmed,
      };
      if (isEditing && customer?.id) {
        saved = await customersApi.update(customer.id, payload);
      } else {
        saved = await customersApi.create(payload);
      }
      onSave(saved);
      addToast('success', isEditing ? 'Client mis à jour.' : 'Client créé.');
      onClose();
    } catch (e) {
      console.error(e);
      addToast('error', 'Erreur lors de la sauvegarde.');
    } finally {
      setIsLoading(false);
    }
  }, [
    formData,
    isEditing,
    customer,
    existingCustomers,
    validate,
    onSave,
    onClose,
    addToast,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="relative z-10 w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#111827]">
                {isEditing ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <button
                onClick={onClose}
                className="btn-icon hover:bg-[#F1F5F9]"
                title="Fermer"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Type */}
              <div>
                <label className="form-label">Type</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="entreprise"
                      checked={formData.type === 'entreprise'}
                      onChange={() => handleChange('type', 'entreprise')}
                      className="w-4 h-4 accent-[#173B6C]"
                    />
                    <Building2 className="w-4 h-4 text-[#64748B]" />
                    <span className="text-sm font-medium text-[#111827]">Entreprise</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="particulier"
                      checked={formData.type === 'particulier'}
                      onChange={() => handleChange('type', 'particulier')}
                      className="w-4 h-4 accent-[#173B6C]"
                    />
                    <User className="w-4 h-4 text-[#64748B]" />
                    <span className="text-sm font-medium text-[#111827]">Particulier</span>
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="form-label">
                  Nom <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'border-[#DC2626] focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]' : ''}`}
                  placeholder="Nom du client"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-[#DC2626]">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Contact name */}
              <div>
                <label className="form-label">Contact</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nom du contact"
                  value={formData.contact_name || ''}
                  onChange={(e) => handleChange('contact_name', e.target.value || null)}
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Téléphone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+225 ..."
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value || null)}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@exemple.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value || null)}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="form-label">Adresse</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Adresse complète"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value || null)}
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ville</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ville"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value || null)}
                  />
                </div>
                <div>
                  <label className="form-label">Pays</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pays"
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>

              {/* NIF & RCCM */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">NIF</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Numéro d'identification fiscale"
                    value={formData.tax_id || ''}
                    onChange={(e) => handleChange('tax_id', e.target.value || null)}
                  />
                </div>
                <div>
                  <label className="form-label">RCCM</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="RCCM"
                    value={formData.rccm || ''}
                    onChange={(e) => handleChange('rccm', e.target.value || null)}
                  />
                </div>
              </div>

              {/* Payment terms */}
              <div>
                <label className="form-label">Délai de paiement par défaut (jours)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={365}
                  value={formData.default_payment_terms_days ?? 30}
                  onChange={(e) =>
                    handleChange('default_payment_terms_days', parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Notes internes..."
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value || null)}
                />
              </div>

              {/* Active status */}
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-semibold text-[#111827]">Client actif</label>
                <button
                  type="button"
                  onClick={() => handleChange('is_active', formData.is_active === 1 ? 0 : 1)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    formData.is_active === 1 ? 'bg-[#173B6C]' : 'bg-[#CBD5E1]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.is_active === 1 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="btn btn-secondary btn-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary btn-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
