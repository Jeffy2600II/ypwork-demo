/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/MANAGE
   assets/js/views/events/manage.js
   ───────────────────────────────────────────────────────────────
   Bottom sheet สำหรับจัดการงาน (แก้ไข + ลบ + เพิ่ม task)
   แยกจากหน้าหลัก เพื่อให้ปุ่มลบไม่อยู่ในจุดที่เข้าถึงง่ายเกิน
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import { ICON, openModal, toast, confirmDialog } from '../../core/ui.js';
import { openEditEventModal } from './edit.js';
import { openAddTaskModal } from './add-task.js';
import { openEditTaskModal } from './edit-task.js';

/**
 * @param {object} ev — event to manage
 * @param {function} [onAction] — เรียกหลังจาก action เสร็จ (edit/add-task)
 */
export function openManageSheet(ev, onAction) {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="manage-sheet">
      <button class="manage-sheet__action" data-action="edit" type="button">
        <div class="manage-sheet__icon">${ICON.edit}</div>
        <div class="manage-sheet__body">
          <div class="manage-sheet__title">แก้ไขงาน</div>
          <div class="manage-sheet__desc">เปลี่ยนชื่องาน วันที่ เวลา สถานที่ รายละเอียด สี</div>
        </div>
        ${ICON.chevronRight}
      </button>
      ${ev.type === 'group' ? `
        <button class="manage-sheet__action" data-action="add-task" type="button">
          <div class="manage-sheet__icon">${ICON.plus}</div>
          <div class="manage-sheet__body">
            <div class="manage-sheet__title">เพิ่ม task ย่อย</div>
            <div class="manage-sheet__desc">สร้าง task ใหม่ในกลุ่มงานนี้</div>
          </div>
          ${ICON.chevronRight}
        </button>
        ${ev.tasks && ev.tasks.length > 0 ? `
          <button class="manage-sheet__action" data-action="edit-task" type="button">
            <div class="manage-sheet__icon">${ICON.edit}</div>
            <div class="manage-sheet__body">
              <div class="manage-sheet__title">แก้ไข task ย่อย</div>
              <div class="manage-sheet__desc">เลือก task ที่ต้องการแก้ไข (${ev.tasks.length} รายการ)</div>
            </div>
            ${ICON.chevronRight}
          </button>
        ` : ''}
      ` : ''}
      <button class="manage-sheet__action manage-sheet__action--danger" data-action="delete" type="button">
        <div class="manage-sheet__icon manage-sheet__icon--danger">${ICON.trash}</div>
        <div class="manage-sheet__body">
          <div class="manage-sheet__title" style="color:#BE123C;">ลบงานนี้</div>
          <div class="manage-sheet__desc">${ev.type === 'group' ? `จะลบ task ทั้งหมด ${ev.tasks?.length || 0} รายการด้วย` : 'จะลบงานนี้ออกจากระบบ'} — ไม่สามารถย้อนกลับได้</div>
        </div>
        ${ICON.chevronRight}
      </button>
    </div>
  `;

  const modal = openModal({ title: 'จัดการงาน', body });

  modal.bodyEl.querySelector('[data-action="edit"]').addEventListener('click', () => {
    modal.close();
    setTimeout(() => openEditEventModal(ev, onAction), 280);
  });

  if (ev.type === 'group') {
    modal.bodyEl.querySelector('[data-action="add-task"]')?.addEventListener('click', () => {
      modal.close();
      setTimeout(() => openAddTaskModal(ev, onAction), 280);
    });

    modal.bodyEl.querySelector('[data-action="edit-task"]')?.addEventListener('click', () => {
      modal.close();
      setTimeout(() => _openTaskPicker(ev, onAction), 280);
    });
  }

  modal.bodyEl.querySelector('[data-action="delete"]').addEventListener('click', () => {
    modal.close();
    setTimeout(async () => {
      const ok = await confirmDialog({
        title: 'ลบงานนี้?',
        message: `ลบ "${ev.title}"${ev.type === 'group' && ev.tasks?.length ? ` และ task ทั้งหมด ${ev.tasks.length} รายการ` : ''} — ไม่สามารถย้อนกลับได้`,
        confirmText: 'ลบงาน',
        danger: true
      });
      if (ok) {
        store.deleteEvent(ev.id);
        toast('ลบงานแล้ว', 'success');
        window.location.hash = '#/events';
      }
    }, 280);
  });
}

/* ── Task picker — แสดงรายการ task ให้เลือกเพื่อแก้ไข ── */
function _openTaskPicker(ev, onAction) {
  const tasks = ev.tasks || [];
  if (tasks.length === 0) {
    toast('ยังไม่มี task ในงานนี้', 'info');
    return;
  }

  const body = document.createElement('div');
  body.className = 'manage-task-picker';
  body.innerHTML = tasks.map(t => {
    const statusLabel = t.status === 'done' ? 'เสร็จแล้ว' : t.status === 'ongoing' ? 'กำลังทำ' : 'รอทำ';
    return `
      <button class="manage-task-picker__item" data-task-id="${t.id}" type="button">
        <div class="task-status-dot task-status-dot--${t.status}"></div>
        <div class="manage-task-picker__body">
          <div class="manage-task-picker__title">${t.title.replace(/</g, '&lt;')}</div>
          <div class="manage-task-picker__meta">${statusLabel}${t.priority === 'high' ? ' · เร่งด่วน' : ''}${t.dueDate ? ' · มีกำหนด' : ''}</div>
        </div>
        ${ICON.chevronRight}
      </button>
    `;
  }).join('');

  const pickerModal = openModal({ title: 'เลือก task ที่จะแก้ไข', body });

  pickerModal.bodyEl.querySelectorAll('[data-task-id]').forEach(el => {
    el.addEventListener('click', () => {
      const taskId = el.dataset.taskId;
      pickerModal.close();
      setTimeout(() => openEditTaskModal(ev, taskId, onAction), 280);
    });
  });
}
