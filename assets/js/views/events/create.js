/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/CREATE
   assets/js/views/events/create.js
   ───────────────────────────────────────────────────────────────
   Bottom sheet สำหรับสร้างงานใหม่ (group/task)
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import { ICON, escapeHtml, openModal, toast } from '../../core/ui.js';

export function openCreateModal() {
  const departments = store.getDepartments();
  const today = new Date().toISOString().slice(0, 10);

  const body = document.createElement('form');
  body.innerHTML = `
    <div class="form-modal__section">
      <div class="form-modal__section-title">ประเภทงาน</div>
      <div class="type-picker">
        <button type="button" class="type-option is-selected" data-type="group">
          <div class="type-option__icon">${ICON.layers}</div>
          <div class="type-option__title">กลุ่มงาน</div>
          <div class="type-option__desc">งานใหญ่ที่มี task ย่อย เช่น วันแม่ วันภาษาไทย</div>
        </button>
        <button type="button" class="type-option" data-type="task">
          <div class="type-option__icon">${ICON.flag}</div>
          <div class="type-option__title">งานเดี่ยว</div>
          <div class="type-option__desc">Task เดียวจบ เช่น ส่งเอกสาร ขออนุมัติ</div>
        </button>
      </div>
    </div>

    <div class="form-modal__section">
      <div class="field">
        <label class="field__label" for="ev-title">ชื่องาน <span style="color:#BE123C;">*</span></label>
        <input class="input" id="ev-title" required placeholder="เช่น วันแม่แห่งชาติ" />
      </div>
      <div class="field">
        <label class="field__label" for="ev-date">วันที่ <span style="color:#BE123C;">*</span></label>
        <input class="input" type="date" id="ev-date" required value="${today}" />
      </div>
      <div class="field">
        <label class="field__label" for="ev-time">เวลา (ไม่บังคับ)</label>
        <input class="input" type="time" id="ev-time" placeholder="08:00" />
      </div>
      <div class="field">
        <label class="field__label" for="ev-location">สถานที่ (ไม่บังคับ)</label>
        <input class="input" id="ev-location" placeholder="เช่น หอประชุมโรงเรียน" />
      </div>
      <div class="field">
        <label class="field__label" for="ev-desc">รายละเอียด (ไม่บังคับ)</label>
        <textarea class="textarea" id="ev-desc" placeholder="อธิบายวัตถุประสงค์หรือสิ่งที่ต้องทำ"></textarea>
      </div>
      <div class="field">
        <label class="field__label" for="ev-dept">ฝ่ายที่รับผิดชอบ</label>
        <select class="select" id="ev-dept">
          ${departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field__label">สีประจำงาน</label>
        <div class="color-picker">
          ${['#4F46E5','#7C3AED','#A855F7','#14B8A6','#3B82F6','#10B981','#F59E0B','#EC4899','#D946EF','#F43F5E'].map((c, i) => `
            <button type="button" class="color-option ${i === 0 ? 'is-selected' : ''}" data-color="${c}" style="background:${c};"></button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Footer: action buttons (ล็อคที่ด้านล่าง sheet, พื้นหลังเต็มความกว้าง)
  const footer = document.createElement('div');
  footer.className = 'form-modal__actions';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost btn--block" data-cancel>ยกเลิก</button>
    <button type="button" class="btn btn--primary btn--block" data-submit>สร้างงาน</button>
  `;

  const modal = openModal({ title: 'สร้างงานใหม่', body, footer });
  let selectedType = 'group';
  let selectedColor = '#4F46E5';

  modal.bodyEl.querySelectorAll('[data-type]').forEach(el => {
    el.addEventListener('click', () => {
      modal.bodyEl.querySelectorAll('[data-type]').forEach(x => x.classList.remove('is-selected'));
      el.classList.add('is-selected');
      selectedType = el.dataset.type;
    });
  });

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
    const title = modal.bodyEl.querySelector('#ev-title').value.trim();
    const date = modal.bodyEl.querySelector('#ev-date').value;
    if (!title) { toast('กรุณากรอกชื่องาน', 'error'); return; }
    if (!date) { toast('กรุณาเลือกวันที่', 'error'); return; }

    const ev = store.addEvent({
      type: selectedType,
      title,
      date,
      time: modal.bodyEl.querySelector('#ev-time').value,
      location: modal.bodyEl.querySelector('#ev-location').value.trim(),
      description: modal.bodyEl.querySelector('#ev-desc').value.trim(),
      departmentId: modal.bodyEl.querySelector('#ev-dept').value,
      color: selectedColor
    });
    modal.close({ skipHistory: true });
    toast(`สร้าง "${ev.title}" แล้ว`, 'success');
    window.location.hash = `#/event/${ev.id}`;
  });
}
