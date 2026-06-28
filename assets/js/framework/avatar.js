/* ═══════════════════════════════════════════════════════════════
   YP WORK · FRAMEWORK/AVATAR
   assets/js/framework/avatar.js
   ────────────────────────────────────────────────────────────────
   SVG-based avatar renderer.

   ทำไมต้อง SVG?
   - Avatar แบบเดิมใช้ text node (initials) อยู่ใน <div>/<a> — แม้จะมี
     `user-select:none` แล้ว บน iOS บางครั้ง long-press ยังเลือกและ
     copy ข้อความได้อยู่ (โดยเฉพาะตอนอยู่ในรูปแบบ PWA / standalone)
   - เปลี่ยนเป็น inline SVG ที่วาดตัวอักษรด้วย <text> — browser
     ถือว่าเป็น graphic ไม่ใช่ selectable text → copy ไม่ได้แน่นอน
   - ไม่ต้องโหลดรูปจริง (ซึ่งต้องมี asset + จัดการ upload) — ใช้
     gradient + initials ที่ scale ได้ตามขนาด

   API:
   - renderAvatar({ name, color, size }) → HTML string ของ <svg>
   - renderAvatarEl({ name, color, size }) → HTMLElement พร้อมใช้
   ═══════════════════════════════════════════════════════════════ */

import { initials } from '../core/ui.js';

/**
 * สร้าง avatar เป็น SVG string
 * @param {object} opts
 * @param {string} opts.name — ชื่อเต็ม (จะถูกย่อเป็น initials)
 * @param {string} [opts.color] — hex color สำหรับ gradient (default: brand indigo)
 * @param {number} [opts.size=32] — ขนาดเป็น px
 * @param {string} [opts.className] — class เพิ่มเติม
 * @param {string} [opts.id] — id ของ gradient (กรณีใช้หลาย avatar ในหน้าเดียวกัน)
 * @returns {string} SVG HTML string
 */
export function renderAvatar(opts = {}) {
  const {
    name = '',
    color,
    size = 32,
    className = '',
    id = null
  } = opts;

  const text = initials(name) || '?';
  // ใช้ gradient ของ YP (Indigo Trust) เป็น default
  const useBrand = !color;
  const gradId = id || `yp-avatar-grad-${Math.random().toString(36).slice(2, 8)}`;

  // font-size ~ 42% ของ size — พอดีไม่ล้น
  const fontSize = Math.round(size * 0.42);
  const radius = size; // วงกลม

  const fill = useBrand
    ? `url(#${gradId})`
    : color;

  const gradDef = useBrand ? `
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4F46E5"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
  ` : '';

  // ใช้ text-anchor middle + dominant-baseline central เพื่อให้ตัวอักษร
  // อยู่ตรงกลางพอดี ไม่ต้องง้อ CSS line-height
  // ใส่ aria-hidden="true" เพราะเรามี aria-label ที่ element นอก (ถ้ามี)
  return `<svg class="avatar-svg${className ? ' ' + className : ''}"
            width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
            role="img" aria-hidden="true">
    ${gradDef}
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${fill}"/>
    <text x="50%" y="50%"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'Noto Sans Thai', 'Inter', system-ui, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="#FFFFFF"
          letter-spacing="0.5">${_escapeXml(text)}</text>
  </svg>`;
}

/**
 * สร้าง avatar เป็น HTMLElement (wrapper)
 * @param {object} opts — เหมือน renderAvatar
 * @param {string} [opts.tag='div'] — tag ของ wrapper
 * @returns {HTMLElement}
 */
export function renderAvatarEl(opts = {}) {
  const { tag = 'div', className = '', ...avatarOpts } = opts;
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.innerHTML = renderAvatar(avatarOpts);
  // กัน copy ทุกชั้น — เผื่อ browser เก่า
  el.style.userSelect = 'none';
  el.style.webkitUserSelect = 'none';
  el.style.webkitTouchCallout = 'none';
  return el;
}

/* ── internal ── */
function _escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
