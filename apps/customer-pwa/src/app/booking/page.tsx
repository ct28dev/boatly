'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  FileText,
  CreditCard,
  CheckCircle2,
  Minus,
  Plus,
  Sun,
  Sunset,
  CloudSun,
  Utensils,
  Shell,
  Baby,
  Accessibility,
  Ship,
  MapPin,
  Star,
} from 'lucide-react';

const steps = [
  { id: 1, label: 'วันที่', icon: Calendar },
  { id: 2, label: 'เวลา', icon: Clock },
  { id: 3, label: 'ผู้โดยสาร', icon: Users },
  { id: 4, label: 'คำขอพิเศษ', icon: FileText },
  { id: 5, label: 'สรุป', icon: CheckCircle2 },
  { id: 6, label: 'ชำระเงิน', icon: CreditCard },
];

const timeSlots = [
  { time: '09:00', label: 'รอบเช้า', icon: Sun, available: true },
  { time: '13:00', label: 'รอบบ่าย', icon: CloudSun, available: true },
  { time: '16:00', label: 'รอบเย็น', icon: Sunset, available: false },
];

const specialRequests = [
  { id: 'halal', label: 'อาหารฮาลาล', icon: Utensils },
  { id: 'seafood-allergy', label: 'แพ้อาหารทะเล', icon: Shell },
  { id: 'infant', label: 'มีเด็กเล็ก (ต่ำกว่า 2 ปี)', icon: Baby },
  { id: 'wheelchair', label: 'ต้องการวีลแชร์', icon: Accessibility },
];

const paymentMethods = [
  { id: 'qr', label: 'QR Payment', desc: 'สแกนจ่ายผ่าน Mobile Banking' },
  { id: 'card', label: 'บัตรเครดิต/เดบิต', desc: 'Visa, Mastercard, JCB' },
  { id: 'pier', label: 'ชำระที่ท่าเรือ', desc: 'จ่ายเงินสดวันเดินทาง' },
];

