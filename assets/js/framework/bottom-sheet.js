/* ═══════════════════════════════════════════════════════════════
   YP WORK · FRAMEWORK/BOTTOM-SHEET
   assets/js/framework/bottom-sheet.js
   ────────────────────────────────────────────────────────────────
   Bottom sheet คุณภาพสูง แบบ iOS-native (production-grade v5.2)

   v5.2 CHANGES (vs. v5.0):
   - FULL-FOLLOW DRAG: ลบ damping → sheet ติดตามนิ้ว 1:1 ลงไปจน off-screen
     (v5.0 sheet ตามแค่ 60% ของ finger travel → รู้สึกว่า "หยุดก่อนสุด")
   - EDGE RESISTANCE: เลย sheetHeight แล้ว sheet ตาม 35% ของส่วนเกิน
     → sensation เหมือน drag ผ่านขอบ ไม่ใช่ drag ฟรี ๆ
   - LOWER CLOSE THRESHOLD: ลดจาก 45% → 28% ("พอดีเหมาะสม" ไม่เยอะ/น้อยเกิน)
   - LOWER FLING THRESHOLD: ลดจาก 15% → 10% (fling ปิดง่ายขึ้น)
   - INSTANT CLOSE WHEN OFF-SCREEN: ถ้า dragY >= sheetHeight → ปิดทันที (60ms)
     ไม่ต้องรอ animation 320ms (sheet มองไม่เห็นอยู่แล้ว)
   - BACKDROP OPACITY ลดเร็วขึ้น: opacity ลดจาก 0.4 → 0.55 → backdrop
     หายพอดีตอน sheet ใกล้ off-screen

   ฟีเจอร์:
   ✓ เปิด/ปิดลื่นไหล ไม่กระตุก (transform เท่านั้น + GPU layer + conditional will-change)
   ✓ ล็อค scroll หน้าหลังจริง (touch-action: none บน backdrop)
   ✓ Stack ซ้อนกันได้หลายชั้น — ปิดอันบน อันล่างยังอยู่
   ✓ รองรับ back button / ESC / แตะ backdrop ปิด
   ✓ Patch mode — อัพเดต content โดยไม่ re-animate
   ✓ z-index จัดการอัตโนมัติ ตามลำดับ stack
   ✓ Auto-cleanup เมื่อ navigate หน้าใหม่ (via closeAllSheets)
   ✓ Footer slot — ปุ่ม action ล็อคที่ด้านล่าง sheet, พื้นหลังเต็มความกว้าง
   ✓ Drag-to-dismiss ลากได้ทุกที่ใน sheet (handle/header/body/footer)
   ✓ Scroll-lock ระหว่าง drag — เนื้อหาล็อคชั่วคราว ปล่อยนิ้วแล้วค่อย scroll
   ✓ Velocity-based dismiss — fling ปิดได้ง่ายกว่า drag ปกติ (แต่ไม่ง่ายเกิน)
   ✓ Smooth close animation — sheet slide down ต่อเนื่องจากตำแหน่งที่ปล่อยนิ้ว
   ✓ Spring snap-back — cubic-bezier overshoot แบบ iOS native
   ✓ Premium open animation — spring bounce (overshoot เล็กน้อย ไม่มี scaleY stretch)
   ✓ Popup mode (≥768px) — centered modal บน desktop, ปิด drag-to-dismiss

   v5 ANTI-STUTTER TECHNIQUES (vs. v1):
   1. rAF COALESCING — pointermove หลายครั้งใน 1 frame ถูก batch เป็น
      update เดียว ลดงาน main thread ลง 50%+ บนจอ 120Hz
   2. DIRECT INLINE TRANSFORM — ใช้ `sheet.style.transform = translate3d(...)`
      แทน CSS variable (--sheet-drag-y) กัน style recalc cascade ไปยัง
      descendants ทั้งหมดใน sheet (สาเหตุหลักของกระตุกเมื่อ body มีเนื้อหาเยอะ)
   3. CACHED LAYOUT READS — อ่าน sheet.offsetHeight/maxDrag ครั้งเดียวใน
      pointerdown ไม่อ่านใน pointermove → กัน layout thrashing
   4. DIRECT OPACITY — `backdrop.style.opacity = ...` แทน CSS variable
      (--backdrop-drag-opacity) กัน cascade ไปยัง sheet
   5. VELOCITY TRACKING (2 samples) — คำนวณ velocity จาก 2 samples ล่าสุด
      ใช้ตัดสินใจ fling vs. drag → dismiss ง่ายขึ้นเมื่อ fling
   6. CONDITIONAL will-change — เปิดเฉพาะตอน drag/animation ผ่าน class
      ไม่เปิดค้าง → ประหยัด GPU memory
   7. SMOOTH CLOSE-FROM-DRAG — sheet slide down ต่อจากตำแหน่งปล่อยนิ้ว
      ไม่กระโดดกลับ 0 ก่อนแอนิเมต
   8. POINTER CAPTURE POST-ACTIVATION — capture pointer หลัง activation
      เท่านั้น (ไม่ใช่ pointerdown) เพื่อให้ tap บน input/button ยังทำงาน
   9. LOW ACTIVATION THRESHOLD (1px) — sheet ขยับทันทีที่ลาก ไม่มีอาการ
      "วางนิ้วค้าง"
  10. TOUCH INTERCEPTION — non-passive touchmove + preventDefault กัน browser
      claim gesture สำหรับ native scroll/pull-to-refresh

   ใช้งาน:
     import { openBottomSheet } from './framework/bottom-sheet.js';
     const sheet = openBottomSheet({ title: '...', body: el, footer: actionsEl });
     sheet.patch(newContent);  // อัพเดตโดยไม่ re-animate
     sheet.close();            // ปิด
   ═══════════════════════════════════════════════════════════════ */

