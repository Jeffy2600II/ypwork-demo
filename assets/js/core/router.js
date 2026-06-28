/* ═══════════════════════════════════════════════════════════════
   YP WORK · CORE/ROUTER
   assets/js/core/router.js
   Hash-based router สำหรับ SPA ใน app.html
   ────────────────────────────────────────────────────────────────
   ฟีเจอร์:
   - register / notFound / beforeEach hooks
   - navigate(path) — push hash (สร้าง history entry ใหม่)
   - replace(path) — replace hash (ไม่สร้าง history entry)
     ใช้กับ calendar เดือนย้อนหน้า/ถัดไป เพื่อไม่ให้ย้อนกลับทีละเดือน
   - ก่อน navigate จะปิด bottom sheet ที่เปิดอยู่ทั้งหมด
   ═══════════════════════════════════════════════════════════════ */

import { closeAllOpenSheets } from '../framework/bottom-sheet.js';

const routes = new Map();
let _notFoundHandler = null;
let _beforeEach = null;

function parseHash() {
  let hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) hash = 'today';
  const [path, ...rest] = hash.split('/');
  return { path: path || 'today', params: rest };
}

export const router = {
  register(path, handler) {
    routes.set(path, handler);
    return this;
  },

  notFound(handler) {
    _notFoundHandler = handler;
    return this;
  },

  beforeEach(fn) {
    _beforeEach = fn;
    return this;
  },

  /** Push navigate — สร้าง history entry ใหม่ */
  navigate(path) {
    if (!path.startsWith('#')) path = '#/' + path.replace(/^\/+/, '');
    if (window.location.hash === path) {
      // Force re-render ไม่ต้อง push state ใหม่
      this._dispatch();
    } else {
      // ปิด sheet ที่เปิดอยู่ก่อน navigate
      closeAllOpenSheets();
      window.location.hash = path;
    }
  },

  /** Replace navigate — ไม่สร้าง history entry
   *  ใช้กับ pagination แบบ calendar เพื่อให้กด back แล้วออกจากหน้า ไม่ใช่ย้อนทีละเดือน */
  replace(path) {
    if (!path.startsWith('#')) path = '#/' + path.replace(/^\/+/, '');
    if (window.location.hash === path) {
      this._dispatch();
      return;
    }
    // ใช้ history.replaceState — ไม่ trigger hashchange ต้อง dispatch เอง
    const url = new URL(window.location.href);
    url.hash = path;
    window.history.replaceState(null, '', url.toString());
    this._dispatch();
  },

  _dispatch() {
    const { path, params } = parseHash();
    if (_beforeEach) {
      const result = _beforeEach(path, params);
      if (result === false) return;
    }
    const handler = routes.get(path);
    if (handler) {
      handler(params);
    } else if (_notFoundHandler) {
      _notFoundHandler(path, params);
    }
  },

  start() {
    window.addEventListener('hashchange', () => this._dispatch());
    this._dispatch();
  },

  current() {
    return parseHash();
  }
};
