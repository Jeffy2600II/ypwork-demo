/* ═══════════════════════════════════════════════════════════════
   YP WORK · CORE/UI
   assets/js/core/ui.js
   Shared UI primitives: toast, modal, icon set, helpers
   ────────────────────────────────────────────────────────────────
   NOTE: openModal / confirmDialog / openStatusPicker เป็น wrapper
   ที่ใช้ framework/bottom-sheet.js ตัวใหม่ (รองรับ stack, history,
   scroll-lock ที่แน่นอน, patch mode)
   ═══════════════════════════════════════════════════════════════ */

import { openBottomSheet, openConfirmSheet, closeAllOpenSheets } from '../framework/bottom-sheet.js';

/* ── Icon set (inline SVG strings) ── */
export const ICON = {
  home: `<svg viewBox="0 0 24 24"><path d="M3 12L12 4l9 8M5 10v10h14V10"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>`,
  list: `<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>`,
  chevronUp: `<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>`,
  clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24"><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  bell: `<svg viewBox="0 0 24 24"><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16zM10 19a2 2 0 0 0 4 0"/></svg>`,
  logout: `<svg viewBox="0 0 24 24"><path d="M16 17l5-5-5-5M21 12H9M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/></svg>`,
  trash: `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>`,
  edit: `<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
  layers: `<svg viewBox="0 0 24 24"><path d="M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></svg>`,
  users: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 3.5a3.5 3.5 0 0 1 0 7M22 21c0-3-2-5-5-6"/></svg>`,
  flag: `<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h12l-3 4 3 4H5"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  alert: `<svg viewBox="0 0 24 24"><path d="M12 2L1 21h22zM12 9v4M12 17v.01"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>`,
  info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/></svg>`,
  settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  share: `<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`,
  download: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
  phone: `<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>`,
  idCard: `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.5 2-2 3-2s2.5.5 3 2M14 9h5M14 13h5M14 16h3"/></svg>`
};

/* ── Toast ── */
let _toastStack = null;

export function toast(message, type = 'info', duration = 2400) {
  if (!_toastStack) {
    _toastStack = document.createElement('div');
    _toastStack.className = 'toast-stack';
    document.body.appendChild(_toastStack);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  const iconMap = { success: ICON.check, error: ICON.alert, info: ICON.info };
  el.innerHTML = `${iconMap[type] || ICON.info}<span>${escapeHtml(message)}</span>`;
  _toastStack.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
  }, duration);
}

/* ── Modal (wrapper สำหรับ framework/bottom-sheet) ──
   API เดิม: { title, body, onClose, size }
   - รองรับ patch() สำหรับอัพเดตเนื้อหาโดยไม่ re-animate
   - รองรับ stackable (เปิดซ้อนกันได้)
   - ESC / back button / แตะ backdrop ปิดได้
   - Scroll lock แน่นอนด้วย scroll-lock.js
   - การ์ดยังใช้ class เดิม (.modal-backdrop/.modal) เพื่อไม่ให้ CSS เดิมพัง */
export function openModal({ title, body, footer, onClose, size }) {
  let sheetSize = 'auto';
  if (size === 'lg' || size === 'large') sheetSize = 'tall';
  if (size === 'full') sheetSize = 'full';

  const sheet = openBottomSheet({
    title: title || '',
    body,
    footer,
    onClose,
    size: sheetSize
  });

  // Compat wrapper — ให้ code เดิมที่ใช้ .backdrop / .bodyEl / .close() ยังทำงาน
  return {
    close: sheet.close,
    patch: sheet.patch,
    setTitle: sheet.setTitle,
    get backdrop() { return sheet.backdrop; },
    get bodyEl() { return sheet.bodyEl; },
    get footerEl() { return sheet.footerEl; },
    get sheet() { return sheet; }
  };
}

/* ── ปิด sheet ทั้งหมด — เรียกเมื่อ navigate หน้าใหม่ ── */
export function closeAllModals() {
  closeAllOpenSheets();
}

