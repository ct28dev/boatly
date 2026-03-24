'use client';

import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface PieDataItem {
  name: string;
  value: number;
}

interface PieChartProps {
  title: string;
  subtitle?: string;
  data?: PieDataItem[];
}

const defaultData: PieDataItem[] = [
  { name: 'Speedboat', value: 380 },
  { name: 'Catamaran', value: 250 },
  { name: 'Yacht', value: 120 },
  { name: 'Longtail', value: 190 },
  { name: 'Ferry', value: 160 },
];

const COLORS = ['#0077b6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PieDataItem; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-admin-border rounded-lg shadow-lg px-4 py-2.5">
      <p className="text-sm font-medium text-admin-text">{payload[0].payload.name}</p>
      <p className="text-sm text-admin-muted">{payload[0].value} bookings</p>
    </div>
  );
}

export function PieChartComponent({ title, subtitle, data = defaultData }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-admin-text">{title}</h3>
        {subtitle && <p className="text-sm text-admin-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-admin-muted">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-admin-text">{item.value}</span>
              <span className="text-xs text-admin-muted w-10 text-right">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
