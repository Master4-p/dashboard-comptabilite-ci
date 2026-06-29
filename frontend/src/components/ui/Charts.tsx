import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = {
  navy: '#173B6C',
  blue: '#2563EB',
  orange: '#F59E0B',
  success: '#059669',
  danger: '#DC2626',
  indigo: '#6366F1',
  gray: '#94A3B8',
};

interface CashFlowData {
  month: string;
  encaissements: number;
  decaissements: number;
  solde: number;
}

export function CashFlowChart({ data }: { data: CashFlowData[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}
            formatter={(value: any) => [value ? Number(value).toLocaleString('fr-FR') + ' FCFA' : '', '']}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="encaissements" name="Encaissements" fill={COLORS.navy} radius={[4, 4, 0, 0]} />
          <Bar dataKey="decaissements" name="Décaissements" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export function StatusPieChart({ data }: { data: StatusData[] }) {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}
            formatter={(value: any) => [value ? Number(value).toLocaleString('fr-FR') + ' FCFA' : '', '']}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BalanceData {
  month: string;
  solde: number;
}

export function BalanceAreaChart({ data }: { data: BalanceData[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}
            formatter={(value: any) => [value ? Number(value).toLocaleString('fr-FR') + ' FCFA' : '', 'Solde']}
          />
          <Area type="monotone" dataKey="solde" stroke={COLORS.navy} fill="url(#colorSolde)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { COLORS };