import { lockScroll, unlockScroll } from './scroll-lock.js';
import { registerSheet, closeSheet, closeAllSheets, removeFromStack } from './history-manager.js';

const SHEET_BASE_Z = 18000; // ตรงกับ var(--yp-z-modal) ใน tokens.css
let _sheetCount = 0;
let _openSheetCount = 0;

// ═══════════════════════════════════════════════════════════════
// MODE DETECTION — แยกพฤติกรรมระหว่าง "bottom sheet" (mobile)
// กับ "popup / centered modal" (desktop, ≥768px)
// ═══════════════════════════════════════════════════════════════
//
// เมื่ออยู่ใน popup mode:
// - ปิด drag-to-dismiss (sheet เป็น centered modal ไม่ใช่ bottom sheet)
// - ไม่ซ่อน bottom-nav (desktop ใช้ left-rail sidebar ที่ไม่บัง sheet)
// - sheet-backdrop มี z-index สูงกว่า nav เพื่อให้ overlay ทับ sidebar ได้
const POPUP_MODE_MQ = '(min-width: 768px)';

/** ตรวจสอบว่าปัจจุบันอยู่ใน popup mode (desktop) หรือไม่ */
function _isPopupMode() {
  return window.matchMedia(POPUP_MODE_MQ).matches;
}

// ── Drag-to-dismiss tuning constants (v5.2 — FULL-FOLLOW DRAG) ──
const DRAG = {
  // เริ่ม track gesture เมื่อเลื่อนเกิน 1px (ต่ำมากเพื่อตอบสนองทันที
  // ไม่มีอาการ "วางนิ้วค้าง" — ลากลงปั๊บ sheet ขยับเลย)
  ACTIVATION_THRESHOLD: 1,
  // ── NO DAMPING — sheet ตามนิ้ว 1:1 ลงไปจนกว่าจะ off-screen ──
  // v5.0 มี damping (MAX_DAMPING: 0.4) → sheet หยุดที่ ~60% ของ finger travel
  //     → user รู้สึกว่า "เลื่อนไปถึงจุดปิดแล้วมันหยุด" ไม่ตามนิ้วจนสุด
  // v5.2 ลบ damping ออก → sheet ติดตามนิ้ว 1:1 ลงไปจน off-screen เลย
  //     → user เลื่อนได้จนสุดจริง ๆ ปล่อยนิ้วปุ๊บ animation ปิดต่อ
  // (คงไว้เฉพาะ "edge resistance" บาง ๆ ตอนเลย sheetHeight แล้ว
  //  เพื่อให้ sensation เหมือน drag ผ่านขอบ ไม่ใช่ drag ฟรี ๆ)
  EDGE_RESISTANCE: 0.35,   // เลย sheetHeight แล้ว sheet ตามแค่ 35% ของส่วนเกิน
  // Threshold สำหรับ drag ปกติ — 28% ของ sheet height
  // (ลดจาก 45% → "พอดีเหมาะสม" ไม่เยอะเกิน ไม่น้อยเกิน
  //  ประมาณ 1/4 ของ sheet ก็พอปิดแล้ว ไม่ต้องลากถึงครึ่ง)
  DRAG_CLOSE_RATIO: 0.28,
  // Threshold สำหรับ fling — velocity > 500px/s ถือว่า fling
  // (ลดจาก 600 → fling ปิดง่ายขึ้นนิดหน่อย)
  FLING_VELOCITY: 500,
  // ถ้า fling และ drag ลงเกิน 10% ของ sheet height → close
  // (ลดจาก 15% → fling ปิดง่ายกว่า drag ปกติ ตามหลัก iOS native)
  FLING_CLOSE_RATIO: 0.10,
};

/**
 * เปิด bottom sheet ใหม่
 *
 * @param {object} opts
 * @param {string} opts.title - หัวข้อ
 * @param {Node|string} opts.body - เนื้อหา (Element หรือ HTML string)
 * @param {Node|string} [opts.footer] - เนื้อหาส่วน footer
 * @param {function} [opts.onClose] - เรียกเมื่อปิด
 * @param {boolean} [opts.dismissable=true] - ปิดได้ด้วย backdrop/ESC/back
 * @param {string} [opts.size] - 'auto' | 'tall' | 'full'
 * @returns {object} sheet handle
 */
