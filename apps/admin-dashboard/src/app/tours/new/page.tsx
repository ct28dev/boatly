'use client';

import { AdminLayout } from '@/components/ui/AdminLayout';
import { TourForm } from '@/components/forms/TourForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTourPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/tours"
            className="p-2 rounded-lg hover:bg-gray-100 text-admin-muted hover:text-admin-text"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-admin-text">Create New Tour</h1>
            <p className="text-sm text-admin-muted mt-0.5">
              Fill in the details to create a new tour listing.
            </p>
          </div>
        </div>

        <TourForm />
      </div>
    </AdminLayout>
  );
}
