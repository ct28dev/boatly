'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Mar', revenue: 320000 },
  { month: 'Apr', revenue: 450000 },
  { month: 'May', revenue: 520000 },
  { month: 'Jun', revenue: 680000 },
  { month: 'Jul', revenue: 890000 },
  { month: 'Aug', revenue: 1020000 },
  { month: 'Sep', revenue: 780000 },
  { month: 'Oct', revenue: 650000 },
  { month: 'Nov', revenue: 580000 },
  { month: 'Dec', revenue: 720000 },
  { month: 'Jan', revenue: 430000 },
  { month: 'Feb', revenue: 510000 },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-admin-border rounded-lg shadow-lg px-4 py-2.5">
      <p className="text-xs text-admin-muted">{label}</p>
      <p className="text-sm font-semibold text-admin-text mt-0.5">
        ฿{(payload[0].value / 1000).toFixed(0)}K
      </p>
    </div>
  );
}

export function RevenueChart() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-admin-text">Revenue Overview</h3>
          <p className="text-sm text-admin-muted mt-0.5">Last 12 months</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-ocean-500" />
            <span className="text-xs text-admin-muted">Revenue</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0077b6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0077b6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(v) => `${v / 1000}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0077b6"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#0077b6', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
