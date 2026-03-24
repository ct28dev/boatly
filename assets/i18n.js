// ===== BOATLY - Internationalization (i18n) System =====
// Supports: TH (Thai), EN (English), ZH (Chinese), KO (Korean), FR (French)

const LANGS = {
  th: { flag: '🇹🇭', name: 'ไทย', dir: 'ltr' },
  en: { flag: '🇬🇧', name: 'English', dir: 'ltr' },
  zh: { flag: '🇨🇳', name: '中文', dir: 'ltr' },
  ko: { flag: '🇰🇷', name: '한국어', dir: 'ltr' },
  fr: { flag: '🇫🇷', name: 'Français', dir: 'ltr' },
};

const T = {
  // ===== Navigation =====
  nav_home:       { th:'หน้าแรก', en:'Home', zh:'首页', ko:'홈', fr:'Accueil' },
  nav_search:     { th:'ค้นหา', en:'Search', zh:'搜索', ko:'검색', fr:'Recherche' },
  nav_map:        { th:'แผนที่', en:'Map', zh:'地图', ko:'지도', fr:'Carte' },
  nav_bookings:   { th:'เรือที่จอง', en:'Bookings', zh:'预订', ko:'예약', fr:'Réservations' },
  nav_book:       { th:'จอง', en:'Book', zh:'预订', ko:'예약하기', fr:'Réserver' },
  nav_profile:    { th:'โปรไฟล์', en:'Profile', zh:'个人', ko:'프로필', fr:'Profil' },

  // ===== Hero =====
  hero_greeting:  { th:'สวัสดี', en:'Hello', zh:'你好', ko:'안녕하세요', fr:'Bonjour' },
  hero_search_placeholder: { th:'ค้นหาทริป, จังหวัด, บริการ...', en:'Search trips, provinces, services...', zh:'搜索行程、省份、服务...', ko:'여행, 지역, 서비스 검색...', fr:'Rechercher voyages, provinces...' },
  partner_search_placeholder: { th:'ค้นหาชื่อลูกค้า หรือหมายเลขการจอง', en:'Search by customer name or booking ID', zh:'按客户姓名或预订编号搜索', ko:'고객명 또는 예약번호 검색', fr:'Rechercher par nom ou n° réservation' },

  // ===== Categories =====
  cat_popular:    { th:'ทริปยอดนิยม', en:'Popular', zh:'热门行程', ko:'인기', fr:'Populaire' },
  cat_private:    { th:'เรือส่วนตัว', en:'Private Boat', zh:'私人船', ko:'프라이빗', fr:'Bateau privé' },
  cat_diving:     { th:'ดำน้ำ', en:'Diving', zh:'潜水', ko:'다이빙', fr:'Plongée' },
  cat_fishing:    { th:'ตกปลา', en:'Fishing', zh:'钓鱼', ko:'낚시', fr:'Pêche' },

  // ===== Sections =====
  section_recommended: { th:'แนะนำสำหรับคุณ', en:'Recommended', zh:'为您推荐', ko:'추천', fr:'Recommandé' },
  section_nearby:  { th:'ทริปยอดนิยม', en:'Popular Trips', zh:'热门行程', ko:'인기 여행', fr:'Voyages populaires' },
  section_map:     { th:'สำรวจบนแผนที่', en:'Explore on Map', zh:'在地图上探索', ko:'지도에서 탐색', fr:'Explorer la carte' },
  section_itinerary: { th:'วางแผนทริป', en:'Itinerary Plan', zh:'行程规划', ko:'일정 계획', fr:'Plan d\'itinéraire' },
  itinerary_preview_title: { th:'วางแผนทริปส่วนตัวหรือแชร์ให้เพื่อน', en:'Plan your trip privately or share with friends', zh:'私人规划或分享给朋友', ko:'개인 일정 또는 친구와 공유', fr:'Planifiez en privé ou partagez' },
  itinerary_preview_subtitle: { th:'กดเพื่อจัดการแผนการเดินทาง', en:'Tap to manage your itinerary', zh:'点击管理行程', ko:'탭하여 일정 관리', fr:'Appuyez pour gérer' },
  itinerary_add:   { th:'เพิ่มแผน', en:'Add Plan', zh:'添加计划', ko:'계획 추가', fr:'Ajouter un plan' },
  itinerary_choose_mode: { th:'เลือกวิธีวางแผน', en:'Choose how to plan', zh:'选择规划方式', ko:'계획 방식 선택', fr:'Choisir le mode de plan' },
  itinerary_mode_manual: { th:'วางแผนเอง', en:'Plan manually', zh:'自行规划', ko:'직접 계획', fr:'Planifier manuellement' },
  itinerary_mode_manual_hint: { th:'สร้างและแก้ไขแผนส่วนตัว', en:'Create and edit your own plan', zh:'创建并编辑私人计划', ko:'개인 계획 작성·수정', fr:'Créer et modifier votre plan' },
  itinerary_mode_ai: { th:'✨ AI แนะนำทริป', en:'✨ AI trip suggestion', zh:'✨ AI 行程推荐', ko:'✨ AI 추천 여행', fr:'✨ Suggestion IA' },
  itinerary_mode_ai_hint: { th:'สถานที่ คน งบ → ไทม์ไลน์', en:'Place, people, budget → timeline', zh:'地点、人数、预算→时间线', ko:'장소·인원·예산→타임라인', fr:'Lieu, budget → ligne du temps' },
  itinerary_saved_plans: { th:'แผนที่บันทึกไว้', en:'Your saved plans', zh:'已保存的计划', ko:'저장된 계획', fr:'Plans enregistrés' },
  itinerary_empty_saved: { th:'ยังไม่มีแผนที่บันทึก — สร้างได้จากการ์ดด้านบนหรือปุ่มเพิ่มแผน', en:'No saved plans yet — use the cards above or Add plan', zh:'暂无已保存计划 — 使用上方卡片或添加计划', ko:'저장된 계획 없음 — 위 카드 또는 계획 추가', fr:'Aucun plan — utilisez les cartes ou Ajouter' },
  itinerary_title: { th:'ชื่อแผน', en:'Plan Title', zh:'计划名称', ko:'계획 제목', fr:'Titre du plan' },
  itinerary_desc:  { th:'รายละเอียด', en:'Description', zh:'描述', ko:'설명', fr:'Description' },
  itinerary_time_slots: { th:'สล็อตเวลา', en:'Time slots', zh:'时间段', ko:'시간 슬롯', fr:'Créneaux horaires' },
  itinerary_locations:  { th:'สถานที่ท่องเที่ยว', en:'Attraction locations', zh:'景点位置', ko:'관광지', fr:'Lieux d\'intérêt' },
  itinerary_activity_content: { th:'เนื้อหาแผนกิจกรรม', en:'Activity plan content', zh:'活动计划内容', ko:'활동 계획 내용', fr:'Contenu du plan' },
  itinerary_slot:       { th:'สล็อตกิจกรรม', en:'Activity slot', zh:'活动时段', ko:'활동 슬롯', fr:'Créneau d\'activité' },
  itinerary_slot_order: { th:'รายการกิจกรรมตามลำดับ', en:'Activities in sequence', zh:'按顺序的活动', ko:'순서별 활동', fr:'Activités en séquence' },
  itinerary_search_place: { th:'พิมพ์ค้นหาสถานที่', en:'Search location', zh:'搜索地点', ko:'장소 검색', fr:'Rechercher un lieu' },
  itinerary_public:{ th:'แชร์ให้เพื่อนได้ (สร้างลิงก์แชร์)', en:'Share with friends (create share link)', zh:'分享给朋友（创建分享链接）', ko:'친구와 공유 (공유 링크 생성)', fr:'Partager avec amis' },
  itinerary_share: { th:'แชร์', en:'Share', zh:'分享', ko:'공유', fr:'Partager' },
  itinerary_edit:  { th:'แก้ไข', en:'Edit', zh:'编辑', ko:'수정', fr:'Modifier' },
  itinerary_delete:{ th:'ลบ', en:'Delete', zh:'删除', ko:'삭제', fr:'Supprimer' },
  itinerary_share_copied: { th:'คัดลอกลิงก์แล้ว', en:'Link copied!', zh:'链接已复制', ko:'링크 복사됨', fr:'Lien copié !' },
  itinerary_add_tour:    { th:'เพิ่มทัวร์', en:'Add Tour', zh:'添加行程', ko:'투어 추가', fr:'Ajouter une excursion' },
  itinerary_add_activity:{ th:'เพิ่มกิจกรรม', en:'Add Activity', zh:'添加活动', ko:'활동 추가', fr:'Ajouter une activité' },
  itinerary_activity_title:{ th:'ชื่อกิจกรรม', en:'Activity name', zh:'活动名称', ko:'활동 이름', fr:'Nom de l\'activité' },
  itinerary_activity_time:{ th:'เวลา', en:'Time', zh:'时间', ko:'시간', fr:'Heure' },
  itinerary_activity_place:{ th:'สถานที่/ตำแหน่ง', en:'Place / Location', zh:'地点', ko:'장소', fr:'Lieu' },
  itinerary_pick_on_map: { th:'เลือกตำแหน่งบนแผนที่', en:'Pick on map', zh:'在地图上选择', ko:'지도에서 선택', fr:'Choisir sur la carte' },
  itinerary_from_tour:   { th:'จากทัวร์ในระบบ', en:'From platform tours', zh:'从平台行程', ko:'플랫폼 투어에서', fr:'Depuis les excursions' },
  itinerary_free_form:   { th:'ใส่ข้อมูลอิสระ', en:'Free form', zh:'自由填写', ko:'자유 입력', fr:'Saisie libre' },
  itinerary_items:       { th:'รายการในแผน', en:'Items in plan', zh:'计划项目', ko:'계획 항목', fr:'Éléments du plan' },
  itinerary_no_items:    { th:'ยังไม่มีรายการในแผน', en:'No items yet', zh:'暂无项目', ko:'아직 항목 없음', fr:'Aucun élément' },
  itinerary_remove_item: { th:'ลบออก', en:'Remove', zh:'移除', ko:'제거', fr:'Retirer' },
  itinerary_copy:       { th:'คัดลอกแผน', en:'Copy plan', zh:'复制计划', ko:'계획 복사', fr:'Copier le plan' },
  itinerary_copy_suffix:{ th:' (สำเนา)', en:' (Copy)', zh:' (副本)', ko:' (복사본)', fr:' (Copie)' },
  itinerary_copied:     { th:'คัดลอกแผนแล้ว', en:'Plan copied', zh:'计划已复制', ko:'계획 복사됨', fr:'Plan copié' },
  itinerary_share_via:   { th:'แชร์ผ่าน', en:'Share via', zh:'分享到', ko:'공유하기', fr:'Partager via' },
  itinerary_copy_link:   { th:'คัดลอกลิงก์', en:'Copy link', zh:'复制链接', ko:'링크 복사', fr:'Copier le lien' },
  itinerary_search_tour: { th:'ค้นหาทริปเพื่อเพิ่มลงในแผน', en:'Search tours to add to plan', zh:'搜索行程添加到计划', ko:'계획에 추가할 투어 검색', fr:'Rechercher des excursions' },
  section_promo:   { th:'โปรโมชั่น', en:'Promotions', zh:'促销', ko:'프로모션', fr:'Promotions' },
  view_all:        { th:'ดูทั้งหมด', en:'View All', zh:'查看全部', ko:'전체보기', fr:'Voir tout' },

  // ===== Tour Detail =====
  detail_duration: { th:'ชั่วโมง', en:'hours', zh:'小时', ko:'시간', fr:'heures' },
  detail_capacity: { th:'คน', en:'persons', zh:'人', ko:'명', fr:'pers.' },
  detail_route:    { th:'เส้นทาง', en:'Route', zh:'路线', ko:'경로', fr:'Itinéraire' },
  detail_reviews:  { th:'รีวิวจากลูกค้า', en:'Customer Reviews', zh:'客户评价', ko:'고객 리뷰', fr:'Avis clients' },
  detail_from_reviews: { th:'จาก', en:'from', zh:'来自', ko:'중', fr:'de' },
  detail_reviews_unit: { th:'รีวิว', en:'reviews', zh:'条评价', ko:'리뷰', fr:'avis' },
  detail_no_reviews: { th:'ยังไม่มีรีวิว', en:'No reviews yet', zh:'暂无评价', ko:'리뷰 없음', fr:'Pas encore d\'avis' },
  detail_book_now: { th:'จองเลย', en:'Book Now', zh:'立即预订', ko:'지금 예약', fr:'Réserver' },
  detail_starting: { th:'ราคาเริ่มต้น', en:'Starting from', zh:'起价', ko:'시작가', fr:'À partir de' },
  detail_addons:   { th:'บริการเสริม', en:'Add-ons', zh:'附加服务', ko:'추가 옵션', fr:'Options' },
  detail_highlights: { th:'ไฮไลท์', en:'Highlights', zh:'亮点', ko:'하이라이트', fr:'Points forts' },

  // ===== Booking =====
  book_title:      { th:'จองทริป', en:'Book Trip', zh:'预订行程', ko:'여행 예약', fr:'Réserver' },
  book_select_date:{ th:'เลือกวันที่', en:'Select Date', zh:'选择日期', ko:'날짜 선택', fr:'Choisir la date' },
  book_select_date_sub: { th:'เลือกวันที่ต้องการออกเดินทาง', en:'Choose your travel date', zh:'选择您的出行日期', ko:'출발 날짜를 선택하세요', fr:'Choisissez votre date' },
  book_select_time:{ th:'เลือกเวลา', en:'Select Time', zh:'选择时间', ko:'시간 선택', fr:'Choisir l\'heure' },
  book_select_time_sub: { th:'เลือกรอบเวลาที่ต้องการ', en:'Choose your preferred time', zh:'选择您的首选时间', ko:'원하는 시간을 선택하세요', fr:'Choisissez votre horaire' },
  book_passengers: { th:'จำนวนผู้โดยสาร', en:'Passengers', zh:'乘客人数', ko:'승객 수', fr:'Passagers' },
  book_passengers_sub: { th:'ระบุจำนวนผู้โดยสาร', en:'Specify number of passengers', zh:'指定乘客人数', ko:'승객 수를 지정하세요', fr:'Indiquez le nombre' },
  book_addons:     { th:'บริการเสริม', en:'Add-ons', zh:'附加服务', ko:'추가 옵션', fr:'Options' },
  book_addons_sub: { th:'เลือกบริการเสริมที่ต้องการ', en:'Choose optional add-ons', zh:'选择附加服务', ko:'추가 옵션을 선택하세요', fr:'Choisissez des options' },
  book_summary:    { th:'สรุปการจอง', en:'Summary', zh:'预订摘要', ko:'요약', fr:'Résumé' },
  book_summary_sub:{ th:'ตรวจสอบรายละเอียดก่อนชำระเงิน', en:'Review before payment', zh:'付款前确认', ko:'결제 전 확인', fr:'Vérifier avant paiement' },
  book_payment:    { th:'ชำระเงิน', en:'Payment', zh:'支付', ko:'결제', fr:'Paiement' },
  book_payment_sub:{ th:'เลือกวิธีการชำระเงิน', en:'Choose payment method', zh:'选择支付方式', ko:'결제 방법을 선택하세요', fr:'Choisir le mode de paiement' },
  book_next:       { th:'ถัดไป', en:'Next', zh:'下一步', ko:'다음', fr:'Suivant' },
  book_back:       { th:'ย้อนกลับ', en:'Back', zh:'返回', ko:'뒤로', fr:'Retour' },
  book_confirm:    { th:'ยืนยันการจอง', en:'Confirm Booking', zh:'确认预订', ko:'예약 확인', fr:'Confirmer' },
  book_pay_btn:    { th:'ชำระเงิน', en:'Pay', zh:'支付', ko:'결제', fr:'Payer' },

  // ===== Passengers =====
  pax_adult:       { th:'ผู้ใหญ่', en:'Adult', zh:'成人', ko:'성인', fr:'Adulte' },
  pax_adult_desc:  { th:'อายุ 13 ปีขึ้นไป', en:'Age 13+', zh:'13岁以上', ko:'13세 이상', fr:'13 ans et +' },
  pax_child:       { th:'เด็ก', en:'Child', zh:'儿童', ko:'어린이', fr:'Enfant' },
  pax_child_desc:  { th:'อายุ 3-12 ปี', en:'Age 3-12', zh:'3-12岁', ko:'3-12세', fr:'3-12 ans' },
  pax_infant:      { th:'ทารก', en:'Infant', zh:'婴儿', ko:'유아', fr:'Bébé' },
  pax_infant_desc: { th:'อายุต่ำกว่า 3 ปี · ฟรี', en:'Under 3 · Free', zh:'3岁以下 · 免费', ko:'3세 미만 · 무료', fr:'Moins de 3 ans · Gratuit' },
  pax_per_person:  { th:'/คน', en:'/person', zh:'/人', ko:'/명', fr:'/pers.' },

  // ===== Payment =====
  pay_qr:          { th:'QR Payment / PromptPay', en:'QR Payment / PromptPay', zh:'QR支付', ko:'QR 결제', fr:'Paiement QR' },
  pay_qr_desc:     { th:'สแกน QR Code ชำระเงินทันที', en:'Scan QR to pay instantly', zh:'扫码即时支付', ko:'QR 스캔으로 즉시 결제', fr:'Scannez le QR pour payer' },
  pay_cod:         { th:'จ่ายที่ท่าเรือ', en:'Pay at Pier', zh:'到码头付款', ko:'현장 결제', fr:'Payer au quai' },
  pay_cod_desc:    { th:'ชำระเงินสดหรือ QR ที่จุดขึ้นเรือ', en:'Cash or QR at boarding point', zh:'在登船点现金或QR支付', ko:'탑승 장소에서 현금 또는 QR', fr:'Espèces ou QR à l\'embarquement' },

  // ===== Booking Success =====
  success_title:   { th:'จองสำเร็จ!', en:'Booking Confirmed!', zh:'预订成功！', ko:'예약 완료!', fr:'Réservation confirmée !' },
  success_msg:     { th:'การจองของคุณได้รับการยืนยันแล้ว', en:'Your booking has been confirmed', zh:'您的预订已确认', ko:'예약이 확인되었습니다', fr:'Votre réservation est confirmée' },
  success_home:    { th:'กลับหน้าแรก', en:'Back to Home', zh:'返回首页', ko:'홈으로', fr:'Retour à l\'accueil' },
  book_min_pax:    { th:'ต้องมีผู้โดยสารอย่างน้อย 1 คน', en:'At least 1 passenger required', zh:'至少需要1位乘客', ko:'최소 1명의 승객이 필요합니다', fr:'Au moins 1 passager requis' },
  book_fill_contact:{ th:'กรุณาอัปเดตข้อมูลติดต่อในโปรไฟล์ (ชื่อ, อีเมล, เบอร์โทร)', en:'Please update your contact info in profile (name, email, phone)', zh:'请在个人资料中更新联系方式', ko:'프로필에서 연락처 정보를 업데이트해 주세요', fr:'Veuillez mettre à jour vos coordonnées' },
  pay_total:       { th:'ยอดชำระ', en:'Total to pay', zh:'应付总额', ko:'결제 금액', fr:'Total à payer' },
  success_booking_ref:{ th:'รหัสการจอง', en:'Booking Reference', zh:'预订编号', ko:'예약 번호', fr:'Référence de réservation' },
  success_amount:  { th:'ยอดชำระ', en:'Amount Paid', zh:'已付金额', ko:'결제 금액', fr:'Montant payé' },
  qr_title:        { th:'สแกนเพื่อชำระเงิน', en:'Scan to Pay', zh:'扫码支付', ko:'스캔하여 결제', fr:'Scanner pour payer' },
  qr_instruction:  { th:'สแกน QR Code ด้วยแอปธนาคาร', en:'Scan QR code with your banking app', zh:'使用银行应用扫描二维码', ko:'뱅킹 앱으로 QR 코드를 스캔하세요', fr:'Scannez le QR avec votre appli bancaire' },
  qr_paid_btn:     { th:'ชำระเงินแล้ว', en:'I\'ve already paid', zh:'我已付款', ko:'이미 결제했습니다', fr:'J\'ai déjà payé' },
  qr_check_status: { th:'ตรวจสอบสถานะการชำระเงิน', en:'Check payment status', zh:'检查支付状态', ko:'결제 상태 확인', fr:'Vérifier le statut du paiement' },
  qr_pending:      { th:'รอการยืนยันจากธนาคาร', en:'Awaiting bank confirmation', zh:'等待银行确认', ko:'은행 확인 대기 중', fr:'En attente de confirmation bancaire' },
  qr_ref:          { th:'อ้างอิง:', en:'Ref:', zh:'参考:', ko:'참조:', fr:'Réf.:' },
  qr_note:         { th:'การจองจะได้รับการยืนยันหลังตรวจสอบการชำระเงิน', en:'Booking confirmed after payment verification', zh:'付款验证后确认预订', ko:'결제 확인 후 예약이 확인됩니다', fr:'Réservation confirmée après vérification du paiement' },
  tip_title:       { th:'ขอบคุณที่ใช้บริการ', en:'Thank you for your trip', zh:'感谢您的光临', ko:'이용해 주셔서 감사합니다', fr:'Merci pour votre voyage' },
  tip_subtitle:    { th:'อยากส่งกำลังใจให้ทีมงานไหม? (ไม่บังคับ)', en:'Want to send a tip to the crew? (Optional)', zh:'想给小费吗？（自愿）', ko:'팀에게 팁을 보내시겠어요? (선택)', fr:'Envoyer un pourboire à l\'équipe ? (Optionnel)' },
  tip_give:        { th:'ให้ทิป 💙', en:'Give Tip 💙', zh:'给小费 💙', ko:'팁 주기 💙', fr:'Donner un pourboire 💙' },
  tip_skip:        { th:'ไม่ตอนนี้', en:'Not now', zh:'暂时不要', ko:'나중에', fr:'Pas maintenant' },
  tip_message_label: { th:'ข้อความถึงทีมงาน (ไม่บังคับ)', en:'Message to crew (optional)', zh:'给团队的留言（可选）', ko:'팀에게 메시지 (선택)', fr:'Message à l\'équipe (optionnel)' },
  live_tracking: { th:'Live Tracking', en:'Live Tracking', zh:'实时追踪', ko:'실시간 추적', fr:'Suivi en direct' },
  live_tracking_waiting: { th:'รอตำแหน่งเรือ...', en:'Waiting for boat position...', zh:'等待船只位置...', ko:'보트 위치 대기 중...', fr:'En attente de la position...' },
  live_tracking_active: { th:'กำลังอัปเดตตำแหน่งเรือ', en:'Updating boat position', zh:'正在更新船只位置', ko:'보트 위치 업데이트 중', fr:'Mise à jour de la position' },
  chat_with_crew: { th:'แชทกับทีมงาน', en:'Chat with crew', zh:'与船员聊天', ko:'승무원과 채팅', fr:'Chat avec l\'équipe' },
  chat_placeholder: { th:'พิมพ์ข้อความ...', en:'Type a message...', zh:'输入消息...', ko:'메시지 입력...', fr:'Tapez un message...' },
  chat_empty: { th:'ยังไม่มีข้อความ', en:'No messages yet', zh:'暂无消息', ko:'아직 메시지 없음', fr:'Pas encore de messages' },
  crew: { th:'ทีมงาน', en:'Crew', zh:'船员', ko:'승무원', fr:'Équipe' },
  system: { th:'ระบบ', en:'System', zh:'系统', ko:'시스템', fr:'Système' },
  tip_qr_title:    { th:'สแกนเพื่อให้ทิป', en:'Scan to Tip', zh:'扫码给小费', ko:'스캔하여 팁 주기', fr:'Scanner pour donner un pourboire' },
  tip_qr_instruction: { th:'สแกน QR Code ด้วยแอปธนาคารเพื่อโอนทิป หรือจ่ายสดแล้วกดยืนยันด้านล่าง', en:'Scan QR with banking app to transfer tip, or pay cash and confirm below', zh:'使用银行应用扫描二维码转账小费，或现金支付后点击下方确认', ko:'뱅킹 앱으로 QR 스캔하여 팁 전송, 또는 현금 결제 후 아래 확인', fr:'Scannez le QR ou payez en espèces puis confirmez ci-dessous' },
  tip_confirm_paid: { th:'ฉันโอนแล้ว', en:'I\'ve transferred', zh:'我已转账', ko:'이체했습니다', fr:'J\'ai transféré' },
  tip_success:     { th:'ขอบคุณสำหรับทิป!', en:'Thank you for the tip!', zh:'感谢您的小费！', ko:'팁 감사합니다!', fr:'Merci pour le pourboire !' },
  pay_card_desc:   { th:'ชำระด้วยบัตรเครดิต/เดบิต', en:'Pay with credit or debit card', zh:'使用信用卡/借记卡支付', ko:'신용/체크카드로 결제', fr:'Payer par carte' },
  success_view_bookings:{ th:'ดูการจองของฉัน', en:'View My Bookings', zh:'查看我的预订', ko:'내 예약 보기', fr:'Voir mes réservations' },
  success_share_card:  { th:'แชร์การ์ด', en:'Share Card', zh:'分享卡片', ko:'카드 공유', fr:'Partager la carte' },
  success_share_image: { th:'บันทึกรูป', en:'Save Image', zh:'保存图片', ko:'이미지 저장', fr:'Enregistrer l\'image' },
  success_share_copied: { th:'คัดลอกแล้ว', en:'Copied!', zh:'已复制', ko:'복사됨', fr:'Copié !' },
  success_share_to:    { th:'แชร์ไปที่', en:'Share to', zh:'分享到', ko:'공유하기', fr:'Partager sur' },

  // ===== Profile =====
  profile_title:   { th:'โปรไฟล์', en:'Profile', zh:'个人资料', ko:'프로필', fr:'Profil' },
  profile_login_req: { th:'กรุณาเข้าสู่ระบบ', en:'Please login', zh:'请登录', ko:'로그인하세요', fr:'Veuillez vous connecter' },
  profile_trips:   { th:'ทริป', en:'Trips', zh:'行程', ko:'여행', fr:'Voyages' },
  profile_reviews: { th:'รีวิว', en:'Reviews', zh:'评价', ko:'리뷰', fr:'Avis' },
  profile_favs:    { th:'ถูกใจ', en:'Favorites', zh:'收藏', ko:'좋아요', fr:'Favoris' },
  profile_booking_history: { th:'ประวัติการจอง', en:'Booking History', zh:'预订历史', ko:'예약 내역', fr:'Historique' },
  profile_favorites: { th:'รายการถูกใจ', en:'Favorites', zh:'收藏列表', ko:'좋아요 목록', fr:'Favoris' },
  profile_notifications: { th:'การแจ้งเตือน', en:'Notifications', zh:'通知', ko:'알림', fr:'Notifications' },
  profile_settings: { th:'ตั้งค่า', en:'Settings', zh:'设置', ko:'설정', fr:'Paramètres' },
  profile_edit:    { th:'แก้ไขโปรไฟล์', en:'Edit Profile', zh:'编辑资料', ko:'프로필 수정', fr:'Modifier le profil' },
  profile_language: { th:'ภาษา', en:'Language', zh:'语言', ko:'언어', fr:'Langue' },
  profile_partner: { th:'สมัครเป็นพาร์ทเนอร์', en:'Become a Partner', zh:'成为合作伙伴', ko:'파트너 등록', fr:'Devenir partenaire' },
  profile_partner_desc: { th:'เจ้าของเรือ / ผู้ให้บริการทัวร์', en:'Boat owner / Tour operator', zh:'船主/游船运营商', ko:'보트 소유자 / 투어 운영', fr:'Propriétaire de bateau / Opérateur' },
  footer_partner: { th:'สมัครเป็นพาร์ทเนอร์', en:'Become a Partner', zh:'成为合作伙伴', ko:'파트너 등록', fr:'Devenir partenaire' },
  footer_partner_invite: { th:'แชร์ แนะนำเพื่อนมาเป็นพาร์ทเนอร์', en:'Share & invite friends to become partners', zh:'分享邀请朋友成为合作伙伴', ko:'친구 초대하여 파트너 되기', fr:'Partager et inviter des amis à devenir partenaires' },
  footer_invite_copied: { th:'คัดลอกลิงก์สมัครแล้ว', en:'Registration link copied!', zh:'注册链接已复制', ko:'가입 링크 복사됨', fr:'Lien copié !' },
  profile_admin:   { th:'Admin Dashboard', en:'Admin Dashboard', zh:'管理面板', ko:'관리자', fr:'Tableau de bord' },
  profile_admin_desc: { th:'จัดการระบบ (สำหรับแอดมิน)', en:'System management (Admin)', zh:'系统管理（管理员）', ko:'시스템 관리 (관리자)', fr:'Gestion système (Admin)' },
  profile_feedback: { th:'ความเห็น', en:'Feedback', zh:'反馈', ko:'의견', fr:'Commentaires' },
  profile_feedback_desc: { th:'ส่งความคิดเห็นหรือข้อเสนอแนะ', en:'Send feedback or suggestions', zh:'发送反馈或建议', ko:'의견 또는 제안 보내기', fr:'Envoyer vos commentaires' },
  profile_help: { th:'ศูนย์ช่วยเหลือ', en:'Help Center', zh:'帮助中心', ko:'고객센터', fr:'Centre d\'aide' },
  profile_help_desc: { th:'ติดต่อสอบถามหรือแจ้งปัญหา', en:'Contact or report issues', zh:'联系或报告问题', ko:'문의 또는 문제 신고', fr:'Contacter ou signaler un problème' },
  profile_announcements: { th:'ประกาศ', en:'Announcements', zh:'公告', ko:'공지', fr:'Annonces' },
  profile_announcements_desc: { th:'ข่าวสารและประกาศจากทีมงาน', en:'News and announcements from team', zh:'团队新闻和公告', ko:'팀 소식 및 공지', fr:'Actualités et annonces' },
  profile_logout:  { th:'ออกจากระบบ', en:'Logout', zh:'退出登录', ko:'로그아웃', fr:'Déconnexion' },

  // ===== Auth =====
  auth_login:      { th:'เข้าสู่ระบบ', en:'Login', zh:'登录', ko:'로그인', fr:'Connexion' },
  auth_login_sub:  { th:'เข้าสู่ระบบเพื่อจองทริปและใช้งานเต็มรูปแบบ', en:'Login to book trips and access all features', zh:'登录以预订行程和使用全部功能', ko:'로그인하여 여행을 예약하고 모든 기능을 이용하세요', fr:'Connectez-vous pour réserver' },
  auth_email:      { th:'อีเมล', en:'Email', zh:'邮箱', ko:'이메일', fr:'Email' },
  auth_password:   { th:'รหัสผ่าน', en:'Password', zh:'密码', ko:'비밀번호', fr:'Mot de passe' },
  auth_login_btn:  { th:'เข้าสู่ระบบ', en:'Login', zh:'登录', ko:'로그인', fr:'Se connecter' },
  auth_no_account: { th:'ยังไม่มีบัญชี?', en:'No account?', zh:'没有账号？', ko:'계정이 없으신가요?', fr:'Pas de compte ?' },
  auth_partner_prompt: { th:'เจ้าของเรือ?', en:'Boat owner?', zh:'船主？', ko:'보트 소유자?', fr:'Propriétaire de bateau ?' },
  auth_partner_register: { th:'สมัครเป็นพาร์ทเนอร์', en:'Become a Partner', zh:'成为合作伙伴', ko:'파트너 등록', fr:'Devenir partenaire' },
  auth_register_as: { th:'สมัครเป็น', en:'Register as', zh:'注册为', ko:'가입 유형', fr:'S\'inscrire en tant que' },
  auth_register_customer: { th:'ลูกค้า', en:'Customer', zh:'客户', ko:'고객', fr:'Client' },
  auth_register_customer_desc: { th:'จองทริป', en:'Book trips', zh:'预订行程', ko:'여행 예약', fr:'Réserver' },
  auth_register_partner: { th:'พาร์ทเนอร์', en:'Partner', zh:'合作伙伴', ko:'파트너', fr:'Partenaire' },
  auth_register_partner_desc: { th:'เจ้าของเรือ', en:'Boat owner', zh:'船主', ko:'보트 소유자', fr:'Propriétaire' },
  auth_register:   { th:'สมัครสมาชิก', en:'Register', zh:'注册', ko:'회원가입', fr:'S\'inscrire' },
  auth_register_sub: { th:'สร้างบัญชี BOATLY', en:'Create a BOATLY account', zh:'创建 BOATLY 账号', ko:'BOATLY 계정 만들기', fr:'Créer un compte BOATLY' },
  auth_name:       { th:'ชื่อ-นามสกุล', en:'Full Name', zh:'姓名', ko:'이름', fr:'Nom complet' },
  auth_phone:      { th:'เบอร์โทร', en:'Phone', zh:'手机号', ko:'전화번호', fr:'Téléphone' },
  auth_register_btn: { th:'สมัครสมาชิก', en:'Register', zh:'注册', ko:'회원가입', fr:'S\'inscrire' },
  auth_has_account: { th:'มีบัญชีแล้ว?', en:'Have an account?', zh:'已有账号？', ko:'계정이 있으신가요?', fr:'Déjà un compte ?' },
  auth_login_success: { th:'เข้าสู่ระบบสำเร็จ!', en:'Login successful!', zh:'登录成功！', ko:'로그인 성공!', fr:'Connexion réussie !' },
  auth_register_success: { th:'สมัครสมาชิกสำเร็จ!', en:'Registration successful!', zh:'注册成功！', ko:'가입 완료!', fr:'Inscription réussie !' },
  auth_logout_done: { th:'ออกจากระบบแล้ว', en:'Logged out', zh:'已退出', ko:'로그아웃 완료', fr:'Déconnecté' },
  auth_session_expired: { th:'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', en:'Session expired. Please log in again.', zh:'会话已过期，请重新登录', ko:'세션이 만료되었습니다. 다시 로그인하세요.', fr:'Session expirée. Veuillez vous reconnecter.' },
  auth_fill_all:   { th:'กรุณากรอกข้อมูลให้ครบ', en:'Please fill all fields', zh:'请填写所有字段', ko:'모든 필드를 입력하세요', fr:'Veuillez remplir tous les champs' },
  auth_wrong_creds:{ th:'อีเมลหรือรหัสผ่านไม่ถูกต้อง', en:'Invalid email or password', zh:'邮箱或密码错误', ko:'이메일 또는 비밀번호가 잘못되었습니다', fr:'Email ou mot de passe incorrect' },
  auth_select_lang:{ th:'เลือกภาษา', en:'Select Language', zh:'选择语言', ko:'언어 선택', fr:'Choisir la langue' },
  auth_google: { th:'เข้าสู่ด้วย Google', en:'Sign in with Google', zh:'使用 Google 登录', ko:'Google로 로그인', fr:'Connexion avec Google' },
  auth_google_retry: { th:'เลือกบัญชี Google อื่น', en:'Use different Google account', zh:'使用其他 Google 账户', ko:'다른 Google 계정 사용', fr:'Utiliser un autre compte Google' },
  auth_line: { th:'เข้าสู่ด้วย Line', en:'Sign in with Line', zh:'使用 Line 登录', ko:'Line으로 로그인', fr:'Connexion avec Line' },
  auth_oauth_configure: { th:'กรุณาตั้งค่า OAuth ใน api/config/oauth.local.php ดู docs/OAUTH-SETUP.md', en:'Configure OAuth in api/config/oauth.local.php - see docs/OAUTH-SETUP.md', zh:'请在 api/config/oauth.local.php 中配置 OAuth', ko:'api/config/oauth.local.php에서 OAuth 설정', fr:'Configurez OAuth dans api/config/oauth.local.php' },

  // ===== Partner Register =====
  opreg_title: { th:'สมัครเป็นพาร์ทเนอร์', en:'Become a Partner', zh:'成为合作伙伴', ko:'파트너 등록', fr:'Devenir partenaire' },
  opreg_sub: { th:'ลงทะเบียนเป็นเจ้าของเรือ/ผู้ให้บริการทัวร์เรือ', en:'Register as boat owner / tour operator', zh:'注册为船主/游船运营商', ko:'보트 소유자 / 투어 운영자로 등록', fr:'S\'inscrire en tant que propriétaire / opérateur' },
  opreg_success_title: { th:'สมัครสำเร็จ!', en:'Registration successful!', zh:'注册成功！', ko:'가입 완료!', fr:'Inscription réussie !' },
  opreg_success_msg: { th:'บัญชีของคุณอยู่ในสถานะรออนุมัติ กรุณารอแอดมินตรวจสอบและอนุมัติก่อนเข้าสู่ระบบ', en:'Your account is pending approval. Please wait for admin to review and approve before logging in.', zh:'您的账户待审核，请等待管理员批准后再登录。', ko:'계정이 승인 대기 중입니다. 관리자 승인 후 로그인하세요.', fr:'Votre compte est en attente d\'approbation.' },
  opreg_name: { th:'ชื่อ-นามสกุล', en:'Full Name', zh:'姓名', ko:'이름', fr:'Nom complet' },
  opreg_name_ph: { th:'ชื่อผู้ติดต่อ', en:'Contact name', zh:'联系人姓名', ko:'담당자 이름', fr:'Nom du contact' },
  opreg_email: { th:'อีเมล', en:'Email', zh:'邮箱', ko:'이메일', fr:'Email' },
  opreg_phone: { th:'เบอร์โทร', en:'Phone', zh:'电话', ko:'전화번호', fr:'Téléphone' },
  opreg_phone_ph: { th:'0812345678', en:'08x-xxx-xxxx', zh:'08x-xxx-xxxx', ko:'010-xxxx-xxxx', fr:'08x-xxx-xxxx' },
  opreg_company: { th:'ชื่อบริษัท/ร้านเรือ', en:'Company / Boat business name', zh:'公司/船务名称', ko:'회사 / 보트 사업명', fr:'Entreprise / Nom du bateau' },
  opreg_company_ph: { th:'ชื่อธุรกิจ', en:'Business name', zh:'业务名称', ko:'사업명', fr:'Nom de l\'entreprise' },
  opreg_desc: { th:'รายละเอียด (ไม่บังคับ)', en:'Description (optional)', zh:'描述（选填）', ko:'설명 (선택)', fr:'Description (optionnel)' },
  opreg_desc_ph: { th:'อธิบายธุรกิจของคุณ', en:'Describe your business', zh:'描述您的业务', ko:'사업 설명', fr:'Décrivez votre activité' },
  opreg_password: { th:'รหัสผ่าน', en:'Password', zh:'密码', ko:'비밀번호', fr:'Mot de passe' },
  opreg_password_ph: { th:'อย่างน้อย 6 ตัว', en:'At least 6 characters', zh:'至少6个字符', ko:'6자 이상', fr:'6 caractères minimum' },
  opreg_submit: { th:'สมัครสมาชิก', en:'Register', zh:'注册', ko:'가입하기', fr:'S\'inscrire' },
  opreg_submitting: { th:'กำลังสมัคร...', en:'Registering...', zh:'注册中...', ko:'가입 중...', fr:'Inscription...' },
  opreg_has_account: { th:'มีบัญชีแล้ว?', en:'Have an account?', zh:'已有账号？', ko:'계정이 있으신가요?', fr:'Déjà un compte ?' },
  opreg_login: { th:'เข้าสู่ระบบ', en:'Login', zh:'登录', ko:'로그인', fr:'Connexion' },
  opreg_back_home: { th:'← กลับหน้าแรก', en:'← Back to home', zh:'← 返回首页', ko:'← 홈으로', fr:'← Retour' },
  opreg_err_required: { th:'กรุณากรอกข้อมูลที่จำเป็นให้ครบ', en:'Please fill all required fields', zh:'请填写所有必填项', ko:'필수 항목을 입력하세요', fr:'Veuillez remplir tous les champs' },
  opreg_err_password: { th:'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', en:'Password must be at least 6 characters', zh:'密码至少6个字符', ko:'비밀번호는 6자 이상이어야 합니다', fr:'Le mot de passe doit contenir au moins 6 caractères' },
  opreg_err_network: { th:'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่', en:'Connection failed. Please try again.', zh:'连接失败，请重试。', ko:'연결 실패. 다시 시도하세요.', fr:'Échec de connexion. Réessayez.' },

  // ===== Time Slots =====
  time_morning:    { th:'รอบเช้า', en:'Morning', zh:'上午', ko:'오전', fr:'Matin' },
  time_afternoon:  { th:'รอบบ่าย', en:'Afternoon', zh:'下午', ko:'오후', fr:'Après-midi' },
  time_sunset:     { th:'รอบเย็น (Sunset)', en:'Sunset', zh:'日落', ko:'석양', fr:'Coucher de soleil' },
  time_evening:    { th:'รอบค่ำ', en:'Evening', zh:'晚上', ko:'저녁', fr:'Soirée' },
  time_full:       { th:'เต็ม', en:'Full', zh:'已满', ko:'마감', fr:'Complet' },
  time_seats_left: { th:'เหลือ {n} ที่นั่ง', en:'{n} seats left', zh:'剩余{n}个座位', ko:'{n}석 남음', fr:'{n} places restantes' },
  time_no_slots:   { th:'ไม่มีรอบเวลาว่างในวันนี้', en:'No time slots available', zh:'今天没有可用时段', ko:'이용 가능한 시간이 없습니다', fr:'Aucun créneau disponible' },

  // ===== Summary =====
  summary_date:    { th:'วันที่', en:'Date', zh:'日期', ko:'날짜', fr:'Date' },
  summary_time:    { th:'เวลา', en:'Time', zh:'时间', ko:'시간', fr:'Heure' },
  summary_pax:     { th:'ผู้โดยสาร', en:'Passengers', zh:'乘客', ko:'승객', fr:'Passagers' },
  summary_passengers:{ th:'ผู้โดยสาร', en:'Passengers', zh:'乘客', ko:'승객', fr:'Passagers' },
  summary_pier:    { th:'ท่าเรือ', en:'Pier', zh:'码头', ko:'선착장', fr:'Quai' },
  summary_pickup_location: { th:'สถานที่รับ/ส่ง', en:'Pick-up / Drop-off location', zh:'接送地点', ko:'픽업/하차 장소', fr:'Lieu de prise en charge' },
  summary_pickup_placeholder: { th:'เช่น โรงแรม ABC, ท่าเรือ XYZ', en:'e.g. Hotel ABC, Pier XYZ', zh:'例如 酒店ABC、码头XYZ', ko:'예: 호텔 ABC, 부두 XYZ', fr:'ex. Hôtel ABC, Quai XYZ' },
  summary_route:   { th:'เส้นทาง', en:'Route', zh:'路线', ko:'경로', fr:'Itinéraire' },
  summary_gps_note:{ th:'📍 ลิงก์นำทาง GPS ไปท่าเรือจะอยู่ในใบสรุปการจอง', en:'📍 GPS navigation link to pier will be in your booking confirmation', zh:'📍 码头GPS导航链接将在预订确认中', ko:'📍 선착장 GPS 내비게이션 링크가 예약 확인서에 포함됩니다', fr:'📍 Le lien GPS vers le quai sera dans votre confirmation' },
  summary_navigate:{ th:'นำทางไปท่าเรือ', en:'Navigate to pier', zh:'导航到码头', ko:'선착장으로 네비게이션', fr:'Naviguer vers le quai' },
  summary_promo:   { th:'โค้ดส่วนลด', en:'Promo Code', zh:'优惠码', ko:'프로모 코드', fr:'Code promo' },
  summary_use_code:{ th:'ใช้โค้ด', en:'Apply', zh:'使用', ko:'적용', fr:'Appliquer' },
  summary_discount:{ th:'ส่วนลด', en:'Discount', zh:'折扣', ko:'할인', fr:'Réduction' },
  summary_total:   { th:'ยอดรวม', en:'Total', zh:'总计', ko:'합계', fr:'Total' },
  summary_addons:  { th:'บริการเสริม', en:'Add-ons', zh:'附加服务', ko:'추가 옵션', fr:'Options' },

  // ===== Calendar =====
  cal_weekdays:    { th:['อา','จ','อ','พ','พฤ','ศ','ส'], en:['Su','Mo','Tu','We','Th','Fr','Sa'], zh:['日','一','二','三','四','五','六'], ko:['일','월','화','수','목','금','토'], fr:['Di','Lu','Ma','Me','Je','Ve','Sa'] },
  cal_months:      { th:['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'], en:['January','February','March','April','May','June','July','August','September','October','November','December'], zh:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'], ko:['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'], fr:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'] },

  // ===== Favorites =====
  fav_title:       { th:'รายการถูกใจ', en:'Favorites', zh:'收藏列表', ko:'좋아요 목록', fr:'Favoris' },
  fav_empty:       { th:'ยังไม่มีรายการถูกใจ', en:'No favorites yet', zh:'暂无收藏', ko:'좋아요 목록이 비어있습니다', fr:'Pas de favoris' },
  fav_hint:        { th:'กดหัวใจเพื่อบันทึกทริปที่ชอบ', en:'Tap heart to save trips you love', zh:'点击爱心收藏你喜欢的行程', ko:'하트를 눌러 좋아하는 여행을 저장하세요', fr:'Appuyez sur le cœur pour sauvegarder' },
  fav_added:       { th:'เพิ่มในรายการถูกใจ ❤️', en:'Added to favorites ❤️', zh:'已添加到收藏 ❤️', ko:'좋아요에 추가됨 ❤️', fr:'Ajouté aux favoris ❤️' },
  fav_removed:     { th:'ลบออกจากรายการถูกใจ', en:'Removed from favorites', zh:'已取消收藏', ko:'좋아요에서 제거됨', fr:'Retiré des favoris' },

  // ===== Bookings =====
  bookings_title:  { th:'การจองของฉัน', en:'My Bookings', zh:'我的预订', ko:'내 예약', fr:'Mes réservations' },
  bookings_empty:  { th:'ยังไม่มีการจอง', en:'No bookings yet', zh:'暂无预订', ko:'예약 내역이 없습니다', fr:'Pas de réservations' },
  bookings_cancel: { th:'ยกเลิก', en:'Cancel', zh:'取消', ko:'취소', fr:'Annuler' },
  bookings_cancel_confirm: { th:'ยืนยันการยกเลิกการจอง?', en:'Confirm cancellation?', zh:'确认取消预订？', ko:'예약을 취소하시겠습니까?', fr:'Confirmer l\'annulation ?' },
  bookings_cancelled: { th:'ยกเลิกการจองเรียบร้อย', en:'Booking cancelled', zh:'预订已取消', ko:'예약이 취소되었습니다', fr:'Réservation annulée' },
  bookings_all:    { th:'ทั้งหมด', en:'All', zh:'全部', ko:'전체', fr:'Tout' },
  booking_detail_title: { th:'รายละเอียดการจอง', en:'Booking Details', zh:'预订详情', ko:'예약 상세', fr:'Détails' },
  booking_detail_info:  { th:'ข้อมูลการจอง', en:'Booking Info', zh:'预订信息', ko:'예약 정보', fr:'Infos réservation' },
  booking_ref:     { th:'เลขที่การจอง', en:'Booking Ref', zh:'预订编号', ko:'예약 번호', fr:'Réf.' },
  booking_schedule:{ th:'กำหนดการ', en:'Schedule', zh:'时间表', ko:'일정', fr:'Horaire' },
  booking_contact: { th:'ข้อมูลผู้จอง', en:'Contact Info', zh:'联系信息', ko:'연락처 정보', fr:'Coordonnées' },
  booking_note:    { th:'หมายเหตุ', en:'Note', zh:'备注', ko:'메모', fr:'Note' },
  booking_payment: { th:'การชำระเงิน', en:'Payment', zh:'支付', ko:'결제', fr:'Paiement' },
  pay_method:      { th:'วิธีชำระ', en:'Method', zh:'支付方式', ko:'결제 방법', fr:'Mode' },
  pay_status:      { th:'สถานะ', en:'Status', zh:'状态', ko:'상태', fr:'Statut' },
  pay_completed:   { th:'ชำระแล้ว', en:'Paid', zh:'已支付', ko:'결제 완료', fr:'Payé' },
  pay_pending:     { th:'รอชำระ', en:'Pending', zh:'待支付', ko:'결제 대기', fr:'En attente' },
  pay_failed:      { th:'ล้มเหลว', en:'Failed', zh:'失败', ko:'실패', fr:'Échoué' },
  pay_none:        { th:'ยังไม่มีข้อมูลการชำระ', en:'No payment recorded', zh:'暂无支付记录', ko:'결제 기록 없음', fr:'Aucun paiement' },
  status_pending:  { th:'รอยืนยัน', en:'Pending', zh:'待确认', ko:'대기 중', fr:'En attente' },
  status_confirmed:{ th:'ยืนยันแล้ว', en:'Confirmed', zh:'已确认', ko:'확인됨', fr:'Confirmé' },
  status_completed:{ th:'เสร็จสิ้น', en:'Completed', zh:'已完成', ko:'완료', fr:'Terminé' },
  op_complete_btn:  { th:'งานเสร็จสมบูรณ์', en:'Mark Complete', zh:'标记完成', ko:'완료 표시', fr:'Marquer terminé' },
  op_complete_done: { th:'งานเสร็จสมบูรณ์แล้ว', en:'Marked as complete', zh:'已标记完成', ko:'완료로 표시됨', fr:'Marqué comme terminé' },
  op_status_pending:    { th:'รอดำเนินการ', en:'Pending', zh:'待处理', ko:'대기 중', fr:'En attente' },
  op_status_completed:  { th:'งานสำเร็จ', en:'Job Done', zh:'工作已完成', ko:'작업 완료', fr:'Travail terminé' },
  op_status_rescheduled:{ th:'เลื่อนกำหนด', en:'Rescheduled', zh:'已改期', ko:'일정 변경', fr:'Reporté' },
  op_approved_msg:  { th:'บัญชีของคุณได้รับการอนุมัติแล้ว', en:'Your account has been approved', zh:'您的账户已获批准', ko:'계정이 승인되었습니다', fr:'Votre compte a été approuvé' },
  op_check_status_btn: { th:'ตรวจสอบสถานะอีกครั้ง', en:'Check status again', zh:'再次检查状态', ko:'상태 다시 확인', fr:'Vérifier à nouveau' },
  op_still_pending: { th:'ยังรอการอนุมัติจากแอดมิน', en:'Still awaiting admin approval', zh:'仍在等待管理员批准', ko:'관리자 승인 대기 중', fr:'En attente d\'approbation admin' },
  status_cancelled:{ th:'ยกเลิก', en:'Cancelled', zh:'已取消', ko:'취소됨', fr:'Annulé' },

  // ===== Notifications =====
  notif_title:     { th:'การแจ้งเตือน', en:'Notifications', zh:'通知', ko:'알림', fr:'Notifications' },
  notif_empty:     { th:'ไม่มีการแจ้งเตือน', en:'No notifications', zh:'暂无通知', ko:'알림이 없습니다', fr:'Pas de notifications' },
  notif_hint:      { th:'การแจ้งเตือนจะปรากฏที่นี่', en:'Notifications will appear here', zh:'通知会显示在这里', ko:'알림이 여기에 표시됩니다', fr:'Les notifications apparaîtront ici' },
  notif_mark_all:  { th:'อ่านทั้งหมด', en:'Mark all read', zh:'全部已读', ko:'모두 읽음', fr:'Tout marquer lu' },
  notif_all_read:  { th:'อ่านทั้งหมดแล้ว', en:'All marked as read', zh:'已全部标为已读', ko:'모두 읽음으로 표시됨', fr:'Tout marqué comme lu' },

  // ===== Map =====
  map_title:       { th:'แผนที่บริการ', en:'Service Map', zh:'服务地图', ko:'서비스 지도', fr:'Carte des services' },
  map_explore:     { th:'ดูบริการทั้งหมดบนแผนที่', en:'View all services on map', zh:'在地图上查看所有服务', ko:'지도에서 모든 서비스 보기', fr:'Voir tous les services sur la carte' },
  map_click:       { th:'กดเพื่อเปิดแผนที่', en:'Tap to open map', zh:'点击打开地图', ko:'지도 열기', fr:'Appuyez pour ouvrir' },

  // ===== Reviews =====
  review_write:    { th:'เขียนรีวิว', en:'Write Review', zh:'写评价', ko:'리뷰 작성', fr:'Écrire un avis' },
  review_add_photos: { th:'เพิ่มรูปภาพ (สูงสุด 5 รูป)', en:'Add Photos (max 5)', zh:'添加照片（最多5张）', ko:'사진 추가 (최대 5장)', fr:'Ajouter des photos (max 5)' },
  review_submit:   { th:'ส่งรีวิว', en:'Submit Review', zh:'提交评价', ko:'리뷰 제출', fr:'Soumettre' },
  review_thanks:   { th:'ขอบคุณสำหรับรีวิว!', en:'Thanks for your review!', zh:'感谢您的评价！', ko:'리뷰 감사합니다!', fr:'Merci pour votre avis !' },

  // ===== Edit Profile =====
  edit_name:       { th:'ชื่อ', en:'Name', zh:'姓名', ko:'이름', fr:'Nom' },
  edit_phone:      { th:'เบอร์โทร', en:'Phone', zh:'手机', ko:'전화', fr:'Tél.' },
  edit_save:       { th:'บันทึก', en:'Save', zh:'保存', ko:'저장', fr:'Enregistrer' },
  edit_saved:      { th:'บันทึกเรียบร้อย', en:'Saved successfully', zh:'保存成功', ko:'저장되었습니다', fr:'Enregistré' },
  edit_change_photo: { th:'แตะเพื่อเปลี่ยนรูปโปรไฟล์', en:'Tap to change photo', zh:'点击更换头像', ko:'사진 변경', fr:'Appuyez pour changer' },
  edit_uploading:  { th:'กำลังอัปโหลด...', en:'Uploading...', zh:'上传中...', ko:'업로드 중...', fr:'Envoi...' },
  edit_photo_saved:{ th:'อัปโหลดรูปสำเร็จ', en:'Photo saved', zh:'头像已保存', ko:'사진 저장됨', fr:'Photo enregistrée' },

  // ===== General =====
  loading:         { th:'กำลังโหลด...', en:'Loading...', zh:'加载中...', ko:'로딩 중...', fr:'Chargement...' },
  error:           { th:'เกิดข้อผิดพลาด', en:'An error occurred', zh:'发生错误', ko:'오류가 발생했습니다', fr:'Une erreur est survenue' },
  no_data:         { th:'ไม่พบข้อมูล', en:'No data found', zh:'未找到数据', ko:'데이터 없음', fr:'Aucune donnée' },
  confirm:         { th:'ยืนยัน', en:'Confirm', zh:'确认', ko:'확인', fr:'Confirmer' },
  cancel:          { th:'ยกเลิก', en:'Cancel', zh:'取消', ko:'취소', fr:'Annuler' },
  close:           { th:'ปิด', en:'Close', zh:'关闭', ko:'닫기', fr:'Fermer' },
  full_day:        { th:'เต็มวัน', en:'Full Day', zh:'全天', ko:'종일', fr:'Journée' },
  per_person:      { th:'/คน', en:'/person', zh:'/人', ko:'/명', fr:'/pers.' },
  free:            { th:'ฟรี', en:'Free', zh:'免费', ko:'무료', fr:'Gratuit' },
  select:          { th:'เลือก', en:'Select', zh:'选择', ko:'선택', fr:'Sélectionner' },
  selected:        { th:'เลือกแล้ว', en:'Selected', zh:'已选择', ko:'선택됨', fr:'Sélectionné' },
  search_results:  { th:'ผลการค้นหา', en:'Search Results', zh:'搜索结果', ko:'검색 결과', fr:'Résultats' },
  no_trips:        { th:'ไม่พบทริป', en:'No trips found', zh:'未找到行程', ko:'여행을 찾을 수 없습니다', fr:'Aucun voyage trouvé' },
  try_other:       { th:'ลองค้นหาด้วยคำอื่น', en:'Try different keywords', zh:'尝试其他关键词', ko:'다른 키워드로 검색해보세요', fr:'Essayez d\'autres mots-clés' },
  all:             { th:'ทั้งหมด', en:'All', zh:'全部', ko:'전체', fr:'Tous' },
  test_account:    { th:'ทดลอง:', en:'Test:', zh:'测试:', ko:'테스트:', fr:'Test :' },

  // ===== Missing keys used in HTML =====
  tours_title:     { th:'ค้นหาทริป', en:'Search Trips', zh:'搜索行程', ko:'여행 검색', fr:'Rechercher' },
  filter_all:      { th:'ทั้งหมด', en:'All', zh:'全部', ko:'전체', fr:'Tous' },
  detail_price_from: { th:'ราคาเริ่มต้น', en:'Starting from', zh:'起价', ko:'시작가', fr:'À partir de' },
  booking_title:   { th:'จองทริป', en:'Book Trip', zh:'预订行程', ko:'여행 예약', fr:'Réserver' },
  book_select_date_first: { th:'กรุณาเลือกวันที่ก่อน', en:'Please select a date first', zh:'请先选择日期', ko:'날짜를 먼저 선택하세요', fr:'Veuillez d\'abord choisir une date' },
  map_preview_title: { th:'ดูท่าเรือทั้งหมดบนแผนที่', en:'View all piers on map', zh:'在地图上查看所有码头', ko:'지도에서 모든 부두 보기', fr:'Voir tous les quais sur la carte' },
  map_preview_subtitle: { th:'กดเพื่อเปิดแผนที่', en:'Tap to open map', zh:'点击打开地图', ko:'지도를 열려면 탭하세요', fr:'Appuyez pour ouvrir la carte' },
  profile_please_login: { th:'กรุณาเข้าสู่ระบบ', en:'Please login', zh:'请登录', ko:'로그인하세요', fr:'Veuillez vous connecter' },
  profile_edit_desc: { th:'แก้ไขข้อมูลส่วนตัว', en:'Update your information', zh:'更新个人信息', ko:'정보 수정', fr:'Modifier vos informations' },
  profile_booking_history_desc: { th:'ดูประวัติการจองทั้งหมด', en:'View all bookings', zh:'查看所有预订', ko:'모든 예약 보기', fr:'Voir toutes les réservations' },
  profile_favorites_desc: { th:'ทริปที่บันทึกไว้', en:'Saved trips', zh:'收藏的行程', ko:'저장한 여행', fr:'Voyages sauvegardés' },
  profile_notifications_desc: { th:'จัดการการแจ้งเตือน', en:'Manage notifications', zh:'管理通知', ko:'알림 관리', fr:'Gérer les notifications' },
  profile_language_desc: { th:'เปลี่ยนภาษาแสดงผล', en:'Change display language', zh:'更改显示语言', ko:'표시 언어 변경', fr:'Changer la langue' },
  profile_admin_desc: { th:'จัดการระบบ (สำหรับแอดมิน)', en:'System management (Admin)', zh:'系统管理（管理员）', ko:'시스템 관리 (관리자)', fr:'Gestion système (Admin)' },
  edit_profile_title: { th:'แก้ไขโปรไฟล์', en:'Edit Profile', zh:'编辑资料', ko:'프로필 수정', fr:'Modifier le profil' },
  edit_language:   { th:'ภาษา', en:'Language', zh:'语言', ko:'언어', fr:'Langue' },
  review_title:    { th:'เขียนรีวิว', en:'Write a Review', zh:'写评价', ko:'리뷰 작성', fr:'Écrire un avis' },
  review_subtitle: { th:'แบ่งปันประสบการณ์ของคุณ', en:'Share your experience', zh:'分享您的体验', ko:'경험을 공유하세요', fr:'Partagez votre expérience' },
  review_comment:  { th:'ความคิดเห็น', en:'Comment', zh:'评论', ko:'댓글', fr:'Commentaire' },
  review_photos:   { th:'รูปภาพ (สูงสุด 5 รูป)', en:'Photos (max 5)', zh:'照片（最多5张）', ko:'사진 (최대 5장)', fr:'Photos (max 5)' },
  success_subtitle:{ th:'การจองของคุณได้รับการยืนยันแล้ว', en:'Your booking has been confirmed', zh:'您的预订已确认', ko:'예약이 확인되었습니다', fr:'Votre réservation est confirmée' },
  success_share:   { th:'แชร์', en:'Share', zh:'分享', ko:'공유', fr:'Partager' },
  auth_login_link: { th:'เข้าสู่ระบบ', en:'Login', zh:'登录', ko:'로그인', fr:'Connexion' },
  auth_register_link: { th:'สมัครสมาชิก', en:'Register', zh:'注册', ko:'회원가입', fr:'S\'inscrire' },
  summary_apply:   { th:'ใช้โค้ด', en:'Apply', zh:'使用', ko:'적용', fr:'Appliquer' },
  summary_promo_placeholder: { th:'กรอกโค้ดส่วนลด', en:'Enter promo code', zh:'输入优惠码', ko:'프로모 코드 입력', fr:'Entrer le code promo' },
  book_adult:      { th:'ผู้ใหญ่', en:'Adult', zh:'成人', ko:'성인', fr:'Adulte' },
  book_child:      { th:'เด็ก', en:'Child', zh:'儿童', ko:'어린이', fr:'Enfant' },
  book_infant:     { th:'ทารก', en:'Infant', zh:'婴儿', ko:'유아', fr:'Bébé' },
  book_adult_age:  { th:'อายุ 13 ปีขึ้นไป', en:'Age 13+', zh:'13岁以上', ko:'13세 이상', fr:'13 ans et +' },
  book_child_age:  { th:'อายุ 3-12 ปี', en:'Age 3-12', zh:'3-12岁', ko:'3-12세', fr:'3-12 ans' },
  book_infant_age: { th:'อายุต่ำกว่า 3 ปี', en:'Under 3', zh:'3岁以下', ko:'3세 미만', fr:'Moins de 3 ans' },
  book_free:       { th:'ฟรี', en:'Free', zh:'免费', ko:'무료', fr:'Gratuit' },
  book_per_person: { th:'/คน', en:'/person', zh:'/人', ko:'/명', fr:'/pers.' },
  edit_name_placeholder: { th:'ชื่อของคุณ', en:'Your name', zh:'您的姓名', ko:'이름', fr:'Votre nom' },
  edit_phone_placeholder: { th:'08x-xxx-xxxx', en:'08x-xxx-xxxx', zh:'08x-xxx-xxxx', ko:'08x-xxx-xxxx', fr:'08x-xxx-xxxx' },
};

