/* ═══════════════════════════════════════════════════════════════
   YP WORK · FRAMEWORK/APP-SHELL
   assets/js/framework/app-shell.js
   ────────────────────────────────────────────────────────────────
   App shell = โครงหน้าหลักที่อยู่ถาวรตลอดการใช้งาน:
   - top-bar (back + title + avatar)
   - main content slot (#app-main)
   - FAB (สร้างงาน)
   - bottom-nav (4 ไอเทม)

   ทำไมต้องแยก?
   - app.js เดิมทำหลายอย่าง: mount shell + register routes + apply meta
     ปะปนกัน → อ่านยาก เปลี่ยนยาก
   - แยก shell เป็น module แล้ว app.js แค่เรียก createAppShell() แล้ว
     plug routes เข้าไป — สะอาด ตามแนว Fantrove

   API:
   - createAppShell({ user, navItems, onFABClick, onBackClick })
       → returns { el, main, title, fab, nav, backBtn }
   - mountAppShell(shellEl) → append ลง #app แล้วคืน element refs
   ═══════════════════════════════════════════════════════════════ */

import { ICON, escapeHtml } from '../core/ui.js';
import { renderAvatar } from './avatar.js';

/**
 * สร้าง app shell DOM จาก user ปัจจุบัน + nav config
 * @param {object} opts
 * @param {object} opts.user — current session user
 * @param {Array} opts.navItems — [{key,label,icon,hash}]
 * @param {function} [opts.onFABClick] — handler เมื่อกด FAB
 * @param {function} [opts.onBackClick] — handler เมื่อกด back (default: history.back)
 * @returns {object} { el, main, title, fab, nav, backBtn, avatarLink }
 */
export function createAppShell(opts = {}) {
  const {
    user,
    navItems = [],
    onFABClick,
    onBackClick
  } = opts;

  if (!user) throw new Error('createAppShell: user is required');

  const el = document.createElement('div');
  el.className = 'app-shell';
  el.dataset.shell = '';

  // Avatar link → ใช้ SVG (non-copyable)
  const avatarSvg = renderAvatar({
    name: user.name,
    color: user.color,
    size: 32,
    className: 'top-bar__avatar-img'
  });

  el.innerHTML = `
    <header class="top-bar">
      <div class="top-bar__left">
        <button class="top-bar__back is-hidden" data-back-btn aria-label="ย้อนกลับ" type="button">
          ${ICON.arrowLeft}
        </button>
      </div>
      <div class="top-bar__title" id="page-title">YP Work</div>
      <div class="top-bar__right">
        <a href="#/profile" class="top-bar__avatar" aria-label="โปรไฟล์" data-no-copy>
          ${avatarSvg}
        </a>
      </div>
    </header>

    <main class="app-main" id="app-main"></main>

    <button class="fab is-hidden" id="fab-create" type="button" aria-label="สร้างงานใหม่">
      ${ICON.plus}
    </button>

    <nav class="bottom-nav is-hidden" id="bottom-nav" aria-label="นำทางหลัก">
      ${navItems.map(item => `
        <a href="${item.hash}" class="bottom-nav__item" data-nav-key="${item.key}">
          <span class="bottom-nav__icon">${item.icon}</span>
          <span class="bottom-nav__label">${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;

  // Cache element refs
  const refs = {
    el,
    main: el.querySelector('#app-main'),
    title: el.querySelector('#page-title'),
    fab: el.querySelector('#fab-create'),
    nav: el.querySelector('#bottom-nav'),
    backBtn: el.querySelector('[data-back-btn]'),
    avatarLink: el.querySelector('.top-bar__avatar')
  };

  // Bind handlers
  if (onFABClick) {
    refs.fab.addEventListener('click', onFABClick);
  }
  refs.backBtn.addEventListener('click', () => {
    if (onBackClick) onBackClick();
    else window.history.back();
  });

  return refs;
}

/**
 * Mount shell ลงใน container (โดยทั่วไปคือ #app)
 * @param {object} refs — refs ที่ได้จาก createAppShell
 * @param {HTMLElement} container — element ที่จะ append เข้าไป
 */
export function mountAppShell(refs, container) {
  if (!container) throw new Error('mountAppShell: container is required');
  // Clear ก่อน (กัน double-mount)
  container.innerHTML = '';
  container.appendChild(refs.el);
}