function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const calDays = generateCalendar(calYear, calMonth);

  const goNext = () => {
    if (step < 6) {
      setDirection(1);
      setStep(step + 1);
    }
  };
  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPassengers = adults + children;
  const pricePerAdult = 1500;
  const pricePerChild = 900;
  const totalPrice = adults * pricePerAdult + children * pricePerChild;

  const canProceed = () => {
    switch (step) {
      case 1: return selectedDate !== null;
      case 2: return selectedTime !== null;
      case 3: return adults > 0;
      case 4: return true;
      case 5: return true;
      case 6: return selectedPayment !== null;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/tours/1" className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">จองทริป</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {steps.map((s) => (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  s.id <= step ? 'bg-ocean-600' : 'bg-gray-200'
                }`}
              />
              <span
                className={`text-[9px] font-medium ${
                  s.id === step ? 'text-ocean-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute inset-0 overflow-y-auto px-5 py-5"
          >
            {/* Step 1: Calendar */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  เลือกวันเดินทาง
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  เลือกวันที่คุณต้องการออกเดินทาง
                </p>

                <div className="bg-white rounded-2xl shadow-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear(calYear - 1);
                        } else {
                          setCalMonth(calMonth - 1);
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h3 className="text-base font-bold text-gray-900">
                      {monthNames[calMonth]} {calYear + 543}
                    </h3>
                    <button
                      onClick={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear(calYear + 1);
                        } else {
                          setCalMonth(calMonth + 1);
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-gray-50"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-medium text-gray-400 py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day, i) => {
                      if (day === null)
                        return <div key={`empty-${i}`} />;
                      const isToday =
                        day === today.getDate() &&
                        calMonth === today.getMonth() &&
                        calYear === today.getFullYear();
                      const isPast =
                        new Date(calYear, calMonth, day) <
                        new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          today.getDate()
                        );
                      const isSelected = day === selectedDate && calMonth === today.getMonth();

                      return (
                        <button
                          key={day}
                          disabled={isPast}
                          onClick={() => setSelectedDate(day)}
                          className={`h-10 rounded-xl text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-ocean-700 text-white shadow-md'
                              : isToday
                                ? 'bg-ocean-50 text-ocean-700 font-bold'
                                : isPast
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-ocean-50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Time */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  เลือกรอบเวลา
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  เลือกรอบเวลาออกเดินทางที่สะดวก
                </p>

                <div className="space-y-3">
                  {timeSlots.map((slot) => {
                    const Icon = slot.icon;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                          selectedTime === slot.time
                            ? 'border-ocean-600 bg-ocean-50 shadow-md'
                            : slot.available
                              ? 'border-gray-100 bg-white hover:border-ocean-200'
                              : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                            selectedTime === slot.time
                              ? 'bg-ocean-700'
                              : 'bg-ocean-50'
                          }`}
                        >
                          <Icon
                            className={`w-7 h-7 ${
                              selectedTime === slot.time
                                ? 'text-white'
                                : 'text-ocean-600'
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-lg font-bold text-gray-900">
                            {slot.time}
                          </p>
                          <p className="text-sm text-gray-500">{slot.label}</p>
                        </div>
                        {!slot.available && (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 text-xs font-medium">
                            เต็ม
                          </span>
                        )}
                        {selectedTime === slot.time && (
                          <CheckCircle2 className="w-6 h-6 text-ocean-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Passengers */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  จำนวนผู้โดยสาร
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  ระบุจำนวนผู้เดินทาง
                </p>

                <div className="space-y-4">
                  {[
                    {
                      label: 'ผู้ใหญ่',
                      desc: 'อายุ 12 ปีขึ้นไป',
                      price: `฿${pricePerAdult.toLocaleString()}/คน`,
                      value: adults,
                      setValue: setAdults,
                      min: 1,
                      max: 20,
                    },
                    {
                      label: 'เด็ก',
                      desc: 'อายุ 2-11 ปี',
                      price: `฿${pricePerChild.toLocaleString()}/คน`,
                      value: children,
                      setValue: setChildren,
                      min: 0,
                      max: 10,
                    },
                    {
                      label: 'ทารก',
                      desc: 'ต่ำกว่า 2 ปี (ฟรี)',
                      price: 'ฟรี',
                      value: infants,
                      setValue: setInfants,
                      min: 0,
                      max: 5,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-card"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                        <p className="text-xs text-ocean-600 font-medium mt-0.5">
                          {item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            item.setValue(Math.max(item.min, item.value - 1))
                          }
                          disabled={item.value <= item.min}
                          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center disabled:opacity-30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-lg font-bold text-gray-900">
                          {item.value}
                        </span>
                        <button
                          onClick={() =>
                            item.setValue(Math.min(item.max, item.value + 1))
                          }
                          disabled={item.value >= item.max}
                          className="w-9 h-9 rounded-xl bg-ocean-700 text-white flex items-center justify-center disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-ocean-50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">รวมผู้โดยสาร</span>
                    <span className="font-bold text-ocean-800">
                      {totalPassengers + infants} คน
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Special Requests */}
            {step === 4 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  คำขอพิเศษ
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  แจ้งความต้องการพิเศษ (ถ้ามี)
                </p>

                <div className="space-y-3 mb-5">
                  {specialRequests.map((req) => {
                    const Icon = req.icon;
                    const isChecked = selectedRequests.has(req.id);
                    return (
                      <button
                        key={req.id}
                        onClick={() => toggleRequest(req.id)}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                          isChecked
                            ? 'border-ocean-600 bg-ocean-50'
                            : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isChecked ? 'bg-ocean-700' : 'bg-gray-100'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isChecked ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <span
                          className={`flex-1 text-left text-sm font-medium ${
                            isChecked ? 'text-ocean-800' : 'text-gray-700'
                          }`}
                        >
                          {req.label}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                            isChecked
                              ? 'bg-ocean-700 border-ocean-700'
                              : 'border-gray-300'
                          }`}
                        >
                          {isChecked && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม เช่น อาหารที่แพ้, ความต้องการพิเศษ..."
                    rows={4}
                    className="w-full rounded-2xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  สรุปการจอง
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  ตรวจสอบรายละเอียดก่อนชำระเงิน
                </p>

                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                  {/* Tour card */}
                  <div className="flex gap-3 p-4 border-b border-gray-50">
                    <div
                      className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
                      style={{
                        backgroundImage:
                          'url(https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=200&h=200&fit=crop)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-2">
                        เกาะเจมส์บอนด์ + เกาะปันหยี
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        อ่าวพังงา
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        4.8 (324 รีวิว)
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> วันเดินทาง
                      </span>
                      <span className="font-semibold">
                        {selectedDate} {monthNames[calMonth]} {calYear + 543}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> รอบเวลา
                      </span>
                      <span className="font-semibold">{selectedTime} น.</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Users className="w-4 h-4" /> ผู้โดยสาร
                      </span>
                      <span className="font-semibold">
                        {adults} ผู้ใหญ่
                        {children > 0 ? `, ${children} เด็ก` : ''}
                        {infants > 0 ? `, ${infants} ทารก` : ''}
                      </span>
                    </div>
                    {selectedRequests.size > 0 && (
                      <div className="flex items-start justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> คำขอพิเศษ
                        </span>
                        <span className="font-semibold text-right max-w-[180px]">
                          {Array.from(selectedRequests)
                            .map(
                              (r) =>
                                specialRequests.find((sr) => sr.id === r)?.label
                            )
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="p-4 bg-gray-50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        ผู้ใหญ่ × {adults}
                      </span>
                      <span>฿{(adults * pricePerAdult).toLocaleString()}</span>
                    </div>
                    {children > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          เด็ก × {children}
                        </span>
                        <span>
                          ฿{(children * pricePerChild).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {infants > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          ทารก × {infants}
                        </span>
                        <span className="text-emerald-600">ฟรี</span>
                      </div>
                    )}
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">ยอดรวม</span>
                      <span className="text-xl font-bold text-ocean-800">
                        ฿{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Payment Selection */}
            {step === 6 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  เลือกวิธีชำระเงิน
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  เลือกช่องทางที่สะดวก
                </p>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        selectedPayment === method.id
                          ? 'border-ocean-600 bg-ocean-50 shadow-md'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedPayment === method.id
                            ? 'bg-ocean-700'
                            : 'bg-gray-100'
                        }`}
                      >
                        <CreditCard
                          className={`w-6 h-6 ${
                            selectedPayment === method.id
                              ? 'text-white'
                              : 'text-gray-500'
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">
                          {method.label}
                        </p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                      {selectedPayment === method.id && (
                        <CheckCircle2 className="w-5 h-5 text-ocean-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-5 p-4 rounded-2xl bg-ocean-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ยอดชำระ</span>
                    <span className="text-xl font-bold text-ocean-800">
                      ฿{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 safe-bottom">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm"
            >
              ย้อนกลับ
            </button>
          )}
          {step < 6 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-2xl bg-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-700/30 disabled:opacity-40 disabled:shadow-none active:scale-95 transition-transform"
            >
              ถัดไป
            </button>
          ) : (
            <Link
              href="/payment"
              className={`flex-1 py-3 rounded-2xl text-center font-bold text-sm shadow-lg active:scale-95 transition-transform ${
                canProceed()
                  ? 'bg-ocean-700 text-white shadow-ocean-700/30'
                  : 'bg-gray-300 text-gray-500 pointer-events-none'
              }`}
            >
              ชำระเงิน ฿{totalPrice.toLocaleString()}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
