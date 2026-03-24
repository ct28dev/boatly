import { redirect } from 'next/navigation';

/** @deprecated ใช้ `/` เป็น Dashboard หลัก */
export default function HomeLegacyPage() {
  redirect('/');
}
