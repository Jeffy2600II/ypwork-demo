/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/PROFILE
   assets/js/views/profile.js
   ───────────────────────────────────────────────────────────────
   Profile page (vanilla ES module, no framework)
   - SVG avatars ผ่าน framework/avatar.js (copy-resistant, สวย)
   - user-select:none ทั้งหน้า (กัน copy)
   - Masked IDs พร้อม reveal toggle
   - ปุ่ม reset / about / logout (ใช้ .btn ของ app)
   - Indigo Trust colors + tokens.css radius scale
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../core/store.js';
import { auth } from '../core/auth.js';
import { ICON, escapeHtml, confirmDialog, toast, openModal } from '../core/ui.js';
import { renderAvatar } from '../framework/avatar.js';

export function renderProfile(main) {
  const user = store.getSession();
  if (!user) return;

  const dept = store.getDepartmentById(user.departmentId);
  const myEvents = store.getEvents().filter(e => e.departmentId === user.departmentId);
  const myTasks = [];
  for (const ev of store.getEvents()) {
    for (const t of ev.tasks || []) {
      if (t.assigneeId === user.id) myTasks.push({ ...t, eventTitle: ev.title, eventId: ev.id });
    }
  }
  const myDone = myTasks.filter(t => t.status === 'done').length;
  const myPending = myTasks.length - myDone;

  // SVG avatar สำหรับ hero — ขนาดใหญ่ (96px)
  const heroAvatar = renderAvatar({
    name: user.name,
    color: user.color,
    size: 96,
    className: 'profile-hero__avatar-img'
  });

  const completionRate = myTasks.length
    ? Math.round((myDone / myTasks.length) * 100)
    : 0;

  main.innerHTML = `
    <div class="page container profile-page" data-no-copy style="--accent:${user.color || '#4F46E5'}">

      <!-- ── HERO ── -->
      <section class="profile-hero" aria-labelledby="profile-hero-title">
        <div class="profile-hero__glow" aria-hidden="true"></div>
        <div class="profile-hero__avatar" aria-hidden="true">${heroAvatar}</div>
        <h1 id="profile-hero-title" class="profile-hero__name">${escapeHtml(user.name)}</h1>
        <p class="profile-hero__role">
          ${escapeHtml(user.roleLabel)}${dept ? ' · ' + escapeHtml(dept.name) : ''}
        </p>
        ${dept ? `
          <span class="profile-hero__chip">
            <span aria-hidden="true">${escapeHtml(dept.icon || '◎')}</span>
            ${escapeHtml(dept.name)}
          </span>
        ` : ''}
      </section>

      <!-- ── STATS ── -->
      <section class="profile-stats" aria-label="สรุปภาพรวม">
        <div class="profile-stat">
          <span class="profile-stat__value">${myEvents.length}</span>
          <span class="profile-stat__label">งานในฝ่าย</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat__value">${myTasks.length}</span>
          <span class="profile-stat__label">Task รับผิดชอบ</span>
        </div>
        <div class="profile-stat profile-stat--success">
          <span class="profile-stat__value">${myDone}</span>
          <span class="profile-stat__label">ทำเสร็จ</span>
        </div>
        <div class="profile-stat profile-stat--warning">
          <span class="profile-stat__value">${myPending}</span>
          <span class="profile-stat__label">ค้างทำ</span>
        </div>
      </section>

      ${myTasks.length ? `
        <section class="profile-progress" aria-label="อัตราความคืบหน้า">
          <div class="profile-progress__head">
            <span class="profile-progress__label">อัตราความคืบหน้า</span>
            <span class="profile-progress__pct">${completionRate}%</span>
          </div>
          <div class="progress" role="progressbar" aria-valuenow="${completionRate}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress__fill" style="width:${completionRate}%"></div>
          </div>
        </section>
      ` : ''}

      <!-- ── ACCOUNT INFO ── -->
      <section class="profile-section" aria-labelledby="profile-info-title">
        <header class="profile-section__head">
          <span class="profile-section__icon" aria-hidden="true">${ICON.user}</span>
          <h2 id="profile-info-title" class="profile-section__title">ข้อมูลบัญชี</h2>
        </header>
        <div class="profile-section__body">
          <dl class="profile-info">
            <div class="profile-info__row">
              <dt class="profile-info__label">ชื่อ-นามสกุล</dt>
              <dd class="profile-info__value">${escapeHtml(user.name)}</dd>
            </div>
            <div class="profile-info__row">
              <dt class="profile-info__label">บทบาท</dt>
              <dd class="profile-info__value">${escapeHtml(user.roleLabel)}</dd>
            </div>
            <div class="profile-info__row">
              <dt class="profile-info__label">ฝ่าย</dt>
              <dd class="profile-info__value">${escapeHtml(dept?.name || '-')}</dd>
            </div>
            <div class="profile-info__row">
              <dt class="profile-info__label">เลขบัตรประชาชน</dt>
              <dd class="profile-info__value">
                <span class="profile-id">
                  <span class="profile-id__value" data-masked-id="${escapeHtml(user.nationalId || '')}" data-revealed="false">${maskId(user.nationalId)}</span>
                  <button class="profile-id__reveal" type="button" data-reveal-id aria-label="แสดงเลขบัตร">
                    ${ICON.info}
                  </button>
                </span>
              </dd>
            </div>
            <div class="profile-info__row">
              <dt class="profile-info__label">รหัสนักเรียน</dt>
              <dd class="profile-info__value">
                <span class="profile-id">
                  <span class="profile-id__value" data-masked-code="${escapeHtml(user.studentCode || '')}" data-revealed="false">${maskCode(user.studentCode)}</span>
                  <button class="profile-id__reveal" type="button" data-reveal-code aria-label="แสดงรหัส">
                    ${ICON.info}
                  </button>
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- ── SETTINGS & ACTIONS ── -->
      <section class="profile-section" aria-labelledby="profile-settings-title">
        <header class="profile-section__head">
          <span class="profile-section__icon" aria-hidden="true">${ICON.settings}</span>
          <h2 id="profile-settings-title" class="profile-section__title">การตั้งค่า & การจัดการ</h2>
        </header>
        <div class="profile-section__body profile-actions">
          <button class="profile-action" id="reset-data-btn" type="button">
            <span class="profile-action__icon" aria-hidden="true">${ICON.refresh}</span>
            <span class="profile-action__text">
              <strong>รีเซ็ตข้อมูลสาธิต</strong>
              <small>คืนค่าเริ่มต้นทั้งหมด (งาน, task, ฝ่าย)</small>
            </span>
            <span class="profile-action__chevron" aria-hidden="true">${ICON.chevronRight}</span>
          </button>

          <button class="profile-action" id="about-btn" type="button">
            <span class="profile-action__icon" aria-hidden="true">${ICON.info}</span>
            <span class="profile-action__text">
              <strong>เกี่ยวกับ YP Work</strong>
              <small>Demo แบบ static · v1.2</small>
            </span>
            <span class="profile-action__chevron" aria-hidden="true">${ICON.chevronRight}</span>
          </button>

          <button class="profile-action profile-action--danger" id="logout-btn" type="button">
            <span class="profile-action__icon" aria-hidden="true">${ICON.logout}</span>
            <span class="profile-action__text">
              <strong>ออกจากระบบ</strong>
              <small>กลับสู่หน้าเข้าสู่ระบบ</small>
            </span>
            <span class="profile-action__chevron" aria-hidden="true">${ICON.chevronRight}</span>
          </button>
        </div>
      </section>

      <!-- ── FOOTER ── -->
      <footer class="profile-footer">
        <p>YP Work · สมองของสภานักเรียน</p>
        <p>สร้างเพื่อทดสอบแนวคิด · Indigo Trust theme</p>
      </footer>
    </div>
  `;

  /* ── Reveal toggle สำหรับ masked IDs ── */
  main.querySelectorAll('[data-reveal-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const span = btn.closest('.profile-id').querySelector('[data-masked-id]');
      const revealed = span.dataset.revealed === 'true';
      if (revealed) {
        span.textContent = maskId(span.dataset.maskedId);
        span.dataset.revealed = 'false';
        btn.setAttribute('aria-label', 'แสดงเลขบัตร');
      } else {
        span.textContent = formatId(span.dataset.maskedId);
        span.dataset.revealed = 'true';
        btn.setAttribute('aria-label', 'ซ่อนเลขบัตร');
      }
    });
  });

  main.querySelectorAll('[data-reveal-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      const span = btn.closest('.profile-id').querySelector('[data-masked-code]');
      const revealed = span.dataset.revealed === 'true';
      if (revealed) {
        span.textContent = maskCode(span.dataset.maskedCode);
        span.dataset.revealed = 'false';
        btn.setAttribute('aria-label', 'แสดงรหัส');
      } else {
        span.textContent = span.dataset.maskedCode;
        span.dataset.revealed = 'true';
        btn.setAttribute('aria-label', 'ซ่อนรหัส');
      }
    });
  });

  main.querySelector('#reset-data-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'รีเซ็ตข้อมูล?',
      message: 'จะลบงานและ task ที่สร้างเองทั้งหมด แล้วคืนค่าข้อมูลตัวอย่างเริ่มต้น',
      confirmText: 'รีเซ็ต',
      danger: true
    });
    if (ok) {
      store.reset();
      toast('รีเซ็ตข้อมูลแล้ว', 'success');
      window.location.hash = '#/today';
    }
  });

  main.querySelector('#about-btn').addEventListener('click', () => {
    openModal({
      title: 'เกี่ยวกับ YP Work',
      body: `
        <div class="yp-about">
          <p><strong>YP Work</strong> คือแพลตฟอร์มภายในสำหรับสภานักเรียน</p>
          <p>เป้าหมาย: เป็น "สมองของสภานักเรียน" — รวมตารางงาน กลุ่มงาน ฝ่ายงาน และ task ย่อยไว้ในที่เดียว</p>
          <p>เวอร์ชันนี้เป็น <strong>static demo</strong> ใช้ HTML/JS/CSS + localStorage เพื่อทดสอบแนวคิดก่อนสร้างเว็บจริง</p>
          <p class="yp-about__meta">Theme: Indigo Trust · v1.2</p>
        </div>
      `
    });
  });

  main.querySelector('#logout-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'ออกจากระบบ?',
      message: 'คุณจะกลับสู่หน้าเข้าสู่ระบบ',
      confirmText: 'ออกจากระบบ',
      danger: true
    });
    if (ok) {
      auth.logout();
      localStorage.removeItem('yp-work:last-login-redirect');
      localStorage.removeItem('yp-work:last-auth-redirect');
      toast('ออกจากระบบแล้ว', 'info');
      setTimeout(() => window.location.replace('index.html'), 600);
    }
  });
}

/* ── Mask helpers ── แสดงเป็น dots แทนตัวเลขจริง */
function maskId(s) {
  if (!s) return '';
  return '•-••••-•••••-••-•';
}

function maskCode(s) {
  if (!s) return '';
  return '•••••';
}

function formatId(s) {
  if (!s) return '';
  return `${s.slice(0,1)}-${s.slice(1,5)}-${s.slice(5,10)}-${s.slice(10,12)}-${s.slice(12,13)}`;
}
