'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

interface BoatFormData {
  name: string;
  type: string;
  capacity: string;
  provider: string;
  status: string;
  registrationNo: string;
  year: string;
  description: string;
}

interface BoatFormProps {
  initialData?: Partial<BoatFormData>;
  onSubmit?: (data: BoatFormData) => void;
  isEdit?: boolean;
}

const defaultData: BoatFormData = {
  name: '',
  type: 'speedboat',
  capacity: '',
  provider: '',
  status: 'active',
  registrationNo: '',
  year: '',
  description: '',
};

const providers = [
  'Sea Explorer Co.',
  'Island Hopper Tours',
  'Andaman Adventures',
  'Blue Horizon Marine',
  'Thai Sea Cruises',
  'Coral Bay Boats',
  'Phuket Sailing Club',
  'Gulf Star Marine',
];

export function BoatForm({ initialData, onSubmit, isEdit = false }: BoatFormProps) {
  const [form, setForm] = useState<BoatFormData>({ ...defaultData, ...initialData });

  const updateField = <K extends keyof BoatFormData>(key: K, value: BoatFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Boat Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Boat Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Sea Breeze I"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Registration No.
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. TH-PKT-1234"
              value={form.registrationNo}
              onChange={(e) => updateField('registrationNo', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Boat Type
            </label>
            <select
              className="input-field"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
            >
              <option value="speedboat">Speedboat</option>
              <option value="catamaran">Catamaran</option>
              <option value="yacht">Yacht</option>
              <option value="longtail">Longtail Boat</option>
              <option value="ferry">Ferry</option>
              <option value="sailboat">Sailboat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Passenger Capacity
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 30"
              value={form.capacity}
              onChange={(e) => updateField('capacity', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Provider
            </label>
            <select
              className="input-field"
              value={form.provider}
              onChange={(e) => updateField('provider', e.target.value)}
            >
              <option value="">Select provider...</option>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Year Built
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 2022"
              value={form.year}
              onChange={(e) => updateField('year', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Status
            </label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Description
            </label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Additional details about the boat..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Boat Image</h3>
        <div className="border-2 border-dashed border-admin-border rounded-xl p-8 text-center hover:border-ocean-500 transition-colors cursor-pointer">
          <Upload className="w-10 h-10 text-admin-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-admin-text">
            Drop image here or click to upload
          </p>
          <p className="text-xs text-admin-muted mt-1">PNG, JPG up to 5MB</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">
          {isEdit ? 'Update Boat' : 'Add Boat'}
        </button>
      </div>
    </form>
  );
}
