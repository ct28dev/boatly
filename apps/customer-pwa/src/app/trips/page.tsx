import { redirect } from 'next/navigation';

/** รายการทริปทั้งหมด — ใช้หน้า /tours เป็นหลัก */
export default function TripsAliasPage() {
  redirect('/tours');
}
