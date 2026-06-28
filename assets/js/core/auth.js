/* ═══════════════════════════════════════════════════════════════
   YP WORK · CORE/AUTH
   assets/js/core/auth.js
   Login/logout + session guard
   ═══════════════════════════════════════════════════════════════ */

import { store } from './store.js';

export const auth = {
  /** Returns current logged-in user (or null) */
  current() {
    return store.getSession();
  },

  /** Validate national ID (13 digits) + student code (5 digits) */
  validate(nationalId, studentCode) {
    const errors = {};
    const cleanNational = (nationalId || '').replace(/\D/g, '');
    const cleanStudent = (studentCode || '').replace(/\D/g, '');

    if (cleanNational.length !== 13) {
      errors.nationalId = 'เลขบัตรประชาชนต้องมี 13 หลัก';
    }
    if (cleanStudent.length !== 5) {
      errors.studentCode = 'รหัสนักเรียนต้องมี 5 หลัก';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },

  /** Try to log in. Returns { success, user, error } */
  login(nationalId, studentCode) {
    const cleanNational = (nationalId || '').replace(/\D/g, '');
    const cleanStudent = (studentCode || '').replace(/\D/g, '');

    const { valid, errors } = this.validate(cleanNational, cleanStudent);
    if (!valid) {
      return { success: false, errors, error: 'ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง' };
    }

    const user = store.getUserByCredentials(cleanNational, cleanStudent);
    if (!user) {
      return {
        success: false,
        errors: {},
        error: 'ไม่พบบัญชีในระบบ — ตรวจสอบเลขบัตรประชาชนและรหัสนักเรียนอีกครั้ง'
      };
    }

    const session = store.setSession(user);
    return { success: true, user: session };
  },

  /** Direct login as a known user (ใช้สำหรับ hint buttons) */
  loginAs(userId) {
    const user = store.getUserById(userId);
    if (!user) return { success: false, error: 'ไม่พบบัญชี' };
    const session = store.setSession(user);
    return { success: true, user: session };
  },

  logout() {
    store.clearSession();
  },

  /** Redirect to login if not authenticated
      มี redirect guard ป้องกันลูปรีเฟรชรัว */
  requireAuth() {
    if (!this.current()) {
      // Guard: ป้องกัน redirect loop — ถ้าเพิ่ง redirect มาไม่ถึง 2 วินาที ให้หยุด
      const now = Date.now();
      const lastRedirect = parseInt(localStorage.getItem('yp-work:last-auth-redirect') || '0', 10);
      if (now - lastRedirect < 2000) {
        console.warn('[auth] redirect loop detected — stopping');
        localStorage.removeItem('yp-work:last-auth-redirect');
        return false;
      }
      localStorage.setItem('yp-work:last-auth-redirect', String(now));
      window.location.replace('index.html');
      return false;
    }
    // Clear guard เมื่อ auth สำเร็จ
    localStorage.removeItem('yp-work:last-auth-redirect');
    return true;
  }
};

window.__ypAuth = auth;
