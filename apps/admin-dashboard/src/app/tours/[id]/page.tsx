'use client';

import { AdminLayout } from '@/components/ui/AdminLayout';
import { TourForm } from '@/components/forms/TourForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const mockTourData = {
  nameEn: 'Phi Phi Island Day Trip',
  nameTh: 'ทัวร์เกาะพีพี วันเดย์ทริป',
  descriptionEn:
    'Explore the stunning Phi Phi Islands with our premium speedboat tour. Visit Maya Bay, Pileh Lagoon, Viking Cave, and enjoy snorkeling in crystal clear waters. Includes lunch, snacks, and all equipment.',
  descriptionTh:
    'สำรวจหมู่เกาะพีพีอันงดงามด้วยทัวร์เรือสปีดโบ๊ทระดับพรีเมียม เยี่ยมชมอ่าวมาหยา อ่าวปิเละ ถ้ำไวกิ้ง และดำน้ำตื้นในน้ำใสแจ๋ว',
  duration: '8 hours',
  price: '2500',
  capacity: '30',
  boatType: 'speedboat',
  status: 'active',
  departurePier: 'Rassada Pier, Phuket',
  images: [],
  schedule: [
    { time: '07:30', activity: 'Pick up from hotel' },
    { time: '08:30', activity: 'Depart from Rassada Pier' },
    { time: '09:30', activity: 'Arrive at Pileh Lagoon - swimming & kayaking' },
    { time: '10:30', activity: 'Visit Viking Cave & Monkey Beach' },
    { time: '11:30', activity: 'Snorkeling at Loh Samah Bay' },
    { time: '12:30', activity: 'Lunch at Phi Phi Don' },
    { time: '14:00', activity: 'Maya Bay visit & photography' },
    { time: '15:30', activity: 'Depart for Phuket' },
    { time: '17:00', activity: 'Arrive at Rassada Pier & transfer to hotel' },
  ],
  highlights: [
    'Visit the famous Maya Bay from "The Beach" movie',
    'Swim in the stunning Pileh Lagoon',
    'Snorkeling in crystal clear waters',
    'Professional English-speaking guide',
    'Small group size for personal experience',
  ],
  includes: [
    'Hotel pickup & drop-off',
    'Speedboat transportation',
    'Lunch & snacks',
    'Snorkeling equipment',
    'National park fees',
    'Insurance coverage',
  ],
};

export default function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

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
            <h1 className="text-2xl font-bold text-admin-text">Edit Tour</h1>
            <p className="text-sm text-admin-muted mt-0.5">
              Editing: {mockTourData.nameEn} ({id})
            </p>
          </div>
        </div>

        <TourForm initialData={mockTourData} isEdit />
      </div>
    </AdminLayout>
  );
}
