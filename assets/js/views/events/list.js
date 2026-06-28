/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/LIST
   assets/js/views/events/list.js
   ───────────────────────────────────────────────────────────────
   หน้ารายการงานทั้งหมด + filter + group by month

   v6.0: แยกการ render เป็น 2 ขั้น (เหมือน calendar.js):
   · renderEvents() — สร้าง .page shell ครั้งเดียว (header + filter
     buttons + events-list container) → ไม่ re-trigger yp-page-in
     animation เวลาเปลี่ยน filter
   · updateEventsList() — อัพเดตเฉพาะ list content (เฉพาะจุดข้อมูลเปลี่ยน)
     แทนการ re-render ทั้งหน้า
   · เปลี่ยน filter → แค่ toggle .is-active class + เรียก updateEventsList
     ไม่มี animation ขาเข้าทั้งหน้าใหม่อีกต่อไป

   v5.5: unify job card — ใช้ .event-card ตัวเดียวกับ today.js
   ไม่ใช้ .list-item แยกอีกต่อไป → CSS ตัวเดียว สไตล์เดียว ทั้งเว็บ
   (ลดการออกแบบที่ฟุ่มเฟือย ใช้สิ่งที่มีอยู่ให้เป็นประโยชน์มากขึ้น)
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import {
  ICON,
  escapeHtml,
  isPast,
  isToday,
  relativeDay,
  eventProgress,
  statusLabel,
  statusChipClass
} from '../../core/ui.js';

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

let _filter = 'all'; // all | group | task | mine | overdue
let _shellMain = null; // cache main element เพื่อใช้ตอน update

export function renderEvents(main) {
  _shellMain = main;

  // ถ้า main มี events shell อยู่แล้ว → อัพเดตเฉพาะ content ไม่ re-create .page
  const existing = main.querySelector('[data-events-shell]');
  if (existing) {
    updateEventsList();
    return;
  }

  // First render — สร้าง shell ครั้งเดียว (page-header + filter + list container)
  main.innerHTML = `
    <div class="page container" data-events-shell>
      <div class="page-header" style="padding-bottom:6px;">
        <div class="page-header__eyebrow">รายการงาน</div>
        <h1 class="page-header__title">งานทั้งหมด</h1>
        <p class="page-header__subtitle" data-events-subtitle>${filteredCount()} รายการ · เรียงตามวันที่</p>
      </div>

      <div class="events-filter" data-events-filter>
        ${renderFilterBtn('all', 'ทั้งหมด')}
        ${renderFilterBtn('group', 'กลุ่มงาน')}
        ${renderFilterBtn('task', 'งานเดี่ยว')}
        ${renderFilterBtn('mine', 'ที่ฉันมีส่วนร่วม')}
        ${renderFilterBtn('overdue', 'เลยกำหนด')}
      </div>

      <div data-events-list>
        <!-- ถูกอัพเดตโดย updateEventsList() -->
      </div>
    </div>
  `;

  // Bind filters ครั้งเดียว — toggle is-active class + update list (ไม่ re-render ทั้งหน้า)
  main.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      _filter = el.dataset.filter;
      // toggle is-active class บน filter buttons (เฉพาะจุดที่เปลี่ยน)
      main.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.toggle('is-active', b.dataset.filter === _filter);
      });
      // update เฉพาะ list content — ไม่ re-create .page shell
      updateEventsList();
    });
  });

  // First content fill
  updateEventsList();
}

/* ── Update เฉพาะ list content + subtitle ──
 * ไม่ re-create .page → yp-page-in animation ไม่เล่นซ้ำ */