// Current language
let currentLang = localStorage.getItem('bh_lang') || 'th';

function setLang(lang) {
  if (!LANGS[lang]) return;
  currentLang = lang;
  localStorage.setItem('bh_lang', lang);
  document.documentElement.lang = lang;
  applyTranslations();
  if (typeof refreshCurrentView === 'function') refreshCurrentView();
}

function t(key, replacements) {
  const entry = T[key];
  if (!entry) return key;
  let text = entry[currentLang] || entry['en'] || entry['th'] || key;
  if (replacements) {
    Object.keys(replacements).forEach(k => {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), replacements[k]);
    });
  }
  return text;
}

function tField(obj, field) {
  if (!obj) return '';
  const langSuffix = currentLang === 'th' ? '_th' : '_' + currentLang;
  return obj[field + langSuffix] || obj[field + '_en'] || obj[field + '_th'] || obj[field] || '';
}

function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.children.length > 0) {
      const first = el.childNodes[0];
      if (first && first.nodeType === 3) first.textContent = val + ' ';
      else el.insertBefore(document.createTextNode(val + ' '), el.firstChild);
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-t-placeholder'));
  });
  document.querySelectorAll('[data-t-title]').forEach(el => {
    el.title = t(el.getAttribute('data-t-title'));
  });
  updateLangPicker();
}

function updateLangPicker() {
  const flag = LANGS[currentLang] ? LANGS[currentLang].flag : '🇹🇭';
  const name = LANGS[currentLang] ? LANGS[currentLang].name : 'ไทย';
  const el = document.getElementById('currentLangFlag');
  if (el) el.textContent = flag;
  const profileFlag = document.getElementById('profileLangFlag');
  if (profileFlag) profileFlag.textContent = flag;
  const partnerFlag = document.getElementById('partnerLangFlag');
  if (partnerFlag) partnerFlag.textContent = flag;
  const nameEl = document.getElementById('langPickerName');
  if (nameEl) nameEl.textContent = name;
  document.querySelectorAll('.lang-picker-item').forEach(btn => {
    const lid = btn.getAttribute('data-lang') || (btn.id ? btn.id.replace('langBtn_', '') : '');
    if (lid) btn.classList.toggle('active', lid === currentLang);
  });
}

function showLangPicker() {
  const modal = document.getElementById('langPickerModal');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.lang-picker-item').forEach(btn => {
      btn.classList.toggle('active', btn.id === 'langBtn_' + currentLang);
    });
  }
}

function selectLang(lang) {
  setLang(lang);
  const modal = document.getElementById('langPickerModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}