export function openBottomSheet(opts = {}) {
  const {
    title = '',
    body = '',
    footer = null,
    onClose,
    dismissable = true,
    size = 'auto'
  } = opts;

  _sheetCount++;
  _openSheetCount++;
  document.body.classList.add('yp-sheet-open');
  const z = SHEET_BASE_Z + _sheetCount * 10;

  // ── ตรวจหา popup mode ตอนเปิด sheet ──
  // popup mode (≥768px) = sheet แสดงเป็น centered modal (desktop)
  // ใน mode นี้: ปิด drag-to-dismiss + ไม่ซ่อน bottom-nav + backdrop สูงกว่า nav
  const popupMode = _isPopupMode();
  if (popupMode) {
    document.body.classList.add('yp-sheet-popup');
  }

  // ── สร้าง DOM ──
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.style.setProperty('--sheet-z', z);
  backdrop.dataset.sheetZ = z;

  const sheet = document.createElement('div');
  sheet.className = `sheet sheet--${size}`;
  if (footer) sheet.classList.add('has-footer');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  if (title) sheet.setAttribute('aria-label', title);

  sheet.innerHTML = `
    <div class="sheet__handle" aria-hidden="true"></div>
    <div class="sheet__header">
      <h2 class="sheet__title"></h2>
      ${dismissable ? `<button class="sheet__close" type="button" aria-label="ปิด" data-sheet-close></button>` : ''}
    </div>
    <div class="sheet__body" data-scrollable="true"></div>
    ${footer ? `<div class="sheet__footer" data-sheet-footer></div>` : ''}
  `;

  // Title
  if (title) {
    sheet.querySelector('.sheet__title').textContent = title;
  } else {
    sheet.querySelector('.sheet__header').style.display = 'none';
  }

  // Close icon
  const closeBtn = sheet.querySelector('[data-sheet-close]');
  if (closeBtn) {
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
  }

  // Body content
  const bodyEl = sheet.querySelector('.sheet__body');
  _setBody(bodyEl, body);

  // Footer content (optional)
  const footerEl = footer ? sheet.querySelector('[data-sheet-footer]') : null;
  if (footerEl) _setBody(footerEl, footer);

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);

  // Lock scroll ของหน้าหลัก
  lockScroll();

  // ลงทะเบียน sheet กับ history manager
  let _closed = false;
  let _dragClosing = false; // true = close จาก drag-to-dismiss (animation จัดการเองแล้ว)
  const historyHandle = registerSheet(() => {
    _doClose();
  });

  // ═══════════════════════════════════════════════════════════════
  // ANIMATION เปิด (premium spring bounce — pure translateY)
  // ═══════════════════════════════════════════════════════════════
  //
  // ใช้ keyframe animation แทน transition:
  // - 0%   : sheet อยู่ด้านล่าง (translateY 100%)
  // - 55%  : overshoot เล็กน้อยเหนือตำแหน่งปลาย (translateY -12px)
  // - 100% : กลับสู่ตำแหน่งปลาย (translateY 0)
  //
  // ไม่มี scaleY stretch — sheet ยังเด้งขึ้นนิดหน่อย (overshoot) แต่ไม่ stretch
  //
  // ใช้ double rAF เพื่อให้ browser paint สถานะเริ่มต้นก่อน
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open');
      sheet.classList.add('is-open');
      sheet.classList.add('is-opening');

      // ลบ .is-opening หลัง animation จบ — is-open จัดการสถานะปลาย
      const _onOpenAnimEnd = (e) => {
        if (e.target !== sheet || e.animationName !== 'sheet-open-bounce') return;
        sheet.classList.remove('is-opening');
        sheet.removeEventListener('animationend', _onOpenAnimEnd);
      };
      sheet.addEventListener('animationend', _onOpenAnimEnd);
      // Fallback (กัน animationend ไม่ fire)
      setTimeout(() => {
        sheet.classList.remove('is-opening');
      }, 600);
    });
  });

  // ── Event handlers ──
  if (dismissable) {
    // แตะ backdrop ปิด (แต่ไม่ใช่ตัว sheet เอง)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        e.stopPropagation();
        close();
      }
    });

    // ปุ่ม X ปิด
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    // กัน touch บน backdrop (touch-action: none จะถูกตั้งใน CSS)
    backdrop.addEventListener('touchmove', (e) => {
      if (e.target === backdrop) e.preventDefault();
    }, { passive: false });
  }

  // Sheet กัน click ทะลุไป backdrop
  sheet.addEventListener('click', (e) => e.stopPropagation());

  // ═══════════════════════════════════════════════════════════════
  // DRAG-TO-DISMISS (iOS-native quality, v5 — rAF coalesced)
  // ═══════════════════════════════════════════════════════════════
  //
  // การปรับปรุงจาก v1:
  // 1. rAF COALESCING — pointermove หลายครั้งใน 1 frame ถูก batch
  //    เป็น update เดียว ลดงาน main thread ลงมาก บนจอ 120Hz
  //    (ไม่ใช่ throttle — rAF จะเลือก latest event เสมอ ไม่ skip)
  // 2. แคช sheetHeight/maxDrag ตอน pointerdown → ไม่ต้องอ่าน layout ทุก move
  //    (กัน layout thrashing ซึ่งเป็นสาเหตุหลักของอาการกระตุก)
  // 3. threshold ลดจาก 4px → 1px → sheet ขยับทันทีที่ลาก ไม่มี "วางนิ้วค้าง"
  // 4. velocity tracking แบบ 2 samples (prev + last) แทน array
  //    → ลด GC pressure + คำนวณเร็วขึ้น
  // 5. DIRECT INLINE TRANSFORM แทน CSS variable
  //    → กัน style recalc cascade ไปยัง descendants ทั้งหมดใน sheet
  // 6. setProperty เรียกครั้งเดียวต่อ frame (batch ในตัวแปร)
  //
  // พฤติกรรม:
  // 1. ลากได้ทุกที่ใน sheet — handle, header, body, footer
  // 2. เมื่อเริ่ม drag ลง (dy > 0) → ล็อค native scroll ทันที (.is-scroll-locked)
  //    เนื้อหา body จะล็อคชั่วคราว แม้ user เลื่อนขึ้นกลับ body ยังล็อค
  //    จนกว่า user จะยกนิ้ว → ค่อยคืน scroll
  // 3. Sheet ติดตามนิ้วลง (translateY) มี damping เล็กน้อยเมื่อ drag ไกล
  // 4. ปล่อยนิ้ว:
  //    - ถ้า velocity > FLING_VELOCITY และ drag ลงเกิน FLING_CLOSE_RATIO → close
  //    - ถ้า drag ลงเกิน DRAG_CLOSE_RATIO → close
  //    - ไม่งั้น → snap กลับด้วย spring animation
  // 5. Close = sheet slide down ต่อจากตำแหน่งปล่อยนิ้ว (smooth, ไม่หายปั๊บ)
  //
  // POPUP MODE (≥768px desktop): ปิด drag-to-dismiss ทั้งหมด
  // เพราะ sheet แสดงเป็น centered modal ไม่ใช่ bottom sheet
  // → user ปิดผ่านปุ่ม X, ESC, หรือแตะ backdrop เท่านั้น
  // ═══════════════════════════════════════════════════════════════
  if (dismissable && !popupMode) {
    let _dragState = null; // null = idle, object = active drag
    let _rafId = null;     // rAF id สำหรับ coalesce pointermove

    const _onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // ── NOTE: ไม่กรองด้วย tag แล้ว — drag ได้จากทุกที่ใน sheet ──
      // รวมถึง input/textarea/button/a/select/contenteditable
      //
      // การแยก "tap vs drag":
      // - Tap (pointerdown → pointerup โดยไม่ active) → ไม่ capture pointer
      //   → click/focus event ของ input/button ยังทำงานปกติ
      // - Drag (dy > threshold && startedAtTop) → activate + capture ที่หลัง
      //   → sheet ติดตามนิ้ว และ blur active element เพื่อปิด keyboard
      //
      // ดังนั้นจึงไม่ต้องเช็ค tag ใน pointerdown — แค่เก็บ state
      // แล้วรอดูการเคลื่อนที่ใน pointermove

      // ถ้า opening animation กำลังเล่น → หยุดทันที (ให้ drag ทำงานได้)
      if (sheet.classList.contains('is-opening')) {
        sheet.classList.remove('is-opening');
      }

      // ── แคช layout reads ตอนนี้ (กัน layout thrashing ตอน move) ──
      // อ่านครั้งเดียว เก็บไว้ใช้ทั้ง gesture
      const sheetHeight = sheet.offsetHeight;
      const startScrollTop = bodyEl.scrollTop;

      _dragState = {
        startY: e.clientY,
        startX: e.clientX,
        startScrollTop,
        startedAtTop: startScrollTop === 0,
        pointerId: e.pointerId,
        dragY: 0,
        active: false,
        // แคชค่าที่ใช้บ่อย — กัน forced layout ใน pointermove
        sheetHeight,
        // v5.2: ไม่ใช้ maxDrag อีกแล้ว (ลบ damping) แต่เก็บไว้เผื่อ backward-compat
        maxDrag: sheetHeight,
        // velocity tracking แบบ 2 samples (prev + last) — เบากว่า array
        prevMove: null,
        lastMove: { y: e.clientY, t: performance.now() },
        // เก็บ latest pointermove ไว้ให้ rAF callback ใช้ (coalescing)
        pendingY: e.clientY,
      };
      // NOTE: ยังไม่ setPointerCapture ที่นี่ — รอก่อนจนกว่า drag จะ active
      // เพื่อให้ tap บน input/button ยังได้รับ click/focus event ปกติ
    };

    // ── Touch interception — ป้องกัน browser claim gesture ──
    // ต้องเป็น non-passive ({ passive: false }) ไม่งั้น preventDefault ไม่ทำงาน
    const _onTouchMove = (e) => {
      if (!_dragState) return;
      // ถ้า multi-touch → ปล่อยให้ native จัดการ (zoom ฯลฯ)
      if (e.touches.length > 1) {
        if (_dragState.active) {
          _resetDragState();
        }
        return;
      }
      const touch = e.touches[0];
      const dy = touch.clientY - _dragState.startY;

      // เงื่อนไข drag-to-dismiss:
      // - startedAtTop (body อยู่ top ตอนเริ่ม) และ dy > 0 (ลากลง)
      // - หรือ active แล้ว (เคย active ใน gesture นี้) — ป้องกันกลับมา scroll
      if (_dragState.startedAtTop && dy > 0) {
        e.preventDefault();
        return;
      }
      // ถ้า active แล้ว → ยัง preventDefault ต่อ (ป้องกัน scroll ตอนเลื่อนกลับขึ้น)
      if (_dragState.active) {
        e.preventDefault();
      }
    };

    const _onPointerMove = (e) => {
      if (!_dragState || e.pointerId !== _dragState.pointerId) return;
      // เก็บ latest Y ไว้ให้ rAF callback ใช้ (coalesce หลาย moves เป็น 1 frame)
      _dragState.pendingY = e.clientY;

      // ── Schedule rAF ถ้ายังไม่มี pending frame ──
      // rAF จะรอจนถึง next frame แล้วเรียก callback 1 ครั้ง
      // → ถ้า pointermove ยิง 3 ครั้งใน 1 frame เรา apply แค่ครั้งสุดท้าย
      // → ลดงาน style+layout+paint ลง 3 เท่า
      if (_rafId) return;
      _rafId = requestAnimationFrame(_applyDrag);
    };

    // ── rAF callback — apply drag ครั้งเดียวต่อ frame ──
    // ถูกเรียกโดย rAF หลังจาก pointermove เกิดขึ้น (อาจหลายครั้ง)
    const _applyDrag = () => {
      _rafId = null;
      if (!_dragState) return;

      const e = { clientY: _dragState.pendingY };
      const dy = e.clientY - _dragState.startY;

      // ── ถ้าเป็น drag-to-dismiss candidate (startedAtTop && dy > 0) ──
      if (_dragState.startedAtTop && dy > 0) {
        // threshold ต่ำ (1px) — sheet ขยับทันทีที่ลาก
        if (!_dragState.active && dy < DRAG.ACTIVATION_THRESHOLD) return;

        // Activate drag — ล็อค native scroll ทันที
        if (!_dragState.active) {
          _dragState.active = true;
          // ── NOW capture pointer (หลัง activation) ──
          // ทำหลังจากที่รู้แน่ ๆ ว่าเป็น drag ไม่ใช่ tap เพื่อไม่ให้
          // ไปกวน click/focus event ของ input/button ที่ user อาจ tap อยู่
          try { sheet.setPointerCapture(_dragState.pointerId); } catch (_) {}
          sheet.classList.add('is-dragging');
          sheet.classList.add('is-scroll-locked');
          sheet.classList.remove('is-animating');
          // ── Blur active element เพื่อปิด on-screen keyboard ──
          // ถ้า user เริ่ม drag จาก input/textarea ที่กำลัง focus อยู่
          // ให้ blur ทันทีเพื่อปิด keyboard ไม่งั้น keyboard จะบัง sheet
          const active = document.activeElement;
          if (active && active !== document.body && typeof active.blur === 'function') {
            try { active.blur(); } catch (_) {}
          }
        }

        // ── velocity tracking (2 samples) ──
        _dragState.prevMove = _dragState.lastMove;
        _dragState.lastMove = { y: e.clientY, t: performance.now() };

        // ── ใช้ค่าแคชจาก pointerdown (ไม่อ่าน layout ซ้ำ) ──
        const sheetHeight = _dragState.sheetHeight;

        // ── v5.2: FULL-FOLLOW DRAG (no damping) ──
        // Sheet ติดตามนิ้ว 1:1 ลงไปเลย — จนกว่าจะ off-screen
        // ถ้า dy เกิน sheetHeight (เลย off-screen ไปแล้ว) → ใส่ edge resistance
        // เพื่อให้ sensation เหมือน drag ผ่านขอบ ไม่ใช่ drag ฟรี ๆ ไม่สิ้นสุด
        //
        // v5.0 (เดิม): dampingProgress + resistance 0.4 → sheet หยุดที่ 60% ของ finger
        // v5.2 (ใหม่): 1:1 follow + edge resistance เลย sheetHeight → sheet ลงได้จนสุด
        let dragY;
        if (dy <= sheetHeight) {
          // ── ยังไม่เลย sheetHeight: 1:1 follow ──
          dragY = dy;
        } else {
          // ── เลย sheetHeight ไปแล้ว: edge resistance ส่วนเกิน ──
          // ส่วนแรก (sheetHeight) = 1:1, ส่วนเกิน = EDGE_RESISTANCE (35%)
          // ให้ sensation เหมือน sheet "ยืด" ผ่านขอบล่างของจอ
          const overshoot = dy - sheetHeight;
          dragY = sheetHeight + overshoot * DRAG.EDGE_RESISTANCE;
        }
        _dragState.dragY = dragY;

        // set transform ตรง ๆ (inline) แทนการใช้ CSS variable
        // เหตุผล: CSS variable ถูก inherited โดย descendants ทั้งหมด
        // → browser ต้อง style recalc ทุก element ใน sheet ทุก pointermove
        // → กระตุกมากเมื่อ body มีเนื้อหาเยอะ ๆ
        // direct transform มีผลเฉพาะ sheet element เดียว → style recalc น้อยกว่า
        sheet.style.transform = 'translate3d(0, ' + dragY + 'px, 0)';

        // Backdrop ลด opacity ตาม drag distance — ใช้ style.opacity ตรง ๆ
        // (ไม่ใช่ CSS variable เพื่อกัน cascade ไปยัง sheet)
        // v5.2: opacity ลดเร็วขึ้นเมื่อ drag ลง (ใช้ sheetHeight แทน maxDrag*0.6)
        // → backdrop หายพอดีตอน sheet ใกล้ off-screen
        const dragProgress = Math.min(dragY / sheetHeight, 1);
        backdrop.style.opacity = (1 - dragProgress * 0.55).toString();
        return;
      }

      // ── ถ้า active แล้ว แต่ dy กลับไป <= 0 (เลื่อนกลับขึ้น) ──
      // → sheet ยังล็อคอยู่ ตามนิ้วขึ้น (แต่ไม่เกิน 0)
      if (_dragState.active && dy <= 0) {
        // Track velocity สำหรับการเลื่อนขึ้นด้วย
        _dragState.prevMove = _dragState.lastMove;
        _dragState.lastMove = { y: e.clientY, t: performance.now() };

        // Sheet ตามนิ้วขึ้น แต่ clamp ที่ 0 (ไม่ลอยขึ้นเหนือตำแหน่งเดิม)
        // เคลียร์ inline transform → CSS rule .is-dragging + .is-open จัดการ
        // (translate3d(0,0,0) = ตำแหน่งเดิม)
        _dragState.dragY = 0;
        sheet.style.transform = '';
        backdrop.style.opacity = '';
        return;
      }

      // ── กรณีอื่น: drag ขึ้นเพื่อ scroll body (เริ่มจาก top) หรือ scroll จากกลาง ──
      // ถ้า active อยู่ → reset (กลับสู่ native scroll mode)
      if (_dragState.active) {
        _resetDragState();
      }
    };

    const _onPointerUp = (e) => {
      if (!_dragState || e.pointerId !== _dragState.pointerId) return;
      // ── Cancel pending rAF ก่อน (กัน apply หลัง reset) ──
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      const state = _dragState;
      _dragState = null;
      try { sheet.releasePointerCapture(e.pointerId); } catch (_) {}

      // ปลด scroll lock เสมอเมื่อยกนิ้ว (body กลับมา scroll ได้)
      sheet.classList.remove('is-scroll-locked');

      if (!state.active) return;

      // ── คำนวณ velocity (px/s) จาก 2 samples ล่าสุด ──
      let velocity = 0;
      if (state.prevMove && state.lastMove) {
        const dt = state.lastMove.t - state.prevMove.t;
        if (dt > 0) {
          const dy = state.lastMove.y - state.prevMove.y;
          velocity = dy / (dt / 1000); // px/s
        }
      }

      const sheetHeight = state.sheetHeight;
      const dragThreshold = sheetHeight * DRAG.DRAG_CLOSE_RATIO;
      const flingThreshold = sheetHeight * DRAG.FLING_CLOSE_RATIO;
      const isFlingDown = velocity > DRAG.FLING_VELOCITY;

      // ตัดสินใจ: close หรือ snap-back
      const shouldClose =
        state.dragY > dragThreshold ||
        (isFlingDown && state.dragY > flingThreshold);

      sheet.classList.remove('is-dragging');

      if (shouldClose) {
        // ── v5.2: Close — sheet slide ลงต่อจากตำแหน่งปล่อยนิ้ว ──
        //
        // กรณี A: dragY >= sheetHeight (sheet อยู่ off-screen แล้ว — edge resistance
        //         ทำให้ sheet เลย sheetHeight ไปได้)
        //         → ปิดทันที ไม่ต้อง animate (sheet มองไม่เห็นอยู่แล้ว)
        //         → ลด setTimeout จาก 340ms → 60ms (กัน visual pop)
        //
        // กรณี B: dragY < sheetHeight (sheet ยังมองเห็นอยู่)
        //         → animate จาก dragY ปัจจุบัน → sheetHeight (off-screen)
        //         → ใช้ .is-animating (transition 320ms cubic-bezier spring)
        //         → setTimeout 340ms แล้ว close() จริง ๆ (ลบ DOM + cleanup)
        const alreadyOffScreen = state.dragY >= sheetHeight;

        sheet.classList.add('is-animating');

        if (alreadyOffScreen) {
          // ── Sheet อยู่ off-screen แล้ว — ปิดทันที (กัน visual pop) ──
          // ตั้ง transform เป็น sheetHeight ทันที (ไม่ต้องรอ rAF เพราะ sheet มองไม่เห็น)
          sheet.style.transform = 'translate3d(0, ' + sheetHeight + 'px, 0)';
          _dragClosing = true;
          setTimeout(() => close(), 60);
        } else {
          // ── Sheet ยังมองเห็น — animate ลงไป off-screen ──
          // ใช้ rAF เดียวเพื่อให้ browser ได้เห็น .is-animating class ก่อน
          // แล้วค่อยเปลี่ยน inline transform → transition ทำงาน
          requestAnimationFrame(() => {
            sheet.style.transform = 'translate3d(0, ' + sheetHeight + 'px, 0)';
            _dragClosing = true;
            setTimeout(() => close(), 340);
          });
        }
      } else {
        // ── Snap-back: smooth spring animation กลับไป 0 ──
        // ใช้ rAF เพื่อให้ browser เห็น .is-animating (transition: spring)
        // ก่อน แล้วค่อยเคลียร์ inline transform → CSS rule .is-open จัดการ
        // (transform เปลี่ยนจาก inline translate3d(0, dragY, 0) → CSS translate3d(0, 0, 0))
        sheet.classList.add('is-animating');
        requestAnimationFrame(() => {
          sheet.style.transform = '';
          backdrop.style.opacity = '';
        });
        // ลบ .is-animating หลัง transition จบ
        const _onSnapEnd = (ev) => {
          if (ev.target !== sheet || ev.propertyName !== 'transform') return;
          sheet.classList.remove('is-animating');
          sheet.removeEventListener('transitionend', _onSnapEnd);
        };
        sheet.addEventListener('transitionend', _onSnapEnd);
        // Fallback ถ้า transitionend ไม่ fire
        setTimeout(() => {
          sheet.classList.remove('is-animating');
        }, 400);
      }
    };

    const _onPointerCancel = (e) => {
      if (!_dragState || e.pointerId !== _dragState.pointerId) return;
      _resetDragState();
    };

    // ── Helper: reset drag state (snap back to 0 ทันที ไม่มี animation) ──
    function _resetDragState() {
      if (!_dragState) return;
      // Cancel pending rAF ก่อน
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      const wasActive = _dragState.active;
      _dragState = null;
      if (wasActive) {
        sheet.classList.remove('is-dragging');
        sheet.classList.remove('is-scroll-locked');
        // เคลียร์ inline transform → CSS rule .is-open จัดการ (translate3d(0,0,0))
        sheet.style.transform = '';
        backdrop.style.opacity = '';
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ลงทะเบียน listeners บน "sheet" ทั้งใบ — drag ได้ทุกที่
    // (handle, header, body, footer — ทุกส่วน)
    // ═══════════════════════════════════════════════════════════════
    sheet.addEventListener('pointerdown', _onPointerDown);
    sheet.addEventListener('pointermove', _onPointerMove);
    sheet.addEventListener('pointerup', _onPointerUp);
    sheet.addEventListener('pointercancel', _onPointerCancel);

    // CRITICAL: non-passive touchmove บน sheet ทั้งใบ
    // ต้องใช้ { passive: false } ไม่งั้น e.preventDefault() จะไม่ทำงาน
    sheet.addEventListener('touchmove', _onTouchMove, { passive: false });
  }
  // ═══════════════════════════════════════════════════════════════

  /* ── Methods ── */
  function close({ skipHistory = false } = {}) {
    if (_closed) return;
    if (skipHistory) {
      removeFromStack(historyHandle);
      _doClose();
    } else {
      closeSheet(historyHandle);
    }
  }

  function _doClose() {
    if (_closed) return;
    _closed = true;

    sheet.classList.remove('is-scroll-locked');
    sheet.classList.remove('is-opening');

    // ถ้า close จาก drag-to-dismiss → animation ทำงานแล้ว (sheet อยู่ off-screen)
    // แค่ remove DOM + cleanup ไม่ต้อง trigger animation ใหม่
    if (_dragClosing) {
      // sheet อยู่ในสถานะ .is-animating และ inline transform = translate3d(0, sheetHeight, 0) (off-screen)
      sheet.classList.remove('is-animating');
      // cleanup ทันที — sheet อยู่ off-screen แล้ว user ไม่เห็นการ remove
      backdrop.remove();
      unlockScroll();
      _openSheetCount = Math.max(0, _openSheetCount - 1);
      if (_openSheetCount === 0) {
        document.body.classList.remove('yp-sheet-open');
        document.body.classList.remove('yp-sheet-popup');
      }
      onClose?.();
      return;
    }

    // ── ปกติ: close จาก backdrop click, X button, ESC, history.back ──
    // ใช้ .is-animating สำหรับ smooth spring easing ตอนปิด
    sheet.classList.add('is-animating');
    sheet.classList.remove('is-dragging');
    // เคลียร์ inline transform (ถ้ามีจาก drag ก่อนหน้า) เพื่อให้ CSS rule จัดการ
    sheet.style.transform = '';
    backdrop.style.opacity = '';

    // Trigger close animation — sheet จะ slide ลงไป translate3d(0, 100%, 0)
    // ใช้ double rAF เพื่อให้ browser เห็นตำแหน่งเริ่มต้นก่อน → smooth transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.remove('is-open');
        sheet.classList.remove('is-open');
      });
    });

    // หลัง animation เส็จ → remove DOM + unlock scroll
    const cleanup = () => {
      backdrop.remove();
      unlockScroll();
      _openSheetCount = Math.max(0, _openSheetCount - 1);
      if (_openSheetCount === 0) {
        document.body.classList.remove('yp-sheet-open');
        document.body.classList.remove('yp-sheet-popup');
      }
      onClose?.();
    };

    let _done = false;
    const finishOnce = () => {
      if (_done) return;
      _done = true;
      cleanup();
    };

    // ตรวจสอบ target + propertyName กัน false trigger จาก child transitions
    const _onCloseEnd = (e) => {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      sheet.removeEventListener('transitionend', _onCloseEnd);
      finishOnce();
    };
    sheet.addEventListener('transitionend', _onCloseEnd);
    // Fallback timeout (match spring duration ~320ms + buffer for 2 rAF frames)
    setTimeout(finishOnce, 500);
  }

  /**
   * อัพเดตเนื้อหาโดยไม่ re-animate (patch mode)
   */
  function patch(newBody) {
    _setBody(bodyEl, newBody);
  }

  /**
   * อัพเดต title โดยไม่ re-animate
   */
  function setTitle(newTitle) {
    const titleEl = sheet.querySelector('.sheet__title');
    if (newTitle) {
      titleEl.textContent = newTitle;
      sheet.querySelector('.sheet__header').style.display = '';
      sheet.setAttribute('aria-label', newTitle);
    } else {
      titleEl.textContent = '';
      sheet.querySelector('.sheet__header').style.display = 'none';
    }
  }

  return {
    close,
    patch,
    setTitle,
    bodyEl,
    footerEl,
    backdrop,
    sheet,
    get closed() { return _closed; }
  };
}