/* ── Confirm dialog ── ใช้ framework/bottom-sheet ตัวใหม่ */
export function confirmDialog({ title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', danger = false }) {
  return openConfirmSheet({ title, message, confirmText, cancelText, danger });
}

/* ── HTML escape ── */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Date helpers (Thai locale) ── */
const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  if (!d) return '';
  if (opts.short) {
    return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  if (opts.long) {
    return `วัน${THAI_DAYS[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function formatDateRange(start, end) {
  if (!end) return formatDate(start);
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return formatDate(start);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${THAI_MONTHS_SHORT[s.getMonth()]} ${s.getFullYear() + 543}`;
  }
  return `${formatDate(start, {short:true})} – ${formatDate(end, {short:true})}`;
}

export function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export function isToday(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = parseDate(dateStr);
  if (!d) return false;
  d.setHours(0,0,0,0);
  return d.getTime() === today.getTime();
}

export function isPast(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = parseDate(dateStr);
  if (!d) return false;
  d.setHours(0,0,0,0);
  return d.getTime() < today.getTime();
}

export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = parseDate(dateStr);
  if (!d) return null;
  d.setHours(0,0,0,0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function relativeDay(dateStr) {
  const n = daysUntil(dateStr);
  if (n === 0) return 'วันนี้';
  if (n === 1) return 'พรุ่งนี้';
  if (n === -1) return 'เมื่อวาน';
  if (n > 0 && n <= 7) return `อีก ${n} วัน`;
  if (n < 0 && n >= -7) return `${Math.abs(n)} วันที่แล้ว`;
  return formatDate(dateStr, { short: true });
}

/* ── Initials from name ── */
export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Status helpers ── */
export function statusLabel(status) {
  return ({
    planning: 'วางแผน',
    todo: 'ยังไม่เริ่ม',
    ongoing: 'กำลังทำ',
    done: 'เสร็จแล้ว',
    overdue: 'เลยกำหนด'
  })[status] || status;
}

export function statusChipClass(status) {
  if (status === 'overdue') return 'chip--overdue';
  if (status === 'todo' || status === 'planning') return 'chip--todo';
  if (status === 'ongoing') return 'chip--ongoing';
  if (status === 'done') return 'chip--done';
  return '';
}

/* ── Progress calc ── */
export function eventProgress(ev) {
  if (!ev.tasks || ev.tasks.length === 0) {
    // Single task → 0 or 100
    return ev.status === 'done' ? 100 : 0;
  }
  const total = ev.tasks.length;
  const done = ev.tasks.filter(t => t.status === 'done').length;
  return Math.round((done / total) * 100);
}

/* ── Status picker — bottom sheet สำหรับเปลี่ยนสถานะง่ายๆ ──
   ใช้ได้ทั้งกับ event (งานเดี่ยว) และ task (ในกลุ่มงาน)
   onPick: function(status) — เรียกเมื่อเลือกสถานะ */
export function openStatusPicker(currentStatus, onPick, opts = {}) {
  const title = opts.title || 'เปลี่ยนสถานะ';
  const statuses = opts.statuses || ['todo', 'ongoing', 'done'];

  const statusInfo = {
    todo:    { label: 'ยังไม่เริ่ม',  icon: '⏸',  color: '#F59E0B', desc: 'ยังไม่ได้เริ่มทำ' },
    ongoing: { label: 'กำลังทำ',     icon: '▶',  color: '#6366F1', desc: 'กำลังดำเนินการอยู่' },
    done:    { label: 'เสร็จแล้ว',    icon: '✓',  color: '#10B981', desc: 'ทำเสร็จเรียบร้อย' }
  };

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="status-picker">
      ${statuses.map(s => {
        const info = statusInfo[s];
        const isCurrent = s === currentStatus;
        return `
          <button type="button"
                  class="status-picker__option ${isCurrent ? 'is-current' : ''}"
                  data-status="${s}"
                  style="--status-color:${info.color}">
            <div class="status-picker__icon">${info.icon}</div>
            <div class="status-picker__text">
              <div class="status-picker__label">${info.label}</div>
              <div class="status-picker__desc">${info.desc}</div>
            </div>
            ${isCurrent ? `<div class="status-picker__check">${ICON.check}</div>` : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;

  const modal = openModal({ title, body });

  modal.bodyEl.querySelectorAll('[data-status]').forEach(el => {
    el.addEventListener('click', () => {
      const newStatus = el.dataset.status;
      modal.close();
      onPick?.(newStatus);
    });
  });

  return modal;
}
