/* ═══════════════════════════════════════════════════════════════
   YP WORK · APP BOOTSTRAP
   assets/js/app.js
   ───────────────────────────────────────────────────────────────
   ทำหน้าที่: bootstrap แอปหลัง login
   - ตรวจ auth
   - สร้าง app shell (ผ่าน framework/app-shell.js)
   - ลงทะเบียน routes
   - เริ่ม router

   การแยกหน้าที่ (ตามแนว Fantrove):
   - app.js          → orchestration เท่านั้น
   - framework/app-shell.js   → โครง shell + DOM
   - framework/route-meta.js → ตาราง meta + applyRouteMeta
   - framework/bottom-sheet.js → bottom sheet system
   - framework/avatar.js → SVG avatar renderer
   - core/router.js  → hash routing
   - core/store.js   → localStorage + CRUD
   - core/auth.js    → session
   - core/ui.js      → toast, modal wrapper, icons, helpers
   - views/*         → แต่ละหน้า
   ═══════════════════════════════════════════════════════════════ */

import { store } from './core/store.js';
import { auth } from './core/auth.js';
import { router } from './core/router.js';
import { ICON, closeAllModals } from './core/ui.js';
import { createAppShell, mountAppShell } from './framework/app-shell.js';
import { applyRouteMeta } from './framework/route-meta.js';

import { renderToday } from './views/today.js';
import { renderCalendar } from './views/calendar.js';
import { renderEvents, renderEventDetail, openCreateModal } from './views/events/index.js';
import { renderDay } from './views/events/day.js';
import { renderProfile } from './views/profile.js';

/* ── Nav items config ── */
const NAV_ITEMS = [
  { key: 'today',    label: 'หน้าแรก',  icon: ICON.home,     hash: '#/today' },
  { key: 'calendar', label: 'ปฏิทิน',  icon: ICON.calendar, hash: '#/calendar' },
  { key: 'events',   label: 'งาน',     icon: ICON.list,     hash: '#/events' },
  { key: 'profile',  label: 'โปรไฟล์', icon: ICON.user,     hash: '#/profile' }
];

/* ── Init ── */
if (!auth.requireAuth()) {
  // redirected to index.html
} else {
  // Remove loading screen
  const loading = document.getElementById('loading-screen');
  if (loading) {
    setTimeout(() => loading.classList.add('is-hidden'), 240);
    setTimeout(() => loading.remove(), 700);
  }
  bootApp();
}

function bootApp() {
  const user = store.getSession();
  if (!user) return;

  // 1. Create shell
  const shell = createAppShell({
    user,
    navItems: NAV_ITEMS,
    onFABClick: () => openCreateModal()
  });

  // 2. Mount
  const app = document.getElementById('app');
  mountAppShell(shell, app);

  // 3. Register routes — แต่ละ route จะ apply meta ก่อน แล้วค่อย render
  router
    .register('today',    (p) => applyRouteMeta('today',    shell).then(() => renderToday(shell.main)))
    .register('calendar', (p) => applyRouteMeta('calendar', shell).then(() => renderCalendar(shell.main, p)))
    .register('events',   ()  => applyRouteMeta('events',   shell).then(() => renderEvents(shell.main)))
    .register('profile',  ()  => applyRouteMeta('profile',  shell).then(() => renderProfile(shell.main)))
    .register('event',    (p) => applyRouteMeta('event',    shell).then(() => renderEventDetail(shell.main, p)))
    .register('day',      (p) => applyRouteMeta('day',      shell).then(() => renderDay(shell.main, p)))
    .notFound(() => router.navigate('today'));

  // 4. Start router — first dispatch
  router.start();
}
