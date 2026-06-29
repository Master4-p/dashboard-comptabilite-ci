import { statutClientColors, statutClientLabels, statutFournisseurColors, statutFournisseurLabels } from '../../lib/utils';

interface StatusBadgeProps {
  statut: string;
  type?: 'client' | 'fournisseur';
}

export default function StatusBadge({ statut, type = 'client' }: StatusBadgeProps) {
  if (type === 'client') {
    return (
      <span className={`badge ${statutClientColors[statut] || 'badge-gray'}`}>
        {statutClientLabels[statut] || statut}
      </span>
    );
  }
  return (
    <span className={`badge ${statutFournisseurColors[statut] || 'badge-gray'}`}>
      {statutFournisseurLabels[statut] || statut}
    </span>
  );
}
