/* ═══════════════════════════════════════════════════════════════
   YP WORK · FRAMEWORK/ROUTE-META
   assets/js/framework/route-meta.js
   ────────────────────────────────────────────────────────────────
   ตาราง metadata ของแต่ละ route + ฟังก์ชัน apply ลง shell

   หลักการ:
   - "route" = ชื่อ route ที่ register กับ router (today/calendar/...)
   - แต่ละ route บอกว่าควรแสดงอะไรบ้าง:
     · showNav  — แสดง bottom nav? (เฉพาะหน้า top-level)
     · showFAB  — แสดงปุ่ม +? (เฉพาะหน้าที่สร้างงานได้)
     · activeNav — ไฮไลต์ไอเทมไหนใน bottom nav (null = ไม่ไฮไลต์)
     · title    — ข้อความ title บน top bar
     · showBack — แสดงปุ่มย้อนกลับบน top bar? (auto: true เมื่อ !showNav)
   - เป็น "single source of truth" — เพิ่มหน้าใหม่ก็แค่เติม entry ในนี้

   Fantrove pattern: แยก declaration ออกจาก execution เพื่อให้
   app-shell.js ใช้ตอน mount และใช้ตอน navigate ได้จากที่เดียวกัน
   ═══════════════════════════════════════════════════════════════ */

export const ROUTE_META = {
  today:    { showNav: true,  showFAB: true,  activeNav: 'today',    title: 'หน้าแรก' },
  calendar: { showNav: true,  showFAB: true,  activeNav: 'calendar', title: 'ปฏิทิน' },
  events:   { showNav: true,  showFAB: true,  activeNav: 'events',   title: 'งานทั้งหมด' },
  profile:  { showNav: true,  showFAB: false, activeNav: 'profile',  title: 'โปรไฟล์' },
  event:    { showNav: false, showFAB: false, activeNav: null,       title: 'รายละเอียดงาน' },
  day:      { showNav: false, showFAB: false, activeNav: null,       title: 'งานในวัน' }
};

/**
 * ดึง meta ของ route ที่กำหนด — fallback ปลอดภัย
 * @param {string} routeName
 * @returns {object} meta object (always returns full shape)
 */
export function getRouteMeta(routeName) {
  const fallback = {
    showNav: false,
    showFAB: false,
    activeNav: null,
    title: 'YP Work',
    showBack: true
  };
  const meta = ROUTE_META[routeName] || fallback;
  // showBack auto-derived: ถ้าไม่แสดง bottom nav ก็ให้แสดงปุ่มย้อนกลับ
  // ยกเว้น route ระบุ showBack เองไว้
  return {
    ...meta,
    showBack: meta.showBack ?? !meta.showNav
  };
}

/**
 * Apply meta ลงบน shell elements
 * @param {string} routeName
 * @param {object} shellEls — { title, fab, nav, backBtn }
 * @returns {Promise<void>} resolve หลัง rAF (ให้ CSS transition เริ่มลื่น)
 */
export function applyRouteMeta(routeName, shellEls) {
  return new Promise((resolve) => {
    const meta = getRouteMeta(routeName);

    // Title
    if (shellEls.title) {
      shellEls.title.textContent = meta.title;
    }

    // FAB
    if (shellEls.fab) {
      shellEls.fab.classList.toggle('is-hidden', !meta.showFAB);
    }

    // Bottom nav
    if (shellEls.nav) {
      shellEls.nav.classList.toggle('is-hidden', !meta.showNav);
      // Active state — toggle ในทุก item
      shellEls.nav.querySelectorAll('.bottom-nav__item').forEach(el => {
        el.classList.toggle('is-active', el.dataset.navKey === meta.activeNav);
      });
    }

    // Back button — แสดงเฉพาะหน้าที่ไม่มี bottom nav (หน้า detail)
    if (shellEls.backBtn) {
      shellEls.backBtn.classList.toggle('is-hidden', !meta.showBack);
    }

    // Wait one frame ให้ CSS transition เริ่มลื่นก่อนเรนเดอร์เนื้อหา
    requestAnimationFrame(() => resolve());
  });
}
