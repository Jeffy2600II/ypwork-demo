/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/DETAIL-GROUP
   assets/js/views/events/detail-group.js
   ───────────────────────────────────────────────────────────────
   หน้ารายละเอียดกลุ่มงาน
   - hero + stats + task list + เพิ่ม/ลบ task
   - ใช้ patch mode: เปลี่ยนสถานะ task → อัพเดตเฉพาะ task row + stat
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import {
  ICON,
  escapeHtml,
  formatDate,
  eventProgress,
  toast,
  confirmDialog,
  openStatusPicker
} from '../../core/ui.js';
import { renderTaskRow } from './task-row.js';
import { openAddTaskModal } from './add-task.js';
import { openEditTaskModal } from './edit-task.js';
import { openManageSheet } from './manage.js';

/**
 * @param {HTMLElement} main
 * @param {object} ev — event object
 * @param {object} dept — department object
 * @param {Array} params — router params
 */
export function renderGroupEventDetail(main, ev, dept, params) {
  // ถ้า main มีเนื้อหาอยู่แล้วและเป็น event เดียวกัน → ใช้ patch แทน re-render
  const existing = main.querySelector(`[data-event-detail="${ev.id}"]`);
  if (existing) {
    patchGroupEventDetail(main, ev, dept);
    return;
  }

  main.innerHTML = `
    <div class="page container" data-event-detail="${ev.id}" style="--accent:${ev.color}">
      <div class="detail-hero">
        <div class="detail-hero__type">
          ${ICON.layers}
          กลุ่มงาน
        </div>
        <h1 class="detail-hero__title">${escapeHtml(ev.title)}</h1>
        <div class="detail-hero__meta">
          <span class="detail-hero__meta-item">${ICON.calendar} ${formatDate(ev.date, { long: true })}</span>
          ${ev.time ? `<span class="detail-hero__meta-item">${ICON.clock} ${escapeHtml(ev.time)}</span>` : ''}
          ${ev.location ? `<span class="detail-hero__meta-item">${ICON.mapPin} ${escapeHtml(ev.location)}</span>` : ''}
        </div>
      </div>

      <div class="stat-grid" data-stat-grid style="margin-bottom:10px;">
        ${renderGroupStats(ev, dept)}
      </div>

      ${ev.description ? `
        <div class="detail-section">
          <h2 class="detail-section__title">รายละเอียด</h2>
          <div class="detail-desc">${escapeHtml(ev.description)}</div>
        </div>
      ` : ''}

      <div class="detail-section">
        <h2 class="detail-section__title">
          Task ย่อย
          <span class="detail-section__count" data-task-count></span>
        </h2>
        <div class="card card--tasklist" data-task-list>
          <button class="add-task-btn" id="add-task-btn" type="button">
            ${ICON.plus}
            <span>เพิ่ม task</span>
          </button>
        </div>
        <div class="task-list-hint">แตะ task เพื่อเปลี่ยนสถานะ</div>
      </div>

      <div class="detail-section">
        <button class="btn btn--secondary btn--block" id="manage-btn" type="button">
          ${ICON.edit} จัดการงาน
        </button>
      </div>
    </div>
  `;

  patchGroupEventDetail(main, ev, dept);
  bindGroupEventDetail(main, ev, dept, params);
}

export function renderGroupStats(ev, dept) {
  const totalTasks = ev.tasks?.length || 0;
  const doneTasks = ev.tasks?.filter(t => t.status === 'done').length || 0;
  const progress = eventProgress(ev);
  return `
    <div class="stat">
      <div class="stat__icon">${ICON.layers}</div>
      <div class="stat__value">${totalTasks}</div>
      <div class="stat__label">จำนวน task</div>
    </div>
    <div class="stat">
      <div class="stat__icon" style="background:rgba(16,185,129,0.12); color:#047857;">${ICON.check}</div>
      <div class="stat__value">${doneTasks}</div>
      <div class="stat__label">เสร็จแล้ว</div>
    </div>
    <div class="stat">
      <div class="stat__icon">${ICON.clock}</div>
      <div class="stat__value">${progress}%</div>
      <div class="stat__label">ความคืบหน้า</div>
    </div>
    <div class="stat">
      <div class="stat__icon" style="background:${dept?.color || '#4F46E5'}1f; color:${dept?.color || '#4F46E5'};">${escapeHtml(dept?.icon || '◎')}</div>
      <div class="stat__value" style="font-size:var(--yp-text-base); line-height:1.2; margin-top:2px;">${escapeHtml(dept ? dept.name.replace('ฝ่าย', '') : '-')}</div>
      <div class="stat__label">ฝ่ายรับผิดชอบ</div>
    </div>
  `;
}

