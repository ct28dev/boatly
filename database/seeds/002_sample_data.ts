import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear dependent tables in correct order
  const tablesToClear = [
    'chat_messages', 'favorites', 'notifications', 'tips',
    'boat_locations', 'review_images', 'reviews',
    'payment_transactions', 'payments',
    'booking_checkins', 'booking_requests', 'booking_passengers', 'bookings',
    'product_schedules', 'product_piers', 'product_images', 'products',
    'piers', 'boat_crew', 'boats', 'providers',
    'promotions', 'user_auth', 'users',
  ];
  for (const table of tablesToClear) {
    await knex(table).del();
  }

  // ── Helper: get province ID by English name ─────────────────

  async function provinceId(name: string): Promise<number> {
    const row = await knex('provinces').where('name_en', name).first();
    if (!row) throw new Error(`Province not found: ${name}`);
    return row.id;
  }

  // ── Users ───────────────────────────────────────────────────

  const [adminUser] = await knex('users').insert([
    {
      name: 'Admin Boatly',
      email: 'admin@boatly.th',
      phone: '0891234567',
      language: 'th',
      role: 'admin',
    },
  ]).returning('*');

  const [providerUser1] = await knex('users').insert([
    {
      name: 'สมชาย ทะเลงาม',
      email: 'somchai@phuketboats.th',
      phone: '0812345678',
      language: 'th',
      role: 'provider',
    },
  ]).returning('*');

  const [providerUser2] = await knex('users').insert([
    {
      name: 'วิชัย คลื่นสวย',
      email: 'wichai@krabiisland.th',
      phone: '0823456789',
      language: 'th',
      role: 'provider',
    },
  ]).returning('*');

  const [providerUser3] = await knex('users').insert([
    {
      name: 'ประเสริฐ สมุยทัวร์',
      email: 'prasert@samuitour.th',
      phone: '0834567890',
      language: 'th',
      role: 'provider',
    },
  ]).returning('*');

  const [providerUser4] = await knex('users').insert([
    {
      name: 'ณรงค์ พัทยามารีน',
      email: 'narong@pattayamarine.th',
      phone: '0845678901',
      language: 'th',
      role: 'provider',
    },
  ]).returning('*');

  const [customer1] = await knex('users').insert([
    {
      name: 'สมศรี ใจดี',
      email: 'somsri@gmail.com',
      phone: '0856789012',
      language: 'th',
      role: 'customer',
    },
  ]).returning('*');

  const [customer2] = await knex('users').insert([
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '0867890123',
      language: 'en',
      role: 'customer',
    },
  ]).returning('*');

  // ── Auth entries ────────────────────────────────────────────

  await knex('user_auth').insert([
    { user_id: adminUser.id, provider: 'email', provider_user_id: adminUser.email, password_hash: '$2b$10$placeholder_hash_admin' },
    { user_id: providerUser1.id, provider: 'email', provider_user_id: providerUser1.email, password_hash: '$2b$10$placeholder_hash_prov1' },
    { user_id: providerUser2.id, provider: 'email', provider_user_id: providerUser2.email, password_hash: '$2b$10$placeholder_hash_prov2' },
    { user_id: providerUser3.id, provider: 'email', provider_user_id: providerUser3.email, password_hash: '$2b$10$placeholder_hash_prov3' },
    { user_id: providerUser4.id, provider: 'email', provider_user_id: providerUser4.email, password_hash: '$2b$10$placeholder_hash_prov4' },
    { user_id: customer1.id, provider: 'email', provider_user_id: customer1.email, password_hash: '$2b$10$placeholder_hash_cust1' },
    { user_id: customer2.id, provider: 'line', provider_user_id: 'U1234567890abcdef' },
  ]);

  // ── Providers ───────────────────────────────────────────────

  const [provider1] = await knex('providers').insert([
    {
      user_id: providerUser1.id,
      company_name: 'Phuket Paradise Boats',
      tax_id: '0105560012345',
      bank_account: '123-4-56789-0',
      contact_phone: '0812345678',
      status: 'approved',
    },
  ]).returning('*');

  const [provider2] = await knex('providers').insert([
    {
      user_id: providerUser2.id,
      company_name: 'Krabi Island Hopper',
      tax_id: '0105560023456',
      bank_account: '234-5-67890-1',
      contact_phone: '0823456789',
      status: 'approved',
    },
  ]).returning('*');

  const [provider3] = await knex('providers').insert([
    {
      user_id: providerUser3.id,
      company_name: 'Samui Sea Explorer',
      tax_id: '0105560034567',
      bank_account: '345-6-78901-2',
      contact_phone: '0834567890',
      status: 'approved',
    },
  ]).returning('*');

  const [provider4] = await knex('providers').insert([
    {
      user_id: providerUser4.id,
      company_name: 'Pattaya Marine Adventures',
      tax_id: '0105560045678',
      bank_account: '456-7-89012-3',
      contact_phone: '0845678901',
      status: 'approved',
    },
  ]).returning('*');

  // ── Boats ───────────────────────────────────────────────────

  const [boat1] = await knex('boats').insert([
    { provider_id: provider1.id, name: 'ภูเก็ตพาราไดซ์ 1', boat_type: 'speedboat', capacity: 35, description: 'สปีดโบ๊ทหรูพร้อมอุปกรณ์ครบครัน ที่นั่งกว้างสบาย', status: 'available' },
  ]).returning('*');

  const [boat2] = await knex('boats').insert([
    { provider_id: provider1.id, name: 'ภูเก็ตพาราไดซ์ 2', boat_type: 'catamaran', capacity: 50, description: 'เรือคาตามารันสองท้องขนาดใหญ่ เหมาะสำหรับทัวร์กรุ๊ป', status: 'available' },
  ]).returning('*');

  const [boat3] = await knex('boats').insert([
    { provider_id: provider2.id, name: 'กระบี่ไอแลนด์ฮอปเปอร์', boat_type: 'longtail', capacity: 10, description: 'เรือหางยาวแบบดั้งเดิม สัมผัสวัฒนธรรมไทยแท้', status: 'available' },
  ]).returning('*');

  const [boat4] = await knex('boats').insert([
    { provider_id: provider2.id, name: 'กระบี่สปีด 1', boat_type: 'speedboat', capacity: 25, description: 'สปีดโบ๊ทสำหรับเที่ยวเกาะ 4 เกาะ', status: 'available' },
  ]).returning('*');

  const [boat5] = await knex('boats').insert([
    { provider_id: provider3.id, name: 'สมุยซีเอ็กซ์พลอเรอร์', boat_type: 'yacht', capacity: 20, description: 'เรือยอร์ชหรูสำหรับทริปเกาะเต่า-เกาะนางยวน', status: 'available' },
  ]).returning('*');

  const [boat6] = await knex('boats').insert([
    { provider_id: provider3.id, name: 'อ่างทองเอ็กซ์เพรส', boat_type: 'speedboat', capacity: 40, description: 'สปีดโบ๊ทเร็วสำหรับอุทยานแห่งชาติหมู่เกาะอ่างทอง', status: 'available' },
  ]).returning('*');

  const [boat7] = await knex('boats').insert([
    { provider_id: provider4.id, name: 'พัทยามารีน 1', boat_type: 'speedboat', capacity: 30, description: 'สปีดโบ๊ทไปเกาะล้าน เกาะสาก', status: 'available' },
  ]).returning('*');

  const [boat8] = await knex('boats').insert([
    { provider_id: provider4.id, name: 'พัทยาพาร์ตี้โบ๊ท', boat_type: 'catamaran', capacity: 60, description: 'เรือปาร์ตี้ขนาดใหญ่ มีดีเจและบาร์บนเรือ', status: 'available' },
  ]).returning('*');

  // ── Boat Crew ───────────────────────────────────────────────

  const crewInserts = [
    { boat_id: boat1.id, name: 'กัปตันสมศักดิ์', role: 'captain', phone: '0891111111' },
    { boat_id: boat1.id, name: 'ณัฐพล', role: 'guide', phone: '0891111112' },
    { boat_id: boat2.id, name: 'กัปตันวิชัย', role: 'captain', phone: '0892222221' },
    { boat_id: boat2.id, name: 'สุภาพร', role: 'guide', phone: '0892222222' },
    { boat_id: boat3.id, name: 'ลุงสมบูรณ์', role: 'captain', phone: '0893333331' },
    { boat_id: boat4.id, name: 'กัปตันเอกชัย', role: 'captain', phone: '0894444441' },
    { boat_id: boat5.id, name: 'กัปตันธนกฤต', role: 'captain', phone: '0895555551' },
    { boat_id: boat5.id, name: 'อรอุมา', role: 'guide', phone: '0895555552' },
    { boat_id: boat6.id, name: 'กัปตันพิชัย', role: 'captain', phone: '0896666661' },
    { boat_id: boat7.id, name: 'กัปตันณรงค์', role: 'captain', phone: '0897777771' },
    { boat_id: boat8.id, name: 'กัปตันอนุชา', role: 'captain', phone: '0898888881' },
    { boat_id: boat8.id, name: 'DJ Max', role: 'entertainment', phone: '0898888882' },
  ];
  await knex('boat_crew').insert(crewInserts);

  // ── Piers ───────────────────────────────────────────────────

  const phuketId = await provinceId('Phuket');
  const krabiId = await provinceId('Krabi');
  const suratId = await provinceId('Surat Thani');
  const chonburiId = await provinceId('Chon Buri');
  const phangNgaId = await provinceId('Phang Nga');
  const trangId = await provinceId('Trang');
  const rayongId = await provinceId('Rayong');

  const [pierRassada] = await knex('piers').insert([
    { province_id: phuketId, name_th: 'ท่าเรือรัษฎา', name_en: 'Rassada Pier', latitude: 7.86340000, longitude: 98.38580000, address: 'ถนนรัษฎานุสรณ์ ตำบลรัษฎา อำเภอเมือง จังหวัดภูเก็ต' },
  ]).returning('*');

  const [pierChalong] = await knex('piers').insert([
    { province_id: phuketId, name_th: 'ท่าเรือฉลอง', name_en: 'Chalong Pier', latitude: 7.82640000, longitude: 98.35770000, address: 'ถนนเจ้าฟ้า ตำบลฉลอง อำเภอเมือง จังหวัดภูเก็ต' },
  ]).returning('*');

  const [pierRoyalMarina] = await knex('piers').insert([
    { province_id: phuketId, name_th: 'รอยัลภูเก็ตมารีน่า', name_en: 'Royal Phuket Marina', latitude: 7.89070000, longitude: 98.38950000, address: 'ถนนเทพกระษัตรี ตำบลเกาะแก้ว อำเภอเมือง จังหวัดภูเก็ต' },
  ]).returning('*');

  const [pierAoNang] = await knex('piers').insert([
    { province_id: krabiId, name_th: 'ท่าเรืออ่าวนาง', name_en: 'Ao Nang Pier', latitude: 8.03650000, longitude: 98.82490000, address: 'ตำบลอ่าวนาง อำเภอเมือง จังหวัดกระบี่' },
  ]).returning('*');

  const [pierKlongJilad] = await knex('piers').insert([
    { province_id: krabiId, name_th: 'ท่าเรือคลองจิหลาด', name_en: 'Klong Jilad Pier', latitude: 8.06320000, longitude: 98.91420000, address: 'ตำบลปากน้ำ อำเภอเมือง จังหวัดกระบี่' },
  ]).returning('*');

  const [pierNathon] = await knex('piers').insert([
    { province_id: suratId, name_th: 'ท่าเรือหน้าทอน', name_en: 'Nathon Pier', latitude: 9.53710000, longitude: 99.95930000, address: 'ตำบลหน้าทอน อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี' },
  ]).returning('*');

  const [pierBangrak] = await knex('piers').insert([
    { province_id: suratId, name_th: 'ท่าเรือบางรักษ์', name_en: 'Bangrak Pier', latitude: 9.56200000, longitude: 100.06200000, address: 'ตำบลบ่อผุด อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี' },
  ]).returning('*');

  const [pierMaenam] = await knex('piers').insert([
    { province_id: suratId, name_th: 'ท่าเรือแม่น้ำ', name_en: 'Maenam Pier', latitude: 9.57500000, longitude: 100.04500000, address: 'ตำบลแม่น้ำ อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี' },
  ]).returning('*');

  const [pierBaliHai] = await knex('piers').insert([
    { province_id: chonburiId, name_th: 'ท่าเรือบาลีฮาย', name_en: 'Bali Hai Pier', latitude: 12.92690000, longitude: 100.87100000, address: 'ถนนพัทยาใต้ เมืองพัทยา จังหวัดชลบุรี' },
  ]).returning('*');

  const [pierLaem] = await knex('piers').insert([
    { province_id: chonburiId, name_th: 'ท่าเรือแหลมบาลีฮาย', name_en: 'Laem Bali Hai Pier', latitude: 12.92500000, longitude: 100.87300000, address: 'ถนนพัทยาใต้ เมืองพัทยา จังหวัดชลบุรี' },
  ]).returning('*');

  const [pierTabLamu] = await knex('piers').insert([
    { province_id: phangNgaId, name_th: 'ท่าเรือทับละมุ', name_en: 'Tab Lamu Pier', latitude: 8.57500000, longitude: 98.22500000, address: 'ตำบลลำแก่น อำเภอท้ายเหมือง จังหวัดพังงา' },
  ]).returning('*');

  const [pierHatYao] = await knex('piers').insert([
    { province_id: trangId, name_th: 'ท่าเรือหาดยาว', name_en: 'Hat Yao Pier', latitude: 7.38200000, longitude: 99.28600000, address: 'ตำบลเกาะลิบง อำเภอกันตัง จังหวัดตรัง' },
  ]).returning('*');

  const [pierBanPhe] = await knex('piers').insert([
    { province_id: rayongId, name_th: 'ท่าเรือบ้านเพ', name_en: 'Ban Phe Pier', latitude: 12.62000000, longitude: 101.43000000, address: 'ตำบลเพ อำเภอเมือง จังหวัดระยอง' },
  ]).returning('*');

  // ── Products / Tours ────────────────────────────────────────

  const [tour1] = await knex('products').insert([
    {
      provider_id: provider1.id,
      name_th: 'ทัวร์เกาะพีพี เต็มวัน',
      name_en: 'Phi Phi Islands Full Day Tour',
      description_th: 'ล่องเรือสปีดโบ๊ทชมเกาะพีพีดอน พีพีเล อ่าวมาหยา ถ้ำไวกิ้ง ดำน้ำตื้นชมปะการัง พร้อมอาหารกลางวันบุฟเฟ่ต์บนเกาะ',
      description_en: 'Speedboat tour visiting Phi Phi Don, Phi Phi Leh, Maya Bay, Viking Cave. Snorkeling and buffet lunch on the island included.',
      duration: 480,
      price: 2500.00,
      max_passengers: 35,
      departure_pier_id: pierRassada.id,
      return_pier_id: pierRassada.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour2] = await knex('products').insert([
    {
      provider_id: provider1.id,
      name_th: 'ทัวร์อ่าวพังงา เรือคาตามารัน',
      name_en: 'Phang Nga Bay Catamaran Cruise',
      description_th: 'ล่องเรือคาตามารันชมอ่าวพังงา เกาะปันหยี เขาตะปู พายเรือแคนู ชมถ้ำ พร้อมอาหารซีฟู้ดบนเรือ',
      description_en: 'Catamaran cruise through Phang Nga Bay, Koh Panyee, James Bond Island. Canoeing, cave exploration, and seafood meal onboard.',
      duration: 540,
      price: 3800.00,
      max_passengers: 50,
      departure_pier_id: pierRoyalMarina.id,
      return_pier_id: pierRoyalMarina.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour3] = await knex('products').insert([
    {
      provider_id: provider1.id,
      name_th: 'ทริปดำน้ำตื้น เกาะราชา ครึ่งวัน',
      name_en: 'Racha Island Snorkeling Half Day',
      description_th: 'ดำน้ำตื้นที่เกาะราชาใหญ่ น้ำใสมองเห็นปลาและปะการังสวยงาม รวมอุปกรณ์ดำน้ำและอาหารว่าง',
      description_en: 'Snorkeling at Racha Yai Island with crystal clear water. Equipment and snacks included.',
      duration: 300,
      price: 1800.00,
      max_passengers: 35,
      departure_pier_id: pierChalong.id,
      return_pier_id: pierChalong.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour4] = await knex('products').insert([
    {
      provider_id: provider2.id,
      name_th: 'ทัวร์ 4 เกาะ กระบี่ เรือหางยาว',
      name_en: 'Krabi 4 Islands Longtail Tour',
      description_th: 'เที่ยว 4 เกาะด้วยเรือหางยาวแบบดั้งเดิม เกาะปอดะ ทะเลแหวก เกาะไก่ เกาะทับ ดำน้ำตื้นชมปลาสวยงาม',
      description_en: 'Traditional longtail boat tour to 4 islands: Poda Island, Tup Island, Chicken Island, and the Separated Sea.',
      duration: 420,
      price: 1200.00,
      max_passengers: 10,
      departure_pier_id: pierAoNang.id,
      return_pier_id: pierAoNang.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour5] = await knex('products').insert([
    {
      provider_id: provider2.id,
      name_th: 'ทัวร์เกาะฮ่องกระบี่ สปีดโบ๊ท',
      name_en: 'Hong Islands Speedboat Tour',
      description_th: 'สปีดโบ๊ทไปเกาะฮ่อง ทะเลในสีมรกต พายเรือคายัค ดำน้ำตื้น พร้อมอาหารกลางวัน',
      description_en: 'Speedboat trip to Hong Islands, emerald lagoon, kayaking, snorkeling with lunch provided.',
      duration: 390,
      price: 2200.00,
      max_passengers: 25,
      departure_pier_id: pierKlongJilad.id,
      return_pier_id: pierKlongJilad.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour6] = await knex('products').insert([
    {
      provider_id: provider3.id,
      name_th: 'ทริปเกาะเต่า-เกาะนางยวน เรือยอร์ช',
      name_en: 'Koh Tao & Nang Yuan Yacht Trip',
      description_th: 'เรือยอร์ชหรูไปเกาะเต่า-เกาะนางยวน ดำน้ำตื้นจุดดำน้ำชื่อดัง เดินเที่ยวเกาะนางยวน อาหารบนเรือ',
      description_en: 'Luxury yacht to Koh Tao and Nang Yuan, famous snorkeling spots, island walk, meals on yacht.',
      duration: 600,
      price: 4500.00,
      max_passengers: 20,
      departure_pier_id: pierBangrak.id,
      return_pier_id: pierBangrak.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour7] = await knex('products').insert([
    {
      provider_id: provider3.id,
      name_th: 'ทัวร์อุทยานแห่งชาติหมู่เกาะอ่างทอง',
      name_en: 'Ang Thong Marine Park Day Tour',
      description_th: 'เที่ยวอุทยานแห่งชาติหมู่เกาะอ่างทอง 42 เกาะ ชมทะเลสาบมรกต ปีนจุดชมวิว พายเรือคายัค ดำน้ำ',
      description_en: 'Explore Ang Thong National Marine Park with 42 islands, emerald lake, viewpoint hike, kayaking, and snorkeling.',
      duration: 540,
      price: 2800.00,
      max_passengers: 40,
      departure_pier_id: pierNathon.id,
      return_pier_id: pierNathon.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour8] = await knex('products').insert([
    {
      provider_id: provider4.id,
      name_th: 'ทัวร์เกาะล้าน เต็มวัน',
      name_en: 'Koh Larn Full Day Island Trip',
      description_th: 'ไปเกาะล้านด้วยสปีดโบ๊ท เล่นน้ำหาดทราย กิจกรรมทางน้ำ อาหารซีฟู้ดริมชายหาด',
      description_en: 'Speedboat to Koh Larn, beach activities, water sports, beachside seafood lunch.',
      duration: 480,
      price: 1500.00,
      max_passengers: 30,
      departure_pier_id: pierBaliHai.id,
      return_pier_id: pierBaliHai.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour9] = await knex('products').insert([
    {
      provider_id: provider4.id,
      name_th: 'ปาร์ตี้โบ๊ท พัทยา ซันเซ็ท',
      name_en: 'Pattaya Sunset Party Boat',
      description_th: 'ปาร์ตี้บนเรือคาตามารันยามพระอาทิตย์ตก มี DJ เพลงสด บุฟเฟ่ต์อาหารและเครื่องดื่ม ชมวิวพัทยา',
      description_en: 'Sunset catamaran party with live DJ, buffet dinner and drinks, stunning Pattaya coastline views.',
      duration: 240,
      price: 3500.00,
      max_passengers: 60,
      departure_pier_id: pierLaem.id,
      return_pier_id: pierLaem.id,
      status: 'active',
    },
  ]).returning('*');

  const [tour10] = await knex('products').insert([
    {
      provider_id: provider2.id,
      name_th: 'ทัวร์เกาะลันตา ดำน้ำตื้น',
      name_en: 'Koh Lanta Snorkeling Adventure',
      description_th: 'สปีดโบ๊ทไปเกาะลันตา ดำน้ำตื้นชมปะการังและปลาหลากสี เที่ยวถ้ำมรกต อาหารกลางวัน',
      description_en: 'Speedboat to Koh Lanta for snorkeling with colorful coral and fish, Emerald Cave visit, lunch included.',
      duration: 510,
      price: 2600.00,
      max_passengers: 25,
      departure_pier_id: pierKlongJilad.id,
      return_pier_id: pierKlongJilad.id,
      status: 'active',
    },
  ]).returning('*');

  // ── Product Images ──────────────────────────────────────────

  const productImageData = [
    { product_id: tour1.id, image_url: '/images/tours/phi-phi-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour1.id, image_url: '/images/tours/phi-phi-maya.jpg', sort_order: 1, is_primary: false },
    { product_id: tour1.id, image_url: '/images/tours/phi-phi-snorkel.jpg', sort_order: 2, is_primary: false },
    { product_id: tour2.id, image_url: '/images/tours/phangnga-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour2.id, image_url: '/images/tours/phangnga-james-bond.jpg', sort_order: 1, is_primary: false },
    { product_id: tour3.id, image_url: '/images/tours/racha-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour4.id, image_url: '/images/tours/krabi-4islands-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour4.id, image_url: '/images/tours/krabi-separated-sea.jpg', sort_order: 1, is_primary: false },
    { product_id: tour5.id, image_url: '/images/tours/hong-island-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour6.id, image_url: '/images/tours/koh-tao-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour6.id, image_url: '/images/tours/nang-yuan.jpg', sort_order: 1, is_primary: false },
    { product_id: tour7.id, image_url: '/images/tours/angthong-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour7.id, image_url: '/images/tours/angthong-lake.jpg', sort_order: 1, is_primary: false },
    { product_id: tour8.id, image_url: '/images/tours/koh-larn-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour9.id, image_url: '/images/tours/pattaya-party-main.jpg', sort_order: 0, is_primary: true },
    { product_id: tour10.id, image_url: '/images/tours/koh-lanta-main.jpg', sort_order: 0, is_primary: true },
  ];
  await knex('product_images').insert(productImageData);

  // ── Product Schedules ───────────────────────────────────────

  const allTours = [tour1, tour2, tour3, tour4, tour5, tour6, tour7, tour8, tour9, tour10];
  const scheduleInserts: Array<{ product_id: string; day_of_week: number; time_slot: string; is_active: boolean }> = [];

  for (const tour of allTours) {
    // Most tours run daily (0=Sun through 6=Sat)
    for (let day = 0; day <= 6; day++) {
      scheduleInserts.push({
        product_id: tour.id,
        day_of_week: day,
        time_slot: '08:00',
        is_active: true,
      });
    }
  }

  // Party boat only runs Fri/Sat/Sun evenings
  const partySchedules = scheduleInserts.filter(
    (s) => s.product_id === tour9.id
  );
  for (const s of partySchedules) {
    s.time_slot = '17:00';
    s.is_active = [0, 5, 6].includes(s.day_of_week);
  }

  await knex('product_schedules').insert(scheduleInserts);

  // ── Product Piers (intermediate stops) ──────────────────────

  await knex('product_piers').insert([
    { product_id: tour1.id, pier_id: pierRassada.id, stop_order: 1 },
    { product_id: tour1.id, pier_id: pierChalong.id, stop_order: 2 },
    { product_id: tour2.id, pier_id: pierRoyalMarina.id, stop_order: 1 },
    { product_id: tour4.id, pier_id: pierAoNang.id, stop_order: 1 },
    { product_id: tour6.id, pier_id: pierBangrak.id, stop_order: 1 },
    { product_id: tour6.id, pier_id: pierMaenam.id, stop_order: 2 },
    { product_id: tour7.id, pier_id: pierNathon.id, stop_order: 1 },
    { product_id: tour8.id, pier_id: pierBaliHai.id, stop_order: 1 },
  ]);

  // ── Promotions ──────────────────────────────────────────────

  await knex('promotions').insert([
    {
      title_th: 'ลดราคา 20% ทริปภูเก็ต ต้อนรับซัมเมอร์',
      title_en: '20% Off Phuket Trips - Summer Special',
      description: 'ลดราคา 20% สำหรับทุกทัวร์ในจังหวัดภูเก็ต เมื่อจองภายในเดือนเมษายน',
      discount_type: 'percentage',
      discount_value: 20.00,
      code: 'PHUKET20',
      start_date: '2026-04-01',
      end_date: '2026-04-30',
      is_active: true,
    },
    {
      title_th: 'ลด 500 บาท จองครั้งแรก',
      title_en: '500 THB Off First Booking',
      description: 'ส่วนลด 500 บาทสำหรับการจองครั้งแรกของลูกค้าใหม่',
      discount_type: 'fixed',
      discount_value: 500.00,
      code: 'WELCOME500',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: true,
    },
    {
      title_th: 'สงกรานต์สุดพิเศษ ลด 15%',
      title_en: 'Songkran Special 15% Off',
      description: 'ฉลองสงกรานต์กับส่วนลด 15% ทุกทริปทั่วประเทศ',
      discount_type: 'percentage',
      discount_value: 15.00,
      code: 'SONGKRAN15',
      start_date: '2026-04-10',
      end_date: '2026-04-16',
      is_active: true,
    },
  ]);

  // ── Sample Bookings ─────────────────────────────────────────

  const [booking1] = await knex('bookings').insert([
    {
      user_id: customer1.id,
      product_id: tour1.id,
      booking_date: '2026-04-15',
      time_slot: '08:00',
      total_amount: 7000.00,
      status: 'confirmed',
      special_requests: 'มีเด็กเล็ก 1 คน ขอที่นั่งข้างหน้า',
    },
  ]).returning('*');

  const [booking2] = await knex('bookings').insert([
    {
      user_id: customer2.id,
      product_id: tour6.id,
      booking_date: '2026-04-20',
      time_slot: '08:00',
      total_amount: 9000.00,
      status: 'pending',
    },
  ]).returning('*');

  const [booking3] = await knex('bookings').insert([
    {
      user_id: customer1.id,
      product_id: tour8.id,
      booking_date: '2026-03-25',
      time_slot: '08:00',
      total_amount: 4500.00,
      status: 'completed',
    },
  ]).returning('*');

  // ── Booking Passengers ──────────────────────────────────────

  await knex('booking_passengers').insert([
    { booking_id: booking1.id, passenger_type: 'adult', count: 2, unit_price: 2500.00 },
    { booking_id: booking1.id, passenger_type: 'child', count: 1, unit_price: 1500.00 },
    { booking_id: booking1.id, passenger_type: 'infant', count: 1, unit_price: 0.00 },
    { booking_id: booking2.id, passenger_type: 'adult', count: 2, unit_price: 4500.00 },
    { booking_id: booking3.id, passenger_type: 'adult', count: 2, unit_price: 1500.00 },
    { booking_id: booking3.id, passenger_type: 'child', count: 1, unit_price: 1500.00 },
  ]);

  // ── Payments ────────────────────────────────────────────────

  const [payment1] = await knex('payments').insert([
    { booking_id: booking1.id, payment_method: 'qr', amount: 7000.00, status: 'completed', transaction_ref: 'TXN-20260410-001' },
  ]).returning('*');

  await knex('payments').insert([
    { booking_id: booking2.id, payment_method: 'card', amount: 9000.00, status: 'pending' },
  ]);

  const [payment3] = await knex('payments').insert([
    { booking_id: booking3.id, payment_method: 'qr', amount: 4500.00, status: 'completed', transaction_ref: 'TXN-20260320-002' },
  ]).returning('*');

  await knex('payment_transactions').insert([
    { payment_id: payment1.id, amount: 7000.00, gateway_ref: 'SCB-QR-20260410-ABC123', paid_at: '2026-04-10 14:30:00' },
    { payment_id: payment3.id, amount: 4500.00, gateway_ref: 'SCB-QR-20260320-DEF456', paid_at: '2026-03-20 09:15:00' },
  ]);

  // ── Reviews ─────────────────────────────────────────────────

  await knex('reviews').insert([
    {
      booking_id: booking3.id,
      user_id: customer1.id,
      product_id: tour8.id,
      rating: 5,
      comment: 'ทริปเกาะล้านสนุกมากค่ะ ลูกเรือน่ารักดูแลดี น้ำทะเลใสสวย แนะนำเลย!',
      status: 'approved',
    },
  ]);

  // ── Notifications ───────────────────────────────────────────

  await knex('notifications').insert([
    {
      user_id: customer1.id,
      title: 'การจองได้รับการยืนยัน',
      body: 'การจองทัวร์เกาะพีพี วันที่ 15 เม.ย. 2569 ได้รับการยืนยันแล้ว',
      type: 'booking_confirmed',
      data: JSON.stringify({ booking_id: booking1.id }),
      is_read: true,
    },
    {
      user_id: customer2.id,
      title: 'รอการชำระเงิน',
      body: 'กรุณาชำระเงินสำหรับทริปเกาะเต่า-เกาะนางยวน ภายใน 24 ชั่วโมง',
      type: 'payment_pending',
      data: JSON.stringify({ booking_id: booking2.id }),
      is_read: false,
    },
    {
      user_id: customer1.id,
      title: 'โปรโมชั่นสงกรานต์!',
      body: 'ลด 15% ทุกทริป ใช้โค้ด SONGKRAN15 จองเลย!',
      type: 'promotion',
      data: JSON.stringify({ code: 'SONGKRAN15' }),
      is_read: false,
    },
  ]);

  // ── Favorites ───────────────────────────────────────────────

  await knex('favorites').insert([
    { user_id: customer1.id, product_id: tour6.id },
    { user_id: customer1.id, product_id: tour2.id },
    { user_id: customer2.id, product_id: tour1.id },
    { user_id: customer2.id, product_id: tour9.id },
  ]);
}
