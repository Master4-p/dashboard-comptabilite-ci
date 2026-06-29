import jsPDF from 'jspdf';
import { formatFCFA, formatDate } from '../lib/utils';
import type { ClientItem } from '../lib/api';

export function exportInvoicePDF(item: ClientItem) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(23, 59, 108); // navy #173B6C
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELAIS IT', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comptabilité — Côte d\'Ivoire', margin, 26);
  doc.text('Devise : FCFA', margin, 31);

  // Title
  y = 45;
  doc.setTextColor(23, 59, 108);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(item.type === 'facture' ? 'FACTURE' : 'PROFORMA', pageWidth - margin, y, { align: 'right' });

  // Invoice number
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`N° : ${item.numero}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.text(`Date : ${formatDate(item.date_emission)}`, pageWidth - margin, y, { align: 'right' });

  // Client info
  y = 55;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(item.client, margin, y);

  // Separator
  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  // Table header
  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Désignation', margin + 2, y);
  doc.text('Montant', pageWidth - margin - 2, y, { align: 'right' });

  // Line item
  y += 10;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(item.type === 'facture' ? 'Facture client' : 'Proforma', margin + 2, y);
  doc.text(formatFCFA(item.montant), pageWidth - margin - 2, y, { align: 'right' });

  // Notes
  if (item.notes) {
    y += 10;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('Notes :', margin + 2, y);
    y += 4;
    doc.text(item.notes, margin + 2, y);
  }

  // Totals
  y += 15;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text('Montant total', margin + 2, y);
  doc.setTextColor(23, 59, 108);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFCFA(item.montant), pageWidth - margin - 2, y, { align: 'right' });

  // Acompte
  if (item.montant_acompte > 0) {
    y += 6;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Acompte reçu', margin + 2, y);
    doc.text(formatFCFA(item.montant_acompte), pageWidth - margin - 2, y, { align: 'right' });

    y += 6;
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('RESTE À PAYER', margin + 2, y);
    doc.text(formatFCFA(item.montant - item.montant_acompte), pageWidth - margin - 2, y, { align: 'right' });
  }

  // Status
  y += 10;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Statut : ${item.statut.toUpperCase()}`, margin + 2, y);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('Relais IT — Trust it.', margin, pageHeight - 15);
  doc.text('Document généré automatiquement.', pageWidth - margin, pageHeight - 15, { align: 'right' });

  doc.save(`${item.numero}.pdf`);
}

export function exportExpensePDF(item: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFillColor(23, 59, 108);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELAIS IT', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comptabilité — Côte d\'Ivoire', margin, 26);

  y = 45;
  doc.setTextColor(23, 59, 108);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(item.type === 'facture_fournisseur' ? 'FACTURE FOURNISSEUR' : 'DÉPENSE', pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`N° : ${item.numero || '-'}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.text(`Date : ${formatDate(item.date_depense)}`, pageWidth - margin, y, { align: 'right' });

  y = 55;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FOURNISSEUR', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(item.fournisseur, margin, y);
  if (item.categorie) {
    y += 5;
    doc.text(`Catégorie : ${item.categorie}`, margin, y);
  }

  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Désignation', margin + 2, y);
  doc.text('Montant', pageWidth - margin - 2, y, { align: 'right' });

  y += 10;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(item.type === 'facture_fournisseur' ? 'Facture fournisseur' : 'Dépense', margin + 2, y);
  doc.text(formatFCFA(item.montant), pageWidth - margin - 2, y, { align: 'right' });

  if (item.notes) {
    y += 10;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('Notes :', margin + 2, y);
    y += 4;
    doc.text(item.notes, margin + 2, y);
  }

  y += 15;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text('Montant total', margin + 2, y);
  doc.setTextColor(23, 59, 108);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFCFA(item.montant), pageWidth - margin - 2, y, { align: 'right' });

  if (item.montant_acompte > 0) {
    y += 6;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Acompte versé', margin + 2, y);
    doc.text(formatFCFA(item.montant_acompte), pageWidth - margin - 2, y, { align: 'right' });
    y += 6;
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('RESTE À PAYER', margin + 2, y);
    doc.text(formatFCFA(item.montant - item.montant_acompte), pageWidth - margin - 2, y, { align: 'right' });
  }

  y += 10;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Statut : ${item.statut.toUpperCase()}`, margin + 2, y);

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('Relais IT — Trust it.', margin, pageHeight - 15);
  doc.text('Document généré automatiquement.', pageWidth - margin, pageHeight - 15, { align: 'right' });

  doc.save(`${item.numero || 'depense'}.pdf`);
}
