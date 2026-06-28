/* ═══════════════════════════════════════════════════════════════
   YP WORK · FRAMEWORK/SCROLL-LOCK
   assets/js/framework/scroll-lock.js
   ────────────────────────────────────────────────────────────────
   ล็อคการ scroll ของหน้าหลักเวลาเปิด bottom sheet / modal

   เทคนิคที่ใช้ (ระดับ production-grade):
   1. position:fixed บน body + top:-scrollY — browser เข้าใจว่า
      หน้าสิ้นสุดที่นี่ ไม่มี content ด้านล่างให้ scroll ไป
   2. บันทึก scrollY แล้วคืนค่าตอน unlock — ไม่มี jump
   3. ตั้ง width:100% บน body เพื่อกัน horizontal shift
   4. overscroll-behavior:none บน html — กัน rubber-band บน iOS
   5. ปิด wheel/touchmove/keydown scroll บน document
   6. รองรับ stack — นับ count ปลดจริงเมื่อ count = 0

   ผลลัพธ์:
   - หน้าด้านหลัง "ตาย" จริง — เลื่อนไม่ได้ด้วย wheel/touch/keyboard
   - ไม่มี layout shift เพราะ body ถูก fixed ไว้
   - scroll position คงที่ ไม่หาย
   ═══════════════════════════════════════════════════════════════ */

let _lockCount = 0;
let _savedScrollY = 0;
let _savedScrollX = 0;
let _savedHtmlCssText = '';
let _savedBodyCssText = '';

/**
 * ล็อค scroll ของหน้าหลัก
 * ใช้ร่วมกับ bottom-sheet/modal — เรียกซ้อนกันได้ (count-based)
 */
export function lockScroll() {
  _lockCount++;
  if (_lockCount !== 1) return; // ล็อคครั้งแรกเท่านั้น

  const html = document.documentElement;
  const body = document.body;

  // บันทึก scroll position ปัจจุบัน
  _savedScrollY = window.scrollY || window.pageYOffset || 0;
  _savedScrollX = window.scrollX || window.pageXOffset || 0;

  // บันทึก cssText เดิมเพื่อคืนค่าแบบถูกต้อง
  _savedHtmlCssText = html.getAttribute('style') || '';
  _savedBodyCssText = body.getAttribute('style') || '';

  // กัน scrollbar jump — ใส่ padding-right เท่ากับ scrollbar width
  const scrollbarWidth = window.innerWidth - html.clientWidth;

  // ── HTML ──
  // ตั้ง overflow:hidden + overscroll-behavior:none เพื่อกัน rubber-band
  // บน iOS Safari และกัน scroll chain จาก mouse wheel
  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  html.style.marginRight = scrollbarWidth > 0 ? scrollbarWidth + 'px' : '';

  // ── BODY ──
  // ใช้ position:fixed + top:-scrollY + width:100% — เทคนิคนี้ทำให้
  // browser เข้าใจว่า body "หายไป" จาก normal flow ของ viewport
  // ผล: ไม่มี content ด้านล่างให้ scroll ไป แม้แต่นิดเดียว
  body.style.position = 'fixed';
  body.style.top = '-' + _savedScrollY + 'px';
  body.style.left = '0';
  body.style.right = '0';
  body.style.bottom = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';

  // ตั้ง CSS variable ให้ component อื่นใช้ถ้าต้องการ
  html.style.setProperty('--yp-scroll-locked', '1');
  html.style.setProperty('--yp-locked-scroll-y', _savedScrollY + 'px');

  // กดกั้น wheel/scroll/touch ที่อาจทะลุผ่าน (defensive — ป้องกัน
  // browser bug หรือ scroll บน element ที่ไม่ใช่ [data-scrollable])
  document.addEventListener('wheel', _preventScroll, { passive: false });
  document.addEventListener('touchmove', _preventTouch, { passive: false });
  document.addEventListener('keydown', _preventKeyScroll, { passive: false });
}

/**
 * ปลดล็อค scroll — count-based ปลดจริงเมื่อ count = 0
 */
export function unlockScroll() {
  _lockCount = Math.max(0, _lockCount - 1);
  if (_lockCount !== 0) return;

  const html = document.documentElement;
  const body = document.body;

  // คืน cssText เดิม — กลับสู่สถานะก่อนล็อคอย่างสมบูรณ์
  // (setAttribute จะ replace style attribute ทั้งหมด รวมถึง CSS variables
  //  ที่ตั้งไว้ตอน lockScroll เช่น --yp-scroll-locked ดังนั้นไม่ต้อง removeProperty แยก)
  if (_savedHtmlCssText) {
    html.setAttribute('style', _savedHtmlCssText);
  } else {
    html.removeAttribute('style');
  }
  if (_savedBodyCssText) {
    body.setAttribute('style', _savedBodyCssText);
  } else {
    body.removeAttribute('style');
  }

  document.removeEventListener('wheel', _preventScroll);
  document.removeEventListener('touchmove', _preventTouch);
  document.removeEventListener('keydown', _preventKeyScroll);

  // ── CRITICAL FIX: กันอาการ "วาร์ปไปด้านบน แล้วค่อยเลื่อนกลับมา" ──
  //
  // ต้นตอ: base.css ตั้ง `scroll-behavior: smooth` บน html
  // ทำให้ window.scrollTo() มี animation — browser จะเริ่มจาก scroll=0
  // (เพราะ body position:fixed ถูกลบออกไปแล้ว) แล้วค่อย ๆ เลื่อนไปที่ตำแหน่งเดิม
  // ผู้ใช้จึงเห็นหน้า "วาร์ปไปด้านบนสุด แล้วค่อยเลื่อนกลับลงมา"
  //
  // วิธีแก้: override scroll-behavior เป็น 'auto' แบบ inline ก่อนเรียก scrollTo
  // เพื่อบังคับให้ browser ตั้ง scroll position ทันทีไม่มี animation
  // แล้วค่อยคืนค่าในเฟรมถัดไป เพื่อให้ scroll ครั้งต่อไปกลับมา smooth ตามปกติ
  //
  // Note: ใช้ inline style เพราะมัน override CSS rule ใน base.css ได้แน่นอน
  // และรองรับทุก browser รวมถึงรุ่นเก่าที่ไม่รู้จัก behavior:'instant' option
  html.style.scrollBehavior = 'auto';
  window.scrollTo(_savedScrollX, _savedScrollY);
  requestAnimationFrame(() => {
    html.style.scrollBehavior = '';
  });
}

/* ── Internal handlers ── */
function _preventScroll(e) {
  // อนุญาตถ้า target อยู่ใน modal/sheet body ที่ scroll ได้
  if (e.target.closest('[data-scrollable="true"]')) return;
  e.preventDefault();
}

function _preventTouch(e) {
  // อนุญาต touchmove ใน scrollable body เท่านั้น
  if (e.target.closest('[data-scrollable="true"]')) return;
  // ยกเว้นการ touch บน input/textarea (สำหรับฟอร์ม)
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  e.preventDefault();
}

function _preventKeyScroll(e) {
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'];
  if (keys.includes(e.key)) {
    if (e.target.closest('[data-scrollable="true"]')) return;
    e.preventDefault();
  }
}

/**
 * ตรวจสอบว่ากำลังล็อคอยู่หรือไม่
 */
export function isScrollLocked() {
  return _lockCount > 0;
}

/**
 * Reset ทั้งหมด — ใช้ตอน unload เท่านั้น
 */
export function forceUnlock() {
  _lockCount = 1;
  unlockScroll();
}
