/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/DETAIL-SINGLE
   assets/js/views/events/detail-single.js
   ───────────────────────────────────────────────────────────────
   หน้ารายละเอียดงานเดี่ยว
   - แสดงรายละเอียดเต็ม + เปลี่ยนสถานะได้เลยด้วยปุ่ม 3 ตัว
   - ใช้ patch mode: เปลี่ยนสถานะ → อัพเดตเฉพาะส่วน status ไม่ re-render
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import {
  ICON,
  escapeHtml,
  formatDate,
  statusLabel,
  toast
} from '../../core/ui.js';
import { openManageSheet } from './manage.js';

/**
 * @param {HTMLElement} main
 * @param {object} ev — event object
 * @param {object} dept — department object
 * @param {Array} params — router params (unused but kept for API symmetry)
 */
export function renderSingleEventDetail(main, ev, dept, params) {
  // ถ้า main มีเนื้อหาอยู่แล้วและเป็น event เดียวกัน → ใช้ patch แทน re-render
  const existing = main.querySelector(`[data-event-detail="${ev.id}"]`);
  if (existing) {
    patchSingleEventDetail(main, ev, dept);
    return;
  }

  main.innerHTML = `
    <div class="page container" data-event-detail="${ev.id}" style="--accent:${ev.color}">
      <div class="single-hero">
        <div class="single-hero__top">
          <div class="single-hero__icon">${ICON.flag}</div>
          <div class="single-hero__label">งานเดี่ยว</div>
        </div>
        <h1 class="single-hero__title">${escapeHtml(ev.title)}</h1>
        <div class="single-hero__meta">
          <span class="single-hero__meta-item">${ICON.calendar} ${formatDate(ev.date, { long: true })}</span>
          ${ev.time ? `<span class="single-hero__meta-item">${ICON.clock} ${escapeHtml(ev.time)}</span>` : ''}
          ${ev.location ? `<span class="single-hero__meta-item">${ICON.mapPin} ${escapeHtml(ev.location)}</span>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h2 class="detail-section__title">สถานะปัจจุบัน</h2>
        <div class="status-quick" data-status-section data-event-id="${ev.id}">
          ${renderStatusQuick(ev.status)}
        </div>
      </div>

      ${ev.description ? `
        <div class="detail-section">
          <h2 class="detail-section__title">รายละเอียด</h2>
          <div class="detail-desc">${escapeHtml(ev.description)}</div>
        </div>
      ` : ''}

      ${dept ? `
        <div class="detail-section">
          <h2 class="detail-section__title">ฝ่ายที่รับผิดชอบ</h2>
          <div class="single-dept" style="--dept-color:${dept.color}">
            <div class="single-dept__icon">${escapeHtml(dept.icon || '◎')}</div>
            <div class="single-dept__body">
              <div class="single-dept__name">${escapeHtml(dept.name)}</div>
              <div class="single-dept__desc">${escapeHtml(dept.description || '')}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="detail-section">
        <button class="btn btn--secondary btn--block" id="manage-btn" type="button">
          ${ICON.edit} จัดการงาน
        </button>
      </div>
    </div>
  `;

  bindSingleEventDetail(main, ev, dept, params);
}

/* ส่วนของ status quick buttons — แยกไว้เพื่อ reuse ตอน patch */
export function renderStatusQuick(currentStatus) {
  return `
    <button class="status-quick__btn ${currentStatus === 'todo' ? 'is-active is-todo' : ''}" data-set-status="todo" type="button">
      <div class="status-quick__dot is-todo"></div>
      <span>ยังไม่เริ่ม</span>
    </button>
    <button class="status-quick__btn ${currentStatus === 'ongoing' ? 'is-active is-ongoing' : ''}" data-set-status="ongoing" type="button">
      <div class="status-quick__dot is-ongoing"></div>
      <span>กำลังทำ</span>
    </button>
    <button class="status-quick__btn ${currentStatus === 'done' ? 'is-active is-done' : ''}" data-set-status="done" type="button">
      <div class="status-quick__dot is-done"></div>
      <span>เสร็จแล้ว</span>
    </button>
  `;
}

/* Patch mode — อัพเดตเฉพาะส่วน status โดยไม่ re-render ทั้งหน้า */
function patchSingleEventDetail(main, ev, dept) {
  const section = main.querySelector('[data-status-section]');
  if (!section) return;
  section.innerHTML = renderStatusQuick(ev.status);
  bindStatusQuick(main, ev, dept);
}

function bindStatusQuick(main, ev, dept) {
  main.querySelectorAll('[data-set-status]').forEach(el => {
    el.addEventListener('click', () => {
      const newStatus = el.dataset.setStatus;
      store.setEventStatus(ev.id, newStatus);
      toast(`เปลี่ยนสถานะเป็น "${statusLabel(newStatus)}" แล้ว`, 'success');
      // อัพเดตเฉพาะส่วน — ไม่ re-render ทั้งหน้า
      ev.status = newStatus;
      patchSingleEventDetail(main, ev, dept);
    });
  });
}

function bindSingleEventDetail(main, ev, dept, params) {
  bindStatusQuick(main, ev, dept);

  main.querySelector('#manage-btn')?.addEventListener('click', () => {
    openManageSheet(ev, () => {
      // หลังจาก edit/delete → re-render ทั้งหน้า (เพราะอาจมีการเปลี่ยนแปลงหลายอย่าง)
      const updated = store.getEventById(ev.id);
      if (!updated) {
        // ถูกลบแล้ว → กลับไปยังรายการ
        window.location.hash = '#/events';
        return;
      }
      // reset ก่อน re-render เพื่อให้ผ่าน path เดียวกับ initial render
      main.querySelector(`[data-event-detail="${ev.id}"]`)?.remove();
      renderSingleEventDetail(main, updated, dept, params);
    });
  });
}
