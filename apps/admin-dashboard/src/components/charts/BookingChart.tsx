'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return {
    date: `${d.getDate()}/${d.getMonth() + 1}`,
    confirmed: Math.floor(Math.random() * 15) + 5,
    pending: Math.floor(Math.random() * 8) + 2,
    cancelled: Math.floor(Math.random() * 3),
  };
});

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-admin-border rounded-lg shadow-lg px-4 py-2.5">
      <p className="text-xs text-admin-muted mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize text-admin-muted">{entry.dataKey}:</span>
          <span className="font-medium text-admin-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BookingChart() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-admin-text">Booking Activity</h3>
          <p className="text-sm text-admin-muted mt-0.5">Last 14 days</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-admin-muted">Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-admin-muted">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-admin-muted">Cancelled</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="confirmed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
            <Bar dataKey="cancelled" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
