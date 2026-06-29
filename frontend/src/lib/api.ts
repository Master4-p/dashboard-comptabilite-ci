import axios from 'axios';

const isProd = (import.meta as any).env?.PROD;

export const api = axios.create({
  baseURL: isProd ? '/api' : ((import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface ClientItem {
  id: number;
  type: 'facture' | 'proforma';
  numero: string;
  client: string;
  customer_id?: number | null;
  customer_name?: string;
  montant: number;
  date_emission: string;
  date_relance: string | null;
  statut: 'brouillon' | 'envoye' | 'relance' | 'acompte' | 'solde' | 'annule' | 'accepte' | 'refuse' | 'expire' | 'converti';
  date_validite: string | null;
  montant_acompte: number;
  notes: string;
  pj_filename: string | null;
  pj_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface FournisseurItem {
  id: number;
  type: 'facture_fournisseur' | 'depense';
  numero: string | null;
  fournisseur: string;
  supplier_id?: number | null;
  supplier_name?: string;
  categorie: string | null;
  montant: number;
  date_depense: string;
  date_echeance: string | null;
  statut: 'impayee' | 'acompte_verse' | 'payee' | 'annule';
  montant_acompte: number;
  notes: string;
  pj_filename: string | null;
  pj_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  type: 'entreprise' | 'particulier';
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  tax_id: string | null;
  rccm: string | null;
  default_payment_terms_days: number;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  invoices_count?: number;
  invoices_total?: number;
  invoices_paid?: number;
  proformas_count?: number;
  proformas_total?: number;
  payments_total?: number;
}

export interface Supplier {
  id: number;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  rccm: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  expenses_count?: number;
  expenses_total?: number;
  expenses_paid?: number;
}

export interface LineItem {
  id: number;
  document_id: number;
  document_type: 'facture' | 'proforma' | 'facture_fournisseur' | 'depense';
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
  sort_order: number;
  created_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  customer_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  receiving_account: string | null;
  attachment_filename: string | null;
  attachment_path: string | null;
  notes: string | null;
  created_at: string;
  invoice_numero?: string;
  customer_name?: string;
}

export interface Disbursement {
  id: number;
  expense_id: number;
  supplier_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  source_account: string | null;
  attachment_filename: string | null;
  attachment_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface ClientStats {
  attente: number;
  solde: number;
  acompte: number;
  proformas: number;
  relances_statut: number;
  relances_30j: number;
}

export interface FournisseurStats {
  a_payer: number;
  paye: number;
  acompte_verse: number;
}

export interface Alert {
  type: 'client' | 'fournisseur';
  niveau: 'danger' | 'warning';
  message: string;
}

export interface MonthlyStats {
  months: string[];
  encaissements: number[];
  decaissements: number[];
  solde: number[];
  factures: number[];
  depenses: number[];
}

export interface NumberingResponse {
  prefix: string;
  year: number;
  last_number: number;
  next_number: number;
  formatted: string;
}

// API Clients
export const clientsApi = {
  list: (params?: Record<string, string>) => api.get<ClientItem[]>('/clients', { params }).then(r => r.data),
  get: (id: number) => api.get<ClientItem>(`/clients/${id}`).then(r => r.data),
  create: (data: Partial<ClientItem>) => api.post<ClientItem>('/clients', data).then(r => r.data),
  update: (id: number, data: Partial<ClientItem>) => api.put<ClientItem>(`/clients/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/clients/${id}`).then(r => r.data),
  changeStatut: (id: number, statut: string, montant_acompte?: number) =>
    api.patch<ClientItem>(`/clients/${id}/statut`, { statut, montant_acompte }).then(r => r.data),
  stats: () => api.get<ClientStats>('/clients/stats/global').then(r => r.data),
};

// API Fournisseurs
export const fournisseursApi = {
  list: (params?: Record<string, string>) => api.get<FournisseurItem[]>('/fournisseurs', { params }).then(r => r.data),
  create: (data: Partial<FournisseurItem>) => api.post<FournisseurItem>('/fournisseurs', data).then(r => r.data),
  update: (id: number, data: Partial<FournisseurItem>) => api.put<FournisseurItem>(`/fournisseurs/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/fournisseurs/${id}`).then(r => r.data),
  changeStatut: (id: number, statut: string, montant_acompte?: number) =>
    api.patch<FournisseurItem>(`/fournisseurs/${id}/statut`, { statut, montant_acompte }).then(r => r.data),
  stats: () => api.get<FournisseurStats>('/fournisseurs/stats/global').then(r => r.data),
};

// API Customers
export const customersApi = {
  list: (params?: Record<string, string>) => api.get<Customer[]>('/customers', { params }).then(r => r.data),
  get: (id: number) => api.get<Customer>(`/customers/${id}`).then(r => r.data),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data).then(r => r.data),
  update: (id: number, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/customers/${id}`).then(r => r.data),
};

// API Suppliers
export const suppliersApi = {
  list: (params?: Record<string, string>) => api.get<Supplier[]>('/suppliers', { params }).then(r => r.data),
  get: (id: number) => api.get<Supplier>(`/suppliers/${id}`).then(r => r.data),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data).then(r => r.data),
  update: (id: number, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/suppliers/${id}`).then(r => r.data),
};

// API Line Items
export const lineItemsApi = {
  list: (document_id: number, document_type: string) =>
    api.get<LineItem[]>(`/line-items?document_id=${document_id}&document_type=${document_type}`).then(r => r.data),
  create: (data: Partial<LineItem>) => api.post<LineItem>('/line-items', data).then(r => r.data),
  remove: (id: number) => api.delete(`/line-items/${id}`).then(r => r.data),
};

// API Payments
export const paymentsApi = {
  list: (params?: Record<string, string>) => api.get<Payment[]>('/payments', { params }).then(r => r.data),
  create: (data: Partial<Payment>) => api.post<Payment>('/payments', data).then(r => r.data),
  remove: (id: number) => api.delete(`/payments/${id}`).then(r => r.data),
};

// API Disbursements
export const disbursementsApi = {
  list: (params?: Record<string, string>) => api.get<Disbursement[]>('/disbursements', { params }).then(r => r.data),
  create: (data: Partial<Disbursement>) => api.post<Disbursement>('/disbursements', data).then(r => r.data),
  remove: (id: number) => api.delete(`/disbursements/${id}`).then(r => r.data),
};

// API Numbering
export const numberingApi = {
  get: (prefix: string, year: number) => api.get<NumberingResponse>(`/numbering/${prefix}/${year}`).then(r => r.data),
  increment: (prefix: string, year: number) => api.post<NumberingResponse>(`/numbering/${prefix}/${year}/increment`).then(r => r.data),
};

// Upload
export const uploadFile = async (file: File): Promise<{ filename: string; storedName: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Alerts & Export
export const alertsApi = {
  list: () => api.get<Alert[]>('/alerts').then(r => r.data),
};

export const statsApi = {
  monthly: () => api.get<MonthlyStats>('/stats/monthly').then(r => r.data),
};

export const activityApi = {
  list: () => api.get<any[]>('/activity').then(r => r.data),
};

export const exportCustomers = () => window.open(`${api.defaults.baseURL}/export/customers`, '_blank');
export const exportSuppliers = () => window.open(`${api.defaults.baseURL}/export/suppliers`, '_blank');
export const exportClients = () => window.open(`${api.defaults.baseURL}/export/clients`, '_blank');
export const exportFournisseurs = () => window.open(`${api.defaults.baseURL}/export/fournisseurs`, '_blank');
