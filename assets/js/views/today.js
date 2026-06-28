/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/TODAY
   assets/js/views/today.js
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../core/store.js';
import { ICON, formatDate, isToday, relativeDay, eventProgress, statusLabel, statusChipClass, escapeHtml } from '../core/ui.js';
import { renderAvatar } from '../framework/avatar.js';

export function renderToday(main) {
  const user = store.getSession();
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const todays = store.getEventsByDate(todayStr);
  const upcoming = store.getEvents()
    .filter(e => e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const overdue = store.getOverdueTasks();
  const myDept = store.getDepartmentById(user.departmentId);

  const hour = today.getHours();
  const greet = hour < 12 ? 'สวัสดีตอนเช้า' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  main.innerHTML = `
    <div class="page container">
      <!-- Hero -->
      <div class="today-hero">
        <div class="today-hero__content">
          <div class="today-hero__greeting">${greet}</div>
          <div class="today-hero__name">${escapeHtml(user.name)}</div>
          <div class="today-hero__date">${formatDate(todayStr, { long: true })}</div>
          <div class="today-hero__stats">
            <div class="today-hero__stat">
              <div class="today-hero__stat-value">${todays.length}</div>
              <div class="today-hero__stat-label">งานวันนี้</div>
            </div>
            <div class="today-hero__stat">
              <div class="today-hero__stat-value">${upcoming.length}</div>
              <div class="today-hero__stat-label">กำลังจะถึง</div>
            </div>
            <div class="today-hero__stat">
              <div class="today-hero__stat-value">${overdue.length}</div>
              <div class="today-hero__stat-label">เลยกำหนด</div>
            </div>
          </div>
        </div>
      </div>

      ${overdue.length > 0 ? `
        <section class="today-section">
          <div class="today-section__head">
            <h2 class="today-section__title">งานที่เลยกำหนด</h2>
            <span class="today-section__count">${overdue.length} รายการ</span>
          </div>
          <div>
            ${overdue.map(t => `
              <div class="list-item" data-action="open-event" data-event-id="${t.eventId}">
                <div class="list-item__icon" style="background:rgba(244,63,94,0.1); color:#BE123C;">${ICON.alert}</div>
                <div class="list-item__body">
                  <div class="list-item__title">${escapeHtml(t.title)}</div>
                  <div class="list-item__subtitle">งาน: ${escapeHtml(t.eventTitle)} · ครบกำหนด ${formatDate(t.dueDate, { short: true })}</div>
                </div>
                <div class="chip chip--overdue"><span class="chip-dot"></span>เลยกำหนด</div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <section class="today-section">
        <div class="today-section__head">
          <h2 class="today-section__title">งานวันนี้</h2>
          <span class="today-section__count">${todays.length} รายการ</span>
        </div>
        ${todays.length === 0 ? `
          <div class="empty">
            <div class="empty__icon">🌤️</div>
            <div class="empty__title">ไม่มีงานวันนี้</div>
            <div class="empty__desc">ว่าง ๆ ลองดูงานที่กำลังจะถึงด้านล่าง</div>
          </div>
        ` : todays.map(ev => renderEventCard(ev)).join('')}
      </section>

      <section class="today-section">
        <div class="today-section__head">
          <h2 class="today-section__title">กำลังจะถึง</h2>
          <span class="today-section__count">${upcoming.length} รายการ</span>
        </div>
        ${upcoming.length === 0 ? `
          <div class="empty">
            <div class="empty__icon">📅</div>
            <div class="empty__title">ยังไม่มีงานที่กำลังจะถึง</div>
            <div class="empty__desc">กดปุ่ม + เพื่อสร้างงานใหม่</div>
          </div>
        ` : upcoming.map(ev => renderEventCard(ev)).join('')}
      </section>

      ${myDept ? `
        <section class="today-section">
          <div class="today-section__head">
            <h2 class="today-section__title">${escapeHtml(myDept.icon || '')} ภาพรวม${escapeHtml(myDept.name)}</h2>
          </div>
          ${renderDeptSummary(myDept)}
        </section>
      ` : ''}
    </div>
  `;

  // Bind click handlers
  main.querySelectorAll('[data-action="open-event"]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.eventId;
      window.location.hash = `#/event/${id}`;
    });
  });
}

function renderEventCard(ev) {
  const progress = eventProgress(ev);
  const isGroup = ev.type === 'group';
  const totalTasks = ev.tasks?.length || 0;
  const doneTasks = ev.tasks?.filter(t => t.status === 'done').length || 0;
  const accent = ev.color || '#4F46E5';

  return `
    <div class="event-card" data-action="open-event" data-event-id="${ev.id}" style="--accent:${accent}">
      <div class="event-card__head">
        <div class="event-card__icon" style="background:${accent}1f; color:${accent};">
          ${isGroup ? ICON.layers : ICON.flag}
        </div>
        <div class="event-card__main">
          <div class="event-card__title">${escapeHtml(ev.title)}</div>
          <div class="event-card__meta">
            ${relativeDay(ev.date)} · ${ev.time || 'ทั้งวัน'}${ev.location ? ' · ' + escapeHtml(ev.location) : ''}
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

function renderDeptSummary(dept) {
  const deptEvents = store.getEvents().filter(e => e.departmentId === dept.id);
  const total = deptEvents.length;
  const done = deptEvents.filter(e => e.status === 'done').length;
  const ongoing = deptEvents.filter(e => e.status === 'ongoing' || e.status === 'planning').length;
  const overdueTasks = store.getOverdueTasks().filter(t => {
    const ev = store.getEventById(t.eventId);
    return ev && ev.departmentId === dept.id;
  }).length;

  const members = store.getUsers().filter(u => u.departmentId === dept.id);

  return `
    <div class="stat-grid" style="margin-bottom:6px;">
      <div class="stat">
        <div class="stat__icon">${ICON.flag}</div>
        <div class="stat__value">${total}</div>
        <div class="stat__label">งานทั้งหมด</div>
      </div>
      <div class="stat">
        <div class="stat__icon" style="background:rgba(16,185,129,0.12); color:#047857;">${ICON.check}</div>
        <div class="stat__value">${done}</div>
        <div class="stat__label">เสร็จแล้ว</div>
      </div>
      <div class="stat">
        <div class="stat__icon">${ICON.clock}</div>
        <div class="stat__value">${ongoing}</div>
        <div class="stat__label">กำลังทำ</div>
      </div>
      <div class="stat">
        <div class="stat__icon" style="background:rgba(244,63,94,0.12); color:#BE123C;">${ICON.alert}</div>
        <div class="stat__value">${overdueTasks}</div>
        <div class="stat__label">เลยกำหนด</div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <div class="avatar-group">
          ${members.map(u => `<div class="avatar avatar--sm" title="${escapeHtml(u.name)}">${renderAvatar({ name: u.name, color: u.color, size: 28, className: 'avatar__img' })}</div>`).join('')}
        </div>
        <div style="font-size:var(--yp-text-xs); color:var(--yp-text-muted);">
          สมาชิก ${members.length} คน
        </div>
      </div>
      <div style="font-size:var(--yp-text-xs); color:var(--yp-text-body); line-height:1.5;">
        ${escapeHtml(dept.description || '')}
      </div>
    </div>
  `;
}
