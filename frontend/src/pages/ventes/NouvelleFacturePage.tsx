import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Save, Send, Eye, Plus, Trash2, Copy,
  X, UserPlus, Paperclip, Loader2
} from 'lucide-react';
import {
  clientsApi, customersApi, numberingApi, lineItemsApi, uploadFile,
  type ClientItem, type Customer, type LineItem
} from '../../lib/api';
import { formatFCFA, todayInputValue } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';
import CustomerDrawer from '../../components/ui/CustomerDrawer';

interface EditableLineItem {
  id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_type: 'none' | 'percent' | 'fixed';
  discount_value: number;
  tax_rate: number;
  line_subtotal: number;
  line_tax: number;
  line_total: number;
}

function createEmptyLine(): EditableLineItem {
  return {
    description: '',
    quantity: 1,
    unit: 'u',
    unit_price: 0,
    discount_type: 'none',
    discount_value: 0,
    tax_rate: 0,
    line_subtotal: 0,
    line_tax: 0,
    line_total: 0,
  };
}

function calculateLine(line: EditableLineItem): EditableLineItem {
  const subtotal = line.quantity * line.unit_price;
  let discount = 0;
  if (line.discount_type === 'percent') {
    discount = subtotal * (line.discount_value / 100);
  } else if (line.discount_type === 'fixed') {
    discount = line.discount_value;
  }
  const discounted = Math.max(0, subtotal - discount);
  const tax = discounted * (line.tax_rate / 100);
  const total = discounted + tax;
  return {
    ...line,
    line_subtotal: subtotal,
    line_tax: tax,
    line_total: total,
  };
}