/* ── Helpers ── */
function _setBody(targetEl, content) {
  if (typeof content === 'string') {
    targetEl.innerHTML = content;
  } else if (content instanceof Node) {
    targetEl.innerHTML = '';
    targetEl.appendChild(content);
  } else if (Array.isArray(content)) {
    targetEl.innerHTML = '';
    content.forEach(node => targetEl.appendChild(node));
  }
}

/**
 * ปิด sheet ทั้งหมด — เรียกเมื่อ navigate หน้าใหม่
 */
export function closeAllOpenSheets() {
  closeAllSheets();
}

/**
 * ใช้สำหรับ legacy compatibility — wrap เป็น promise สำหรับ confirm dialog
 */
export function openConfirmSheet(opts) {
  return new Promise((resolve) => {
    const body = document.createElement('div');
    body.innerHTML = `<p class="sheet__message"></p>`;
    body.querySelector('.sheet__message').textContent = opts.message || '';

    const footer = document.createElement('div');
    footer.className = 'sheet__actions';
    footer.innerHTML = `
      <button class="btn btn--ghost btn--block" data-action="cancel"></button>
      <button class="btn btn--block" data-action="confirm"></button>
    `;
    footer.querySelector('[data-action="cancel"]').textContent = opts.cancelText || 'ยกเลิก';
    const confirmBtn = footer.querySelector('[data-action="confirm"]');
    confirmBtn.textContent = opts.confirmText || 'ยืนยัน';
    if (opts.danger) {
      confirmBtn.classList.add('btn--danger');
    } else {
      confirmBtn.classList.add('btn--primary');
    }

    const sheet = openBottomSheet({
      title: opts.title || '',
      body,
      footer,
      onClose: () => resolve(false)
    });

    footer.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      sheet.close();
      resolve(false);
    });
    footer.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      sheet.close();
      resolve(true);
    });
  });
}
