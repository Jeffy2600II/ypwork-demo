/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/INDEX
   assets/js/views/events/index.js
   ───────────────────────────────────────────────────────────────
   Aggregator สำหรับ events feature — เป็น public API ที่ app.js
   ใช้ ตามหลัก Fantrap: แยก module เล็กแต่ละ feature แล้วรวมผ่าน index

   Re-exports:
   - renderEvents (list) — หน้ารายการงานทั้งหมด
   - renderEventDetail — router เรียกเมื่อ #/event/:id
   - openCreateModal — FAB เรียกเมื่อกด +
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import { renderEvents } from './list.js';
import { renderSingleEventDetail } from './detail-single.js';
import { renderGroupEventDetail } from './detail-group.js';
import { openCreateModal } from './create.js';

export { renderEvents, openCreateModal };

/**
 * Router handler สำหรับ #/event/:id
 * เลือกใช้ single หรือ group renderer ตาม type
 */
export function renderEventDetail(main, params) {
  const id = params[0];
  const ev = store.getEventById(id);
  if (!ev) {
    main.innerHTML = `
      <div class="page container">
        <div class="empty">
          <div class="empty__icon">🔍</div>
          <div class="empty__title">ไม่พบงานนี้</div>
          <button class="btn btn--primary" style="margin-top:12px;" onclick="window.location.hash='#/events'">กลับสู่รายการงาน</button>
        </div>
      </div>
    `;
    return;
  }

  const dept = store.getDepartmentById(ev.departmentId);
  const isGroup = ev.type === 'group';

  if (isGroup) {
    renderGroupEventDetail(main, ev, dept, params);
  } else {
    renderSingleEventDetail(main, ev, dept, params);
  }
}
