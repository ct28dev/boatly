'use client';

import { useState } from 'react';
import { Plus, Trash2, Upload, Clock, MapPin } from 'lucide-react';

interface TourFormData {
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  descriptionTh: string;
  duration: string;
  price: string;
  capacity: string;
  boatType: string;
  status: string;
  departurePier: string;
  images: string[];
  schedule: ScheduleItem[];
  highlights: string[];
  includes: string[];
}

interface ScheduleItem {
  time: string;
  activity: string;
}

interface TourFormProps {
  initialData?: Partial<TourFormData>;
  onSubmit?: (data: TourFormData) => void;
  isEdit?: boolean;
}

const defaultData: TourFormData = {
  nameEn: '',
  nameTh: '',
  descriptionEn: '',
  descriptionTh: '',
  duration: '',
  price: '',
  capacity: '',
  boatType: 'speedboat',
  status: 'draft',
  departurePier: '',
  images: [],
  schedule: [{ time: '08:00', activity: '' }],
  highlights: [''],
  includes: [''],
};

const piers = [
  'Rassada Pier, Phuket',
  'Ao Nang Pier, Krabi',
  'Nopparat Thara Pier, Krabi',
  'Laem Sok Pier, Trat',
  'Bangrak Pier, Koh Samui',
  'Donsak Pier, Surat Thani',
];

export function TourForm({ initialData, onSubmit, isEdit = false }: TourFormProps) {
  const [form, setForm] = useState<TourFormData>({
    ...defaultData,
    ...initialData,
  });

  const updateField = <K extends keyof TourFormData>(key: K, value: TourFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addScheduleItem = () => {
    updateField('schedule', [...form.schedule, { time: '', activity: '' }]);
  };

  const removeScheduleItem = (index: number) => {
    updateField('schedule', form.schedule.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: string) => {
    const updated = [...form.schedule];
    updated[index] = { ...updated[index], [field]: value };
    updateField('schedule', updated);
  };

  const addListItem = (key: 'highlights' | 'includes') => {
    updateField(key, [...form[key], '']);
  };

  const removeListItem = (key: 'highlights' | 'includes', index: number) => {
    updateField(key, form[key].filter((_, i) => i !== index));
  };

  const updateListItem = (key: 'highlights' | 'includes', index: number, value: string) => {
    const updated = [...form[key]];
    updated[index] = value;
    updateField(key, updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Tour Name (English)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Phi Phi Island Day Trip"
              value={form.nameEn}
              onChange={(e) => updateField('nameEn', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Tour Name (Thai)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. ทัวร์เกาะพีพี วันเดย์ทริป"
              value={form.nameTh}
              onChange={(e) => updateField('nameTh', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Description (English)
            </label>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="Describe the tour experience..."
              value={form.descriptionEn}
              onChange={(e) => updateField('descriptionEn', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Description (Thai)
            </label>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="รายละเอียดทัวร์..."
              value={form.descriptionTh}
              onChange={(e) => updateField('descriptionTh', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tour Details */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Tour Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Duration
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="e.g. 8 hours"
                value={form.duration}
                onChange={(e) => updateField('duration', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Price (THB)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 2500"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Capacity
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
              Boat Type
            </label>
            <select
              className="input-field"
              value={form.boatType}
              onChange={(e) => updateField('boatType', e.target.value)}
            >
              <option value="speedboat">Speedboat</option>
              <option value="catamaran">Catamaran</option>
              <option value="yacht">Yacht</option>
              <option value="longtail">Longtail Boat</option>
              <option value="ferry">Ferry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Departure Pier
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
              <select
                className="input-field pl-9"
                value={form.departurePier}
                onChange={(e) => updateField('departurePier', e.target.value)}
              >
                <option value="">Select pier...</option>
                {piers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
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
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Images</h3>
        <div className="border-2 border-dashed border-admin-border rounded-xl p-8 text-center hover:border-ocean-500 transition-colors cursor-pointer">
          <Upload className="w-10 h-10 text-admin-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-admin-text">
            Drop images here or click to upload
          </p>
          <p className="text-xs text-admin-muted mt-1">
            PNG, JPG up to 5MB. Max 10 images.
          </p>
        </div>
      </div>

      {/* Schedule Builder */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-admin-text">Schedule</h3>
          <button type="button" onClick={addScheduleItem} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {form.schedule.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="time"
                className="input-field w-32"
                value={item.time}
                onChange={(e) => updateScheduleItem(i, 'time', e.target.value)}
              />
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Activity description..."
                value={item.activity}
                onChange={(e) => updateScheduleItem(i, 'activity', e.target.value)}
              />
              {form.schedule.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScheduleItem(i)}
                  className="p-2 text-admin-muted hover:text-red-500 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Highlights & Includes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-admin-text">Highlights</h3>
            <button type="button" onClick={() => addListItem('highlights')} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {form.highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Tour highlight..."
                  value={item}
                  onChange={(e) => updateListItem('highlights', i, e.target.value)}
                />
                {form.highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeListItem('highlights', i)}
                    className="p-2 text-admin-muted hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-admin-text">Includes</h3>
            <button type="button" onClick={() => addListItem('includes')} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {form.includes.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="What's included..."
                  value={item}
                  onChange={(e) => updateListItem('includes', i, e.target.value)}
                />
                {form.includes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeListItem('includes', i)}
                    className="p-2 text-admin-muted hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {isEdit ? 'Update Tour' : 'Create Tour'}
        </button>
      </div>
    </form>
  );
}
