/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/EDIT
   assets/js/views/events/edit.js
   ───────────────────────────────────────────────────────────────
   Bottom sheet สำหรับแก้ไขงาน
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import { ICON, escapeHtml, openModal, toast } from '../../core/ui.js';

export function openEditEventModal(ev, onSaved) {
  const departments = store.getDepartments();
  const body = document.createElement('form');
  body.innerHTML = `
    <div class="field">
      <label class="field__label" for="ed-title">ชื่องาน</label>
      <input class="input" id="ed-title" required value="${escapeHtml(ev.title)}" />
    </div>
    <div class="field">
      <label class="field__label" for="ed-date">วันที่</label>
      <input class="input" type="date" id="ed-date" required value="${ev.date}" />
    </div>
    <div class="field">
      <label class="field__label" for="ed-time">เวลา</label>
      <input class="input" type="time" id="ed-time" value="${ev.time || ''}" />
    </div>
    <div class="field">
      <label class="field__label" for="ed-location">สถานที่</label>
      <input class="input" id="ed-location" value="${escapeHtml(ev.location || '')}" />
    </div>
    <div class="field">
      <label class="field__label" for="ed-desc">รายละเอียด</label>
      <textarea class="textarea" id="ed-desc">${escapeHtml(ev.description || '')}</textarea>
    </div>
    <div class="field">
      <label class="field__label" for="ed-dept">ฝ่ายที่รับผิดชอบ</label>
      <select class="select" id="ed-dept">
        ${departments.map(d => `<option value="${d.id}" ${d.id === ev.departmentId ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label class="field__label">สีประจำงาน</label>
      <div class="color-picker">
        ${['#4F46E5','#7C3AED','#A855F7','#14B8A6','#3B82F6','#10B981','#F59E0B','#EC4899','#D946EF','#F43F5E'].map(c => `
          <button type="button" class="color-option ${ev.color === c ? 'is-selected' : ''}" data-color="${c}" style="background:${c};"></button>
        `).join('')}
      </div>
    </div>
  `;

  // Footer: action buttons (ล็อคที่ด้านล่าง sheet, พื้นหลังเต็มความกว้าง)
  const footer = document.createElement('div');
  footer.className = 'form-modal__actions';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost btn--block" data-cancel>ยกเลิก</button>
    <button type="button" class="btn btn--primary btn--block" data-submit>บันทึก</button>
  `;

  const modal = openModal({ title: 'แก้ไขงาน', body, footer });
  let selectedColor = ev.color;

  modal.bodyEl.querySelectorAll('[data-color]').forEach(el => {
    el.addEventListener('click', () => {
      modal.bodyEl.querySelectorAll('[data-color]').forEach(x => x.classList.remove('is-selected'));
      el.classList.add('is-selected');
      selectedColor = el.dataset.color;
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
    const patch = {
      title: modal.bodyEl.querySelector('#ed-title').value.trim() || ev.title,
      date: modal.bodyEl.querySelector('#ed-date').value || ev.date,
      time: modal.bodyEl.querySelector('#ed-time').value,
      location: modal.bodyEl.querySelector('#ed-location').value.trim(),
      description: modal.bodyEl.querySelector('#ed-desc').value.trim(),
      departmentId: modal.bodyEl.querySelector('#ed-dept').value,
      color: selectedColor
    };
    store.updateEvent(ev.id, patch);
    modal.close();
    toast('บันทึกแล้ว', 'success');
    onSaved?.();
  });
}