export default function NouvelleFacturePage() {
  useScrollToTop();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [numero, setNumero] = useState('');
  const [dateEmission, setDateEmission] = useState(todayInputValue());
  const [dateEcheance, setDateEcheance] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const [lineItems, setLineItems] = useState<EditableLineItem[]>([createEmptyLine()]);

  // Load customers + invoice (if editing)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allCustomers = await customersApi.list();
        setCustomers(allCustomers);

        if (isEditing && id) {
          const invoice = await clientsApi.get(Number(id));
          setNumero(invoice.numero);
          setDateEmission(invoice.date_emission);
          setDateEcheance(invoice.date_relance || '');
          setNotes(invoice.notes);
          setAttachment(invoice.pj_filename);

          let customer = allCustomers.find(c => c.id === invoice.customer_id);
          if (!customer && invoice.customer_id) {
            try {
              customer = await customersApi.get(invoice.customer_id);
            } catch {
              customer = undefined;
            }
          }
          if (!customer) {
            customer = allCustomers.find(c => c.name === invoice.client);
          }
          setSelectedCustomer(customer || null);

          const lines = await lineItemsApi.list(invoice.id, 'facture');
          setLineItems(lines.map((l: LineItem) => ({
            id: l.id,
            description: l.description,
            quantity: l.quantity,
            unit: l.unit,
            unit_price: l.unit_price,
            discount_type: l.discount_type,
            discount_value: l.discount_value,
            tax_rate: l.tax_rate,
            line_subtotal: l.line_subtotal,
            line_tax: l.line_tax,
            line_total: l.line_total,
          })));
        } else {
          const year = new Date().getFullYear();
          const numbering = await numberingApi.get('FA', year);
          setNumero(numbering.formatted);
          await numberingApi.increment('FA', year);
        }
      } catch (e) {
        console.error(e);
        addToast('error', 'Erreur chargement.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEditing, addToast]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    if (dateEmission) {
      const d = new Date(dateEmission);
      d.setDate(d.getDate() + customer.default_payment_terms_days);
      setDateEcheance(d.toISOString().split('T')[0]);
    }
  };

  const handleCustomerCreated = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    handleCustomerSelect(customer);
  };

  const calculatedLines = useMemo(() =>
    lineItems.map(calculateLine),
  [lineItems]);

  const totals = useMemo(() => {
    const subtotal = calculatedLines.reduce((s, l) => s + l.line_subtotal, 0);
    const discountTotal = calculatedLines.reduce((s, l) => {
      if (l.discount_type === 'percent') return s + (l.line_subtotal * l.discount_value / 100);
      if (l.discount_type === 'fixed') return s + l.discount_value;
      return s;
    }, 0);
    const taxableAmount = subtotal - discountTotal;
    const taxTotal = calculatedLines.reduce((s, l) => s + l.line_tax, 0);
    const grandTotal = calculatedLines.reduce((s, l) => s + l.line_total, 0);
    return { subtotal, discountTotal, taxableAmount, taxTotal, grandTotal };
  }, [calculatedLines]);

  const updateLine = (index: number, updates: Partial<EditableLineItem>) => {
    setLineItems(prev => prev.map((line, i) => i === index ? { ...line, ...updates } : line));
  };

  const addLine = () => {
    setLineItems(prev => [...prev, createEmptyLine()]);
  };

  const removeLine = (index: number) => {
    setLineItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : [createEmptyLine()]);
  };

  const duplicateLine = (index: number) => {
    const line = calculatedLines[index];
    setLineItems(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...line, id: undefined });
      return next;
    });
  };

  const handleSave = async (targetStatut: 'brouillon' | 'envoye') => {
    if (!selectedCustomer) {
      addToast('error', 'Veuillez sélectionner un client.');
      return;
    }
    if (calculatedLines.some(l => !l.description.trim())) {
      addToast('error', 'Veuillez remplir toutes les descriptions de ligne.');
      return;
    }

    setSaving(true);
    try {
      let invoice: ClientItem;
      if (isEditing && id) {
        // Delete existing line items first, then update invoice
        const existingLines = await lineItemsApi.list(Number(id), 'facture');
        await Promise.all(existingLines.map(l => lineItemsApi.remove(l.id)));
        invoice = await clientsApi.update(Number(id), {
          customer_id: selectedCustomer.id,
          client: selectedCustomer.name,
          montant: totals.grandTotal,
          date_emission: dateEmission,
          date_relance: dateEcheance || null,
          notes,
          statut: targetStatut,
          pj_filename: attachment,
        });
      } else {
        invoice = await clientsApi.create({
          type: 'facture',
          numero,
          customer_id: selectedCustomer.id,
          client: selectedCustomer.name,
          montant: totals.grandTotal,
          date_emission: dateEmission,
          date_relance: dateEcheance || null,
          notes,
          statut: targetStatut,
          montant_acompte: 0,
          pj_filename: attachment,
        });
      }

      for (let i = 0; i < calculatedLines.length; i++) {
        const line = calculatedLines[i];
        await lineItemsApi.create({
          document_id: invoice.id,
          document_type: 'facture',
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unit_price: line.unit_price,
          discount_type: line.discount_type,
          discount_value: line.discount_value,
          tax_rate: line.tax_rate,
          line_subtotal: line.line_subtotal,
          line_tax: line.line_tax,
          line_total: line.line_total,
          sort_order: i,
        });
      }

      addToast('success', isEditing ? 'Facture mise à jour.' : 'Facture créée avec succès.');
      navigate('/ventes/factures');
    } catch (err) {
      addToast('error', 'Erreur lors de l\'enregistrement.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentUploading(true);
    try {
      const res = await uploadFile(file);
      setAttachment(res.filename);
      addToast('success', 'Fichier uploadé.');
    } catch {
      addToast('error', 'Erreur upload.');
    } finally {
      setAttachmentUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#173B6C]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Ventes', to: '/ventes/factures' },
          { label: 'Factures', to: '/ventes/factures' },
          { label: isEditing ? 'Modifier' : 'Nouvelle' },
        ]}
        title={isEditing ? 'Modifier facture' : 'Nouvelle facture'}
        subtitle={isEditing ? `Facture ${numero}` : 'Créez une facture client.'}
      />

      {/* Invoice header info */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/ventes/factures')}
            className="btn-icon hover:bg-slate-50 text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#173B6C]" />
            Informations facture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="form-label">N° facture</label>
            <div className="form-input bg-slate-50 font-mono text-[#2563EB] font-semibold flex items-center">
              {numero}
            </div>
          </div>
          <div>
            <label className="form-label">Statut</label>
            <div className="form-input bg-slate-50 flex items-center">
              <span className="badge-amber">Brouillon</span>
            </div>
          </div>
          <div>
            <label className="form-label">Date d'émission</label>
            <input
              type="date"
              className="form-input"
              value={dateEmission}
              onChange={e => {
                const val = e.target.value;
                setDateEmission(val);
                if (selectedCustomer && val && !isEditing) {
                  const d = new Date(val);
                  d.setDate(d.getDate() + selectedCustomer.default_payment_terms_days);
                  setDateEcheance(d.toISOString().split('T')[0]);
                }
              }}
            />
          </div>
          <div>
            <label className="form-label">Date d'échéance</label>
            <input
              type="date"
              className="form-input"
              value={dateEcheance}
              onChange={e => setDateEcheance(e.target.value)}
            />
          </div>
        </div>

        {/* Customer selection */}
        <div className="mb-2 relative">
          <label className="form-label">Client</label>
          <div className="relative">
            <input
              className="form-input"
              placeholder="Rechercher un client..."
              value={selectedCustomer ? selectedCustomer.name : customerSearch}
              onChange={e => {
                if (!selectedCustomer) {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }
              }}
              onFocus={() => {
                if (!selectedCustomer) setShowCustomerDropdown(true);
              }}
            />
            {selectedCustomer && (
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {showCustomerDropdown && !selectedCustomer && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#94A3B8]">Aucun client trouvé</div>
                ) : (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F1F5F9] text-sm transition-colors"
                      onClick={() => handleCustomerSelect(c)}
                    >
                      <div className="font-medium text-[#111827]">{c.name}</div>
                      <div className="text-xs text-[#94A3B8]">
                        {c.email && <span>{c.email} · </span>}
                        {c.phone && <span>{c.phone}</span>}
                      </div>
                    </button>
                  ))
                )}
                <button
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F1F5F9] text-sm text-[#2563EB] font-medium border-t border-[#E2E8F0] flex items-center gap-2"
                  onClick={() => {
                    setShowCustomerDrawer(true);
                    setShowCustomerDropdown(false);
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  Créer un nouveau client
                </button>
              </div>
            )}
          </div>
          {selectedCustomer && (
            <div className="mt-2 text-sm text-[#64748B]">
              Délai de paiement : {selectedCustomer.default_payment_terms_days} jours
              {selectedCustomer.tax_id && <span> · NIF : {selectedCustomer.tax_id}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#111827]">Lignes de facture</h3>
          <button onClick={addLine} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>
        </div>

        <div className="data-table-container overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Description</th>
                <th className="text-right w-24">Qté</th>
                <th className="w-24">Unité</th>
                <th className="text-right w-28">Prix U.</th>
                <th className="text-right w-32">Remise</th>
                <th className="text-right w-24">TVA</th>
                <th className="text-right w-28">Total</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {calculatedLines.map((line, index) => (
                <tr key={index}>
                  <td className="text-[#94A3B8] text-xs font-mono">{index + 1}</td>
                  <td>
                    <input
                      className="form-input min-w-[180px]"
                      placeholder="Description..."
                      value={line.description}
                      onChange={e => updateLine(index, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input text-right"
                      min={0}
                      step={0.01}
                      value={line.quantity}
                      onChange={e => updateLine(index, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      className="form-input"
                      value={line.unit}
                      onChange={e => updateLine(index, { unit: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input text-right"
                      min={0}
                      step={0.01}
                      value={line.unit_price}
                      onChange={e => updateLine(index, { unit_price: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <select
                        className="form-select w-20"
                        value={line.discount_type}
                        onChange={e => updateLine(index, { discount_type: e.target.value as 'none' | 'percent' | 'fixed' })}
                      >
                        <option value="none">—</option>
                        <option value="percent">%</option>
                        <option value="fixed">FCFA</option>
                      </select>
                      {line.discount_type !== 'none' && (
                        <input
                          type="number"
                          className="form-input text-right w-20"
                          min={0}
                          step={0.01}
                          value={line.discount_value}
                          onChange={e => updateLine(index, { discount_value: Number(e.target.value) })}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="form-input text-right w-16"
                        min={0}
                        step={0.01}
                        value={line.tax_rate}
                        onChange={e => updateLine(index, { tax_rate: Number(e.target.value) })}
                      />
                      <span className="text-xs text-[#94A3B8]">%</span>
                    </div>
                  </td>
                  <td className="text-right amount text-[#111827]">{formatFCFA(line.line_total)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => duplicateLine(index)}
                        className="btn-icon w-8 h-8"
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                      </button>
                      <button
                        onClick={() => removeLine(index)}
                        className="btn-icon w-8 h-8 hover:bg-rose-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#94A3B8] hover:text-rose-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & Attachments */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Conditions, commentaires..."
            />
          </div>
          <div>
            <label className="form-label">Pièce jointe</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 form-input flex items-center justify-between bg-slate-50">
                <span className="text-sm text-[#64748B] truncate">
                  {attachmentUploading ? 'Upload en cours...' : (attachment || 'Aucun fichier')}
                </span>
                {attachment && !attachmentUploading && (
                  <button
                    onClick={() => setAttachment(null)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                id="attachment-input"
                onChange={handleAttachmentChange}
                disabled={attachmentUploading}
              />
              <label
                htmlFor="attachment-input"
                className="btn-secondary btn-sm cursor-pointer shrink-0"
              >
                <Paperclip className="w-4 h-4" />
                {attachment ? 'Changer' : 'Joindre'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky totals bar */}
      <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] shadow-lg z-10 py-4 px-6 -mx-6 md:-mx-8 mt-6 rounded-b-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-[#94A3B8] text-xs uppercase font-semibold tracking-wide">Sous-total</span>
              <div className="font-semibold font-mono">{formatFCFA(totals.subtotal)}</div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-xs uppercase font-semibold tracking-wide">Remises</span>
              <div className="font-semibold font-mono text-[#DC2626]">-{formatFCFA(totals.discountTotal)}</div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-xs uppercase font-semibold tracking-wide">Base taxable</span>
              <div className="font-semibold font-mono">{formatFCFA(totals.taxableAmount)}</div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-xs uppercase font-semibold tracking-wide">TVA</span>
              <div className="font-semibold font-mono">{formatFCFA(totals.taxTotal)}</div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-xs uppercase font-semibold tracking-wide">Total TTC</span>
              <div className="font-bold text-lg font-mono text-[#111827]">{formatFCFA(totals.grandTotal)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/ventes/factures')}
              className="btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button
              onClick={() => addToast('info', 'Prévisualisation disponible après enregistrement.')}
              className="btn-ghost btn-sm"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>
            <button
              onClick={() => handleSave('brouillon')}
              className="btn-secondary btn-sm"
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              Enregistrer brouillon
            </button>
            <button
              onClick={() => handleSave('envoye')}
              className="btn-primary btn-sm"
              disabled={saving}
            >
              <Send className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer et envoyer'}
            </button>
          </div>
        </div>
      </div>

      <CustomerDrawer
        isOpen={showCustomerDrawer}
        onClose={() => setShowCustomerDrawer(false)}
        onSave={handleCustomerCreated}
        existingCustomers={customers}
      />
    </div>
  );
}
