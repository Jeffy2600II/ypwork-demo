/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/CALENDAR
   assets/js/views/calendar.js
   Month view calendar พร้อม event indicator

   หลัการ (v5.4):
   - แบ่งการ render เป็น 2 ขั้น:
     · initCalendarShell() — สร้าง .page shell ครั้งเดียว (toolbar + grid
       container + legend) → ไม่ re-trigger yp-page-in animation
     · updateCalendar() — อัพเดตเฉพาะ month label + days grid
       (ตอนกด prev/next/today เดือนเปลี่ยนแค่จุดที่เปลี่ยน ไม่ใช่ทั้งหน้า)
   - ปุ่มเดือนก่อน/ถัดไป ใช้ router.replace (ไม่ push history)
   - กดวันที่มี 1 งาน → กระโดดไป detail / หลายงาน → หน้า day
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { ICON, escapeHtml } from '../core/ui.js';

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_DAYS_SHORT = ['อา','จ','อ','พ','พฤ','ศ','ส'];

let _viewYear, _viewMonth;
let _shellMain = null; // cache main element เพื่อใช้ตอน update

export function renderCalendar(main, params = []) {
  // Allow deep link: #/calendar/2026/7
  if (params.length === 2) {
    _viewYear = +params[0];
    _viewMonth = +params[1] - 1;
  }
  if (!_viewYear) {
    const now = new Date();
    _viewYear = now.getFullYear();
    _viewMonth = now.getMonth();
  }

  _shellMain = main;

  // ถ้า main มี calendar shell อยู่แล้ว → อัพเดตเฉพาะ content ไม่ re-create .page
  const existing = main.querySelector('[data-calendar-shell]');
  if (existing) {
    updateCalendar();
    return;
  }

  // First render — สร้าง shell ครั้งเดียว
  main.innerHTML = `
    <div class="page container" data-calendar-shell>
      <div class="cal-hero">
        <div class="cal-hero__bar">
          <button class="cal-hero__nav" data-nav="-1" aria-label="เดือนก่อนหน้า" type="button">${ICON.chevronLeft}</button>
          <button class="cal-hero__today" data-today-btn type="button">วันนี้</button>
          <button class="cal-hero__nav" data-nav="1" aria-label="เดือนถัดไป" type="button">${ICON.chevronRight}</button>
        </div>
        <div class="cal-hero__title-wrap" data-cal-title>
          <!-- ถูกอัพเดตโดย updateCalendar() -->
        </div>
      </div>

      <div class="cal-grid">
        <div class="cal-weekdays">
          ${THAI_DAYS_SHORT.map((d, i) => `
            <div class="cal-weekday ${i === 0 || i === 6 ? 'is-weekend' : ''}">${d}</div>
          `).join('')}
        </div>
        <div class="cal-days" data-cal-days>
          <!-- ถูกอัพเดตโดย updateCalendar() -->
        </div>
      </div>

      <div class="cal-legend" data-cal-legend>
        <!-- ถูกอัพเดตโดย updateCalendar() -->
      </div>
    </div>
  `;

  // Bind ปุ่มนำทาง (ครั้งเดียว — ไม่ re-bind ตอน update)
  main.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const dir = +el.dataset.nav;
      _viewMonth += dir;
      if (_viewMonth < 0) { _viewMonth = 11; _viewYear--; }
      if (_viewMonth > 11) { _viewMonth = 0; _viewYear++; }
      updateCalendar();
      // ใช้ replace ไม่ใช่ navigate — กัน history pollution
      router.replace(`calendar/${_viewYear}/${_viewMonth + 1}`);
    });
  });

  main.querySelector('[data-today-btn]')?.addEventListener('click', () => {
    const now = new Date();
    _viewYear = now.getFullYear();
    _viewMonth = now.getMonth();
    updateCalendar();
    router.replace(`calendar/${_viewYear}/${_viewMonth + 1}`);
  });

  // First content fill
  updateCalendar();
}

/* ── Update เฉพาะ month title + days grid + legend ──
 * ไม่ re-create .page → yp-page-in animation ไม่เล่นซ้ำ */
