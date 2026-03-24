'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  Copy,
  Share2,
  MapPin,
  Download,
  ShieldCheck,
  X,
  Ship,
} from 'lucide-react';

type PaymentTab = 'qr' | 'card' | 'cod';

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>('qr');
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (showSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showSuccess]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
  };

  const totalPrice = 3900;
  const bookingId = 'BH-2569-03-00142';

  const tabs: { id: PaymentTab; label: string; icon: typeof QrCode }[] = [
    { id: 'qr', label: 'QR Payment', icon: QrCode },
    { id: 'card', label: 'บัตรเครดิต', icon: CreditCard },
    { id: 'cod', label: 'จ่ายที่ท่าเรือ', icon: Banknote },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/booking" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">ชำระเงิน</h1>
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=200&h=200&fit=crop)',
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                เกาะเจมส์บอนด์ + เกาะปันหยี
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                15 มี.ค. 2569 • 09:00 น. • 2 ผู้ใหญ่, 1 เด็ก
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-ocean-800">
                ฿{totalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-card mb-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-ocean-700 text-white shadow-md'
                    : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-card p-6"
            >
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">ยอดชำระ</p>
                <p className="text-3xl font-bold text-ocean-800 mb-4">
                  ฿{totalPrice.toLocaleString()}
                </p>

                {/* QR Code placeholder */}
                <div className="w-56 h-56 mx-auto bg-gray-50 rounded-2xl border-2 border-dashed border-ocean-200 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="w-20 h-20 text-ocean-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                      สแกน QR Code เพื่อชำระเงิน
                    </p>
                  </div>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span
                    className={`text-sm font-bold ${timeLeft < 120 ? 'text-red-500' : 'text-orange-500'}`}
                  >
                    เหลือเวลา {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    บันทึก QR
                  </button>
                  <button
                    onClick={() => setShowSuccess(true)}
                    className="flex-1 py-2.5 rounded-xl bg-ocean-700 text-white text-sm font-bold"
                  >
                    ชำระแล้ว
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-card p-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    ชื่อบนบัตร
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="SOMCHAI JAIDEE"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    หมายเลขบัตร
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      วันหมดอายุ
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) =>
                        setCardExpiry(formatExpiry(e.target.value))
                      }
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))
                      }
                      placeholder="•••"
                      maxLength={3}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 tracking-widest"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ข้อมูลบัตรถูกเข้ารหัสด้วย SSL 256-bit</span>
                </div>

                <button
                  onClick={() => setShowSuccess(true)}
                  className="w-full py-3.5 rounded-2xl bg-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-700/30 mt-2"
                >
                  ชำระ ฿{totalPrice.toLocaleString()}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'cod' && (
            <motion.div
              key="cod"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-card p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-ocean-50 flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8 text-ocean-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                ชำระเงินที่ท่าเรือ
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                คุณสามารถชำระเงินสดหรือโอนเงินที่จุดขึ้นเรือ
                <br />
                ในวันเดินทาง กรุณามาก่อนเวลาออกเดินทาง 30 นาที
              </p>

              <div className="bg-amber-50 rounded-xl p-4 mb-5 text-left">
                <p className="text-sm font-medium text-amber-800">
                  ⚠️ หมายเหตุ
                </p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  <li>• การจองจะถูกยกเลิกหากไม่มาถึงก่อนเวลา 15 นาที</li>
                  <li>• รับเฉพาะเงินสด หรือ PromptPay เท่านั้น</li>
                </ul>
              </div>

              <button
                onClick={() => setShowSuccess(true)}
                className="w-full py-3.5 rounded-2xl bg-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-700/30"
              >
                ยืนยันการจอง
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </motion.div>

                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  จองสำเร็จ! 🎉
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  การจองของคุณได้รับการยืนยันแล้ว
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">หมายเลขการจอง</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-ocean-800">
                        {bookingId}
                      </span>
                      <button className="p-1">
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ยอดชำระ</span>
                    <span className="font-bold">
                      ฿{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">สถานะ</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                      ยืนยันแล้ว
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mb-3">
                  <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    แชร์
                  </button>
                  <Link
                    href="/map"
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    แผนที่
                  </Link>
                </div>

                <Link
                  href="/profile/bookings"
                  className="block w-full py-3 rounded-2xl bg-ocean-700 text-white font-bold text-sm"
                >
                  ดูการจองของฉัน
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
