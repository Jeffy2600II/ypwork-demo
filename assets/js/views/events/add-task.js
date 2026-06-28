/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/ADD-TASK
   assets/js/views/events/add-task.js
   ───────────────────────────────────────────────────────────────
   Bottom sheet สำหรับเพิ่ม task ในกลุ่มงาน — ฟอร์มยืดหยุ่น
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import { ICON, escapeHtml, openModal, toast } from '../../core/ui.js';

/**
 * @param {object} ev — parent event
 * @param {function} [onAdded] — เรียกหลังจากเพิ่ม task สำเร็จ
 */
export function openAddTaskModal(ev, onAdded) {
  const users = store.getUsers();
  const defaultDue = ev.date;

  const body = document.createElement('form');
  body.innerHTML = `
    <div class="form-modal__parent">
      <span class="form-modal__parent-label">ในงาน</span>
      <span class="form-modal__parent-chip" style="--accent:${ev.color || '#4F46E5'}">
        ${ev.type === 'group' ? ICON.layers : ICON.flag}
        <span>${escapeHtml(ev.title)}</span>
      </span>
    </div>

    <div class="form-modal__section">
      <div class="form-modal__section-title">ชื่อ task</div>
      <div class="field">
        <input class="input input--lg" id="task-title" required placeholder="เช่น จองหอประชุมและเวที" autocomplete="off" />
        <div class="field__hint">อธิบายสิ่งที่ต้องทำให้ชัดเจน — จะได้ติดตามง่าย</div>
      </div>
    </div>

    <div class="form-modal__section">
      <div class="form-modal__section-title">ความเร่งด่วน</div>
      <div class="priority-picker">
        <button type="button" class="priority-option" data-priority="low">
          <div class="priority-option__dot is-low"></div>
          <div class="priority-option__title">ไม่เร่ง</div>
          <div class="priority-option__desc">ทำเมื่อมีเวลาว่าง</div>
        </button>
        <button type="button" class="priority-option is-selected" data-priority="medium">
          <div class="priority-option__dot is-medium"></div>
          <div class="priority-option__title">ปกติ</div>
          <div class="priority-option__desc">ความเร่งด่วนมาตรฐาน</div>
        </button>
        <button type="button" class="priority-option" data-priority="high">
          <div class="priority-option__dot is-high"></div>
          <div class="priority-option__title">เร่งด่วน</div>
          <div class="priority-option__desc">ต้องทำก่อนอื่น</div>
        </button>
      </div>
    </div>

    <div class="form-modal__section">
      <div class="form-modal__section-title">มอบหมายและกำหนดเวลา</div>
      <div class="field">
        <label class="field__label" for="task-assignee">ผู้รับผิดชอบ</label>
        <select class="select" id="task-assignee">
          <option value="">— ยังไม่ระบุ —</option>
          ${users.map(u => `<option value="${u.id}">${escapeHtml(u.name)} · ${escapeHtml(u.roleLabel)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="task-due">กำหนดส่ง <span style="color:var(--yp-text-faint); font-weight:var(--yp-fw-medium);">(ไม่บังคับ)</span></label>
        <input class="input" type="date" id="task-due" value="${defaultDue}" />
      </div>
      <div class="field">
        <label class="field__label" for="task-est">เวลาโดยประมาณ <span style="color:var(--yp-text-faint); font-weight:var(--yp-fw-medium);">(ไม่บังคับ)</span></label>
        <input class="input" id="task-est" placeholder="เช่น 2 ชม. · 1 วัน · 30 นาที" autocomplete="off" />
      </div>
    </div>

    <div class="form-modal__section">
      <div class="form-modal__section-title">หมวด/ป้าย <span style="color:var(--yp-text-faint); font-weight:var(--yp-fw-medium); text-transform:none; letter-spacing:0;">(ไม่บังคับ)</span></div>
      <div class="field">
        <input class="input" id="task-tags" placeholder="เช่น ด้านเอกสาร, ด้านสถานที่, ด้านการเงิน" autocomplete="off" />
        <div class="field__hint">คั่นด้วยจุลภาค — จะแสดงเป็น <span style="color:var(--yp-indigo-600); font-weight:var(--yp-fw-semibold);">#ด้านเอกสาร</span> <span style="color:var(--yp-indigo-600); font-weight:var(--yp-fw-semibold);">#ด้านสถานที่</span> เพื่อกรองและจัดกลุ่ม task</div>
      </div>
    </div>

    <div class="form-modal__section">
      <div class="form-modal__section-title">หมายเหตุ <span style="color:var(--yp-text-faint); font-weight:var(--yp-fw-medium); text-transform:none; letter-spacing:0;">(ไม่บังคับ)</span></div>
      <div class="field">
        <textarea class="textarea" id="task-notes" placeholder="ขอบเขต · ไฟล์แนบ · ลิงก์อ้างอิง · ฯลฯ" style="min-height:84px;"></textarea>
      </div>
    </div>
  `;

  // Footer: action buttons (ล็อคที่ด้านล่าง sheet, พื้นหลังเต็มความกว้าง)
  const footer = document.createElement('div');
  footer.className = 'form-modal__actions';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost btn--block" data-cancel>ยกเลิก</button>
    <button type="button" class="btn btn--primary btn--block" data-submit>${ICON.plus} เพิ่ม task</button>
  `;

  const modal = openModal({ title: 'เพิ่ม task ใหม่', body, footer });
  setTimeout(() => modal.bodyEl.querySelector('#task-title')?.focus(), 320);

  let selectedPriority = 'medium';

  modal.bodyEl.querySelectorAll('[data-priority]').forEach(el => {
    el.addEventListener('click', () => {
      modal.bodyEl.querySelectorAll('[data-priority]').forEach(x => x.classList.remove('is-selected'));
      el.classList.add('is-selected');
      selectedPriority = el.dataset.priority;
    });
  });

  modal.footerEl.querySelector('[data-cancel]').addEventListener('click', () => modal.close());
  // Trigger form submit via footer button (button อยู่นอก form)
  modal.footerEl.querySelector('[data-submit]').addEventListener('click', () => {
    if (typeof body.requestSubmit === 'function') body.requestSubmit();
    else if (body.reportValidity()) body.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  body.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = modal.bodyEl.querySelector('#task-title').value.trim();
    if (!title) { toast('กรุณากรอกชื่อ task', 'error'); return; }

    const tagsRaw = modal.bodyEl.querySelector('#task-tags').value.trim();
    const tags = tagsRaw
      ? tagsRaw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6)
      : [];

    store.addTask(ev.id, {
      title,
      priority: selectedPriority,
      assigneeId: modal.bodyEl.querySelector('#task-assignee').value || null,
      dueDate: modal.bodyEl.querySelector('#task-due').value || null,
      estimatedTime: modal.bodyEl.querySelector('#task-est').value.trim(),
      tags,
      notes: modal.bodyEl.querySelector('#task-notes').value.trim()
    });
    modal.close();
    toast('เพิ่ม task แล้ว', 'success');
    onAdded?.();
  });
}
