/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/DAY
   assets/js/views/events/day.js
   ───────────────────────────────────────────────────────────────
   หน้า "งานในวัน" — แยกจาก calendar.js ตามหลัก Single Responsibility

   v5.5: unify job card — ใช้ .event-card ตัวเดียวกับ today.js / list.js
   ลด CSS ที่ซ้ำซ้อน ใช้สไตล์เดียวทั้งเว็บ
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import {
  ICON,
  formatDate,
  escapeHtml,
  relativeDay,
  eventProgress,
  statusLabel,
  statusChipClass
} from '../../core/ui.js';

export function renderDay(main, params) {
  const dateStr = params[0];
  if (!dateStr) {
    window.location.hash = '#/calendar';
    return;
  }
  const events = store.getEventsByDate(dateStr);
  main.innerHTML = `
    <div class="page container">
      <div class="page-header">
        <div class="page-header__eyebrow">งานในวัน</div>
        <h1 class="page-header__title">${formatDate(dateStr, { long: true })}</h1>
      </div>
      ${events.length === 0 ? `
        <div class="empty">
          <div class="empty__icon">📅</div>
          <div class="empty__title">ไม่มีงานในวันนี้</div>
        </div>
      ` : events.map(ev => renderEventCard(ev)).join('')}
    </div>
  `;
  main.querySelectorAll('[data-action="open-event"]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = `#/event/${el.dataset.eventId}`;
    });
  });
}

/** renderEventCard — ใช้โครงเดียวกับ today.js / list.js (CSS .event-card ตัวเดียว) */
function renderEventCard(ev) {
  const progress = eventProgress(ev);
  const isGroup = ev.type === 'group';
  const totalTasks = ev.tasks?.length || 0;
  const doneTasks = ev.tasks?.filter(t => t.status === 'done').length || 0;
  const accent = ev.color || '#4F46E5';

  const metaParts = [ev.time || 'ทั้งวัน'];
  if (ev.location) metaParts.push(escapeHtml(ev.location));

  return `
    <div class="event-card" data-action="open-event" data-event-id="${ev.id}" style="--accent:${accent}">
      <div class="event-card__head">
        <div class="event-card__icon" style="background:${accent}1f; color:${accent};">
          ${isGroup ? ICON.layers : ICON.flag}
        </div>
        <div class="event-card__main">
          <div class="event-card__title">${escapeHtml(ev.title)}</div>
          <div class="event-card__meta">
            ${metaParts.join(' · ')}
          </div>
        </div>
        <span class="chip ${statusChipClass(ev.status)}">
          <span class="chip-dot"></span>${statusLabel(ev.status)}
        </span>
      </div>
      ${isGroup && totalTasks > 0 ? `
        <div class="event-card__progress">
          <div class="progress event-card__progress-bar">
            <div class="progress__fill" style="width:${progress}%"></div>
          </div>
          <span class="event-card__progress-text">${doneTasks}/${totalTasks}</span>
        </div>
      ` : ''}
    </div>
  `;
}
