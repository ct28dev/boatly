'use client';

import { useState } from 'react';

interface ProviderFormData {
  companyName: string;
  companyNameTh: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  status: string;
  notes: string;
}

interface ProviderFormProps {
  initialData?: Partial<ProviderFormData>;
  onSubmit?: (data: ProviderFormData) => void;
  isEdit?: boolean;
}

const defaultData: ProviderFormData = {
  companyName: '',
  companyNameTh: '',
  taxId: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  bankName: '',
  bankAccountNo: '',
  bankAccountName: '',
  status: 'pending',
  notes: '',
};

export function ProviderForm({ initialData, onSubmit, isEdit = false }: ProviderFormProps) {
  const [form, setForm] = useState<ProviderFormData>({ ...defaultData, ...initialData });

  const updateField = <K extends keyof ProviderFormData>(key: K, value: ProviderFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Company Name (English)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Sea Explorer Co., Ltd."
              value={form.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Company Name (Thai)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. บริษัท ซี เอ็กซ์พลอเรอร์ จำกัด"
              value={form.companyNameTh}
              onChange={(e) => updateField('companyNameTh', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Tax ID
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 0105562012345"
              value={form.taxId}
              onChange={(e) => updateField('taxId', e.target.value)}
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
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Address
            </label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Full company address..."
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Contact Person
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Full name"
              value={form.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="email@company.com"
              value={form.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="+66 XX XXX XXXX"
              value={form.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bank Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Bank Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Bank Name
            </label>
            <select
              className="input-field"
              value={form.bankName}
              onChange={(e) => updateField('bankName', e.target.value)}
            >
              <option value="">Select bank...</option>
              <option value="Bangkok Bank">Bangkok Bank</option>
              <option value="Kasikorn Bank">Kasikorn Bank</option>
              <option value="SCB">Siam Commercial Bank</option>
              <option value="Krungthai Bank">Krungthai Bank</option>
              <option value="TMBThanachart">TMBThanachart Bank</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Account Number
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="XXX-X-XXXXX-X"
              value={form.bankAccountNo}
              onChange={(e) => updateField('bankAccountNo', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Account holder name"
              value={form.bankAccountName}
              onChange={(e) => updateField('bankAccountName', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-admin-text mb-4">Internal Notes</h3>
        <textarea
          className="input-field min-h-[100px]"
          placeholder="Admin notes about this provider..."
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">
          {isEdit ? 'Update Provider' : 'Add Provider'}
        </button>
      </div>
    </form>
  );
}