function updateCalendar() {
  const main = _shellMain;
  if (!main) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const firstDay = new Date(_viewYear, _viewMonth, 1);
  const lastDay = new Date(_viewYear, _viewMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const prevMonthLast = new Date(_viewYear, _viewMonth, 0).getDate();

  // Build grid: leading days from prev month + current + trailing from next
  const cells = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthLast - i, month: _viewMonth - 1, year: _viewYear, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: _viewMonth, year: _viewYear, other: false });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const next = new Date(last.year, last.month + 1, last.day + 1);
    cells.push({ day: next.getDate(), month: next.getMonth(), year: next.getFullYear(), other: next.getMonth() !== _viewMonth });
    if (cells.length >= 42) break;
  }

  // Get all events in this view range for lookup
  const events = store.getEvents();
  const eventsByDate = new Map();
  for (const ev of events) {
    if (!eventsByDate.has(ev.date)) eventsByDate.set(ev.date, []);
    eventsByDate.get(ev.date).push(ev);
  }

  // 1. Update month title (เลือกเฉพาะจุดที่เปลี่ยน)
  const titleEl = main.querySelector('[data-cal-title]');
  if (titleEl) {
    titleEl.innerHTML = `
      <span class="cal-hero__eyebrow">ปฏิทินกิจกรรม</span>
      <span class="cal-hero__title">${THAI_MONTHS[_viewMonth]} ${_viewYear + 543}</span>
    `;
  }

  // 2. Update days grid
  const daysEl = main.querySelector('[data-cal-days]');
  if (daysEl) {
    // ใช้ DocumentFragment เพื่อลด layout thrash
    const frag = document.createDocumentFragment();
    const newHTML = cells.map(c => {
      const dateStr = `${c.year}-${String(c.month + 1).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
      const dayEvents = eventsByDate.get(dateStr) || [];
      const isTodayCell = dateStr === todayStr;
      const hasEvents = dayEvents.length > 0;
      const weekend = (new Date(c.year, c.month, c.day)).getDay();
      const isWeekend = weekend === 0 || weekend === 6;
      return `
        <div class="cal-day ${c.other ? 'is-other-month' : ''} ${isTodayCell ? 'is-today' : ''} ${isWeekend && !c.other ? 'is-weekend' : ''}"
             ${hasEvents ? `data-day-click="${dateStr}"` : ''}>
          <div class="cal-day__num">${c.day}</div>
          ${dayEvents.length > 0 ? `
            <div class="cal-day__events">
              ${dayEvents.slice(0, 2).map(ev => {
                const color = ev.color || '#4F46E5';
                const isTask = ev.type === 'task';
                return `
                  <div class="cal-day__event ${isTask ? 'cal-day__event--task' : ''}"
                       style="--ev-color:${color};">
                    <span class="cal-day__event-dot" style="background:${color};"></span>
                    <span class="cal-day__event-text">${escapeHtml(ev.title)}</span>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="cal-day__dots">
              ${dayEvents.slice(0, 4).map(ev => `
                <div class="cal-day__dot" style="background:${ev.color || '#4F46E5'};"></div>
              `).join('')}
            </div>
            ${dayEvents.length > 2 ? `<div class="cal-day__more">+${dayEvents.length - 2} งาน</div>` : ''}
          ` : ''}
        </div>
      `;
    }).join('');
    daysEl.innerHTML = newHTML;

    // ผูก click ใหม่ให้ day cells (เพราะเป็น element ใหม่)
    daysEl.querySelectorAll('[data-day-click]').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.dataset.dayClick;
        const evs = store.getEventsByDate(dateStr);
        if (evs.length === 1) {
          router.navigate(`event/${evs[0].id}`);
        } else if (evs.length > 1) {
          router.navigate(`day/${dateStr}`);
        }
      });
    });
  }

  // 3. Update legend — auto-generate จาก events ทั้งหมดในเดือนนี้
  const legendEl = main.querySelector('[data-cal-legend]');
  if (legendEl) {
    // รวมสีทั้งหมดที่ใช้ในเดือนนี้ + ฝ่ายทั้งหมด
    const colorsUsed = new Map();
    for (const c of cells) {
      if (c.other) continue;
      const dateStr = `${c.year}-${String(c.month + 1).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
      const dayEvents = eventsByDate.get(dateStr) || [];
      for (const ev of dayEvents) {
        const color = ev.color || '#4F46E5';
        if (!colorsUsed.has(color)) {
          const dept = store.getDepartmentById(ev.departmentId);
          colorsUsed.set(color, {
            color,
            label: dept ? dept.name.replace('ฝ่าย', '') : (ev.type === 'task' ? 'งานเดี่ยว' : 'งานกลุ่ม'),
            icon: dept ? dept.icon : (ev.type === 'task' ? '◉' : '◎')
          });
        }
      }
    }

    // ถ้าไม่มีสีในเดือนนี้ → โชว์ placeholder
    if (colorsUsed.size === 0) {
      legendEl.innerHTML = `
        <div class="cal-legend__empty">
          <span class="cal-legend__dot" style="background:var(--yp-border-subtle);"></span>
          ยังไม่มีงานในเดือนนี้
        </div>
      `;
    } else {
      const items = Array.from(colorsUsed.values()).slice(0, 6);
      legendEl.innerHTML = items.map(it => `
        <div class="cal-legend__item">
          <span class="cal-legend__dot" style="background:${it.color};"></span>
          <span class="cal-legend__label">${escapeHtml(it.icon)} ${escapeHtml(it.label)}</span>
        </div>
      `).join('');
    }
  }
}
