import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number): string {
  if (amount === null || amount === undefined) return '—';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function isUrgent(dateStr: string, days = 30): boolean {
  return daysSince(dateStr) > days;
}

export function todayInputValue(): string {
  return new Date().toISOString().split('T')[0];
}

export const statutClientLabels: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  relance: 'Relancé',
  acompte: 'Acompte',
  solde: 'Soldé',
  annule: 'Annulé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
  converti: 'Converti',
};

export const statutClientColors: Record<string, string> = {
  brouillon: 'bg-slate-500/10 text-slate-600 border-slate-200',
  envoye: 'bg-blue-500/10 text-blue-600 border-blue-200',
  relance: 'bg-amber-500/10 text-amber-600 border-amber-200',
  acompte: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  solde: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  annule: 'bg-rose-500/10 text-rose-600 border-rose-200',
  accepte: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  refuse: 'bg-rose-500/10 text-rose-600 border-rose-200',
  expire: 'bg-gray-500/10 text-gray-600 border-gray-200',
  converti: 'bg-teal-500/10 text-teal-600 border-teal-200',
};

export const statutFournisseurLabels: Record<string, string> = {
  impayee: 'Impayée',
  acompte_verse: 'Acompte',
  payee: 'Payée',
};

export const statutFournisseurColors: Record<string, string> = {
  impayee: 'bg-rose-500/10 text-rose-600 border-rose-200',
  acompte_verse: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  payee: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
};

export const categorieLabels: Record<string, string> = {
  matiere_premiere: 'Matière première',
  fourniture: 'Fourniture bureau',
  transport: 'Transport',
  loyer: 'Loyer / Local',
  services: 'Services',
  marketing: 'Marketing',
  equipement: 'Équipement',
  salaire: 'Salaires',
  impots: 'Impôts / Taxes',
  divers: 'Divers',
};