/* Patch mode สำหรับกลุ่มงาน — อัพเดต stat + task list โดยไม่ re-render ทั้งหน้า */
export function patchGroupEventDetail(main, ev, dept) {
  // 1. Stat grid
  const statGrid = main.querySelector('[data-stat-grid]');
  if (statGrid) {
    statGrid.innerHTML = renderGroupStats(ev, dept);
  }

  // 2. Task count badge
  const totalTasks = ev.tasks?.length || 0;
  const doneTasks = ev.tasks?.filter(t => t.status === 'done').length || 0;
  const countBadge = main.querySelector('[data-task-count]');
  if (countBadge) countBadge.textContent = `${doneTasks}/${totalTasks}`;

  // 3. Task list — re-render แค่ใน card
  const taskList = main.querySelector('[data-task-list]');
  if (taskList) {
    // เก็บ add-task-btn ไว้ เพราะมันเป็น last child
    const addBtn = taskList.querySelector('#add-task-btn');
    taskList.innerHTML = '';

    if (totalTasks === 0) {
      taskList.insertAdjacentHTML('afterbegin', `
        <div class="task-empty">
          <div class="task-empty__icon">${ICON.layers}</div>
          <div class="task-empty__title">ยังไม่มี task</div>
          <div class="task-empty__desc">กดปุ่มด้านล่างเพื่อเพิ่ม task แรกให้งานนี้</div>
        </div>
      `);
    } else {
      taskList.insertAdjacentHTML('afterbegin', ev.tasks.map(t => renderTaskRow(t, ev.id)).join(''));
    }

    if (addBtn) taskList.appendChild(addBtn);
  }

  // 4. Re-bind task row handlers
  bindTaskRows(main, ev, dept);
}

function bindTaskRows(main, ev, dept) {
  main.querySelectorAll('[data-task-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      // ถ้า click มาจากปุ่ม edit/delete → ไม่เปิด status picker
      if (e.target.closest('[data-task-delete]')) return;
      if (e.target.closest('[data-task-edit]')) return;
      const taskId = el.dataset.taskId;
      const task = ev.tasks.find(t => t.id === taskId);
      if (!task) return;
      openStatusPicker(task.status, (newStatus) => {
        // อัพเดต task ใน ev object เพื่อใช้ตอน patch
        task.status = newStatus;
        store.setTaskStatus(ev.id, taskId, newStatus);
        // อัพเดต status ของ ev จาก store (อาจเปลี่ยนเพราะ auto-recompute)
        const updated = store.getEventById(ev.id);
        if (updated) {
          ev.status = updated.status;
        }
        toast(`เปลี่ยนสถานะ task แล้ว`, 'success');
        patchGroupEventDetail(main, ev, dept);
      }, { title: 'สถานะของ task' });
    });
  });

  // Edit task handler
  main.querySelectorAll('[data-task-edit]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = el.dataset.taskEdit;
      openEditTaskModal(ev, taskId, () => {
        // reload ev จาก store
        const updated = store.getEventById(ev.id);
        if (updated) {
          Object.assign(ev, updated);
          patchGroupEventDetail(main, ev, dept);
        }
      });
    });
  });

  main.querySelectorAll('[data-task-delete]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = el.dataset.taskDelete;
      const ok = await confirmDialog({
        title: 'ลบ task?',
        message: 'คุณแน่ใจหรือไม่ว่าต้องการลบ task นี้',
        confirmText: 'ลบ',
        danger: true
      });
      if (ok) {
        store.deleteTask(ev.id, taskId);
        // อัพเดต ev object
        ev.tasks = ev.tasks.filter(t => t.id !== taskId);
        const updated = store.getEventById(ev.id);
        if (updated) ev.status = updated.status;
        toast('ลบแล้ว', 'success');
        patchGroupEventDetail(main, ev, dept);
      }
    });
  });
}

function bindGroupEventDetail(main, ev, dept, params) {
  main.querySelector('#add-task-btn')?.addEventListener('click', () => {
    openAddTaskModal(ev, () => {
      // reload ev จาก store
      const updated = store.getEventById(ev.id);
      if (updated) {
        Object.assign(ev, updated);
        patchGroupEventDetail(main, ev, dept);
      }
    });
  });

  main.querySelector('#manage-btn')?.addEventListener('click', () => {
    openManageSheet(ev, () => {
      const updated = store.getEventById(ev.id);
      if (!updated) {
        window.location.hash = '#/events';
        return;
      }
      Object.assign(ev, updated);
      main.querySelector(`[data-event-detail="${ev.id}"]`)?.remove();
      renderGroupEventDetail(main, ev, dept, params);
    });
  });
}
