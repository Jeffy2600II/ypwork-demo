/* ═══════════════════════════════════════════════════════════════
   YP WORK · FRAMEWORK/HISTORY-MANAGER
   assets/js/framework/history-manager.js
   ────────────────────────────────────────────────────────────────
   จัดการ history stack ของ bottom sheet/modal

   ปัญหาที่แก้:
   - กดปุ่ม back ของอุปกรณ์/บราวเซอร์ → ปิด sheet ลำดับบนสุด
   - กด ESC → ปิด sheet ลำดับบนสุด
   - เปิด sheet ซ้อนกัน → ปิดอันบน อันล่างยังอยู่
   - กด back ในหน้า calendar เดือนต่างๆ → ไม่ควร push history ใหม่

   หลักการ:
   - ทุกครั้งที่เปิด sheet → push state ใหม่ด้วย marker `__yp_sheet`
   - popstate มา → เรียก onClose ของ sheet บนสุด (โดยไม่ push state ซ้ำ)
   - ปิด sheet ด้วยปุ่ม/ESC → history.back() (ให้ popstate เกิดขึ้นเอง)
   ═══════════════════════════════════════════════════════════════ */

const SHEET_MARKER = '__yp_sheet';
let _isHandlingPop = false;
let _sheetStack = [];

/**
 * ลงทะเบียน sheet ใหม่ — เก็บ callback และ push history state
 * @returns {object} handle สำหรับใช้ตอนปิด sheet
 */
export function registerSheet(onPop) {
  const handle = {
    id: Date.now() + Math.random(),
    onPop,
    pushedState: false,
    closed: false
  };

  // Push history state เพื่อให้กด back ปิด sheet ได้
  // ใช้ hash + marker เพื่อไม่ให้กระทบ hash router
  if (!_isHandlingPop) {
    try {
      const state = window.history.state || {};
      window.history.pushState(
        { ...state, [SHEET_MARKER]: handle.id },
        '',
        window.location.href
      );
      handle.pushedState = true;
    } catch (e) {
      // บาง browser อาจ throw — ข้ามไป
      console.warn('[history] pushState failed', e);
    }
  }

  _sheetStack.push(handle);
  return handle;
}

/**
 * ยกเลิก sheet — เรียกเมื่อ user กดปุ่มปิด หรือ ESC
 * จะ history.back() เพื่อ trigger popstate ที่เราฟังไว้
 */
export function closeSheet(handle) {
  if (!handle || handle.closed) return;
  if (handle.pushedState && !_isHandlingPop) {
    // ให้ popstate เกิดขึ้นเอง — จะได้เรียก onPop ผ่าน path เดียวกัน
    handle.pushedState = false; // กัน double-close
    window.history.back();
  } else {
    // ไม่ได้ push state (หรือกำลัง handle pop อยู่) → เรียก onPop ตรงๆ
    _removeFromStack(handle);
    handle.onPop?.();
  }
}

/* ── Internal ── */
function _removeFromStack(handle) {
  const idx = _sheetStack.indexOf(handle);
  if (idx !== -1) {
    _sheetStack.splice(idx, 1);
  }
  handle.closed = true;
}

function _onPopState() {
  const state = window.history.state || {};
  const topSheet = _sheetStack[_sheetStack.length - 1];

  // ถ้า state ปัจจุบันยังเป็น sheet state → แปลว่ายังมี sheet เปิดอยู่
  // ไม่ต้องทำอะไร
  if (state[SHEET_MARKER]) return;

  // ถ้ามี sheet อยู่บนสุด และ state ปัจจุบันไม่ใช่ sheet state → แปลว่า user กด back
  if (topSheet) {
    _isHandlingPop = true;
    _removeFromStack(topSheet);
    try {
      topSheet.onPop?.();
    } finally {
      _isHandlingPop = false;
    }
  }
}

/* ── ESC handler — ปิด sheet บนสุด ── */
function _onKeyDown(e) {
  if (e.key !== 'Escape') return;
  const topSheet = _sheetStack[_sheetStack.length - 1];
  if (!topSheet) return;
  e.preventDefault();
  e.stopPropagation();
  closeSheet(topSheet);
}

/* ── Init ── */
window.addEventListener('popstate', _onPopState);
window.addEventListener('keydown', _onKeyDown, true); // capture phase เพื่อให้ทัน browser default

/**
 * จำนวน sheet ที่เปิดอยู่
 */
export function getOpenSheetCount() {
  return _sheetStack.length;
}

/**
 * ปิด sheet ทั้งหมด — ใช้ตอน navigate หน้าใหม่
 */
export function closeAllSheets() {
  while (_sheetStack.length > 0) {
    const top = _sheetStack.pop();
    top.closed = true;
    top.onPop?.();
  }
}

/**
 * ลบ handle ออกจาก stack โดยไม่เรียก history.back() หรือ onPop
 * ใช้ตอนที่ caller จะ navigate เอง (เช่น form submit แล้วเปลี่ยน hash)
 * — กันไม่ให้ ESC/back ในอนาคตเรียก onPop ซ้ำ
 */
export function removeFromStack(handle) {
  if (!handle || handle.closed) return;
  _removeFromStack(handle);
}