function updateEventsList() {
  const main = _shellMain;
  if (!main) return;

  const user = store.getSession();
  const allEvents = store.getEvents().slice().sort((a, b) => a.date.localeCompare(b.date));

  let filtered = allEvents;
  if (_filter === 'group') filtered = allEvents.filter(e => e.type === 'group');
  else if (_filter === 'task') filtered = allEvents.filter(e => e.type === 'task');
  else if (_filter === 'mine') filtered = allEvents.filter(e => {
    if (e.tasks?.some(t => t.assigneeId === user.id)) return true;
    return false;
  });
  else if (_filter === 'overdue') filtered = allEvents.filter(e => isPast(e.date) && !isToday(e.date) && e.status !== 'done');

  // Group by month
  const groups = new Map();
  for (const ev of filtered) {
    const d = new Date(ev.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ev);
  }
  const sortedKeys = [...groups.keys()].sort();

  // 1. Update subtitle
  const subtitleEl = main.querySelector('[data-events-subtitle]');
  if (subtitleEl) {
    subtitleEl.textContent = `${filtered.length} รายการ · เรียงตามวันที่`;
  }

  // 2. Update list content (เฉพาะส่วนนี้ที่เปลี่ยน)
  const listEl = main.querySelector('[data-events-list]');
  if (listEl) {
    if (sortedKeys.length === 0) {
      listEl.innerHTML = `
        <div class="empty">
          <div class="empty__icon">📭</div>
          <div class="empty__title">ยังไม่มีงานในหมวดนี้</div>
          <div class="empty__desc">กดปุ่ม + เพื่อสร้างงานใหม่</div>
        </div>
      `;
    } else {
      listEl.innerHTML = sortedKeys.map(key => {
        const [y, m] = key.split('-');
        const monthLabel = `${THAI_MONTHS[+m - 1]} ${+y + 543}`;
        const items = groups.get(key);
        return `
          <div class="events-group">
            <div class="events-group__label">${monthLabel}</div>
            ${items.map(ev => renderEventCard(ev, user)).join('')}
          </div>
        `;
      }).join('');
    }

    // Bind cards (เหมือน today.js — ใช้ data-action="open-event")
    listEl.querySelectorAll('[data-action="open-event"]').forEach(el => {
      el.addEventListener('click', () => {
        window.location.hash = `#/event/${el.dataset.eventId}`;
      });
    });
  }
}

function filteredCount() {
  const user = store.getSession();
  const allEvents = store.getEvents().slice().sort((a, b) => a.date.localeCompare(b.date));
  let filtered = allEvents;
  if (_filter === 'group') filtered = allEvents.filter(e => e.type === 'group');
  else if (_filter === 'task') filtered = allEvents.filter(e => e.type === 'task');
  else if (_filter === 'mine') filtered = allEvents.filter(e => {
    if (e.tasks?.some(t => t.assigneeId === user.id)) return true;
    return false;
  });
  else if (_filter === 'overdue') filtered = allEvents.filter(e => isPast(e.date) && !isToday(e.date) && e.status !== 'done');
  return filtered.length;
}

function renderFilterBtn(key, label) {
  return `<button class="segmented__btn ${_filter === key ? 'is-active' : ''}" data-filter="${key}" type="button">${label}</button>`;
}

/**
 * renderEventCard — ใช้โครงเดียวกับ today.js เป๊ะ ๆ
 * (CSS .event-card ใน pages.css ตัวเดียว ไม่มี CSS แยก)
 * ความแตกต่างเดียวคือ: ในหน้า list เราอาจมี my-task count → แสดงใน meta
 */
function renderEventCard(ev, user) {
  const progress = eventProgress(ev);
  const isGroup = ev.type === 'group';
  const totalTasks = ev.tasks?.length || 0;
  const doneTasks = ev.tasks?.filter(t => t.status === 'done').length || 0;
  const myTaskCount = ev.tasks?.filter(t => t.assigneeId === user.id).length || 0;
  const accent = ev.color || '#4F46E5';

  const metaParts = [relativeDay(ev.date)];
  if (ev.time) metaParts.push(ev.time);
  if (ev.location) metaParts.push(escapeHtml(ev.location));
  if (myTaskCount > 0) metaParts.push(`ฉัน ${myTaskCount} task`);

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
