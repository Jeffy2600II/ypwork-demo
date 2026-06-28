/* ═══════════════════════════════════════════════════════════════
   YP WORK · VIEWS/EVENTS/TASK-ROW
   assets/js/views/events/task-row.js
   ───────────────────────────────────────────────────────────────
   Render row ของ task ในกลุ่มงาน (เอาไว้ใช้ทั้งใน detail + manage)
   ═══════════════════════════════════════════════════════════════ */

import { store } from '../../core/store.js';
import {
  ICON,
  escapeHtml,
  relativeDay,
  isPast,
  statusLabel
} from '../../core/ui.js';
import { renderAvatar } from '../../framework/avatar.js';

/**
 * @param {object} task — task object from store
 * @param {string} eventId — parent event id (for delete)
 * @returns {string} HTML string
 */
export function renderTaskRow(task, eventId) {
  const assignee = task.assigneeId ? store.getUserById(task.assigneeId) : null;
  const dueLabel = task.dueDate ? relativeDay(task.dueDate) : '';
  const overdue = task.dueDate && isPast(task.dueDate) && task.status !== 'done';
  const priority = task.priority || 'medium';
  const priorityLabel = priority === 'high' ? 'เร่งด่วน' : priority === 'low' ? 'ไม่เร่ง' : 'ปกติ';
  const priorityClass = `is-priority-${priority}`;
  const tags = Array.isArray(task.tags) ? task.tags : [];

  const statusIconMap = {
    todo: ICON.clock,
    ongoing: ICON.refresh,
    done: ICON.check
  };
  const statusIcon = statusIconMap[task.status] || ICON.clock;

  return `
    <div class="task-row ${task.status === 'done' ? 'is-done' : ''}" data-task-id="${task.id}">
      <div class="task-status-dot task-status-dot--${task.status}"></div>
      <div class="task-row__body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-row__meta">
          <span class="task-row__chip task-row__status task-row__status--${task.status}">
            ${statusIcon}
            ${statusLabel(task.status)}
          </span>
          ${priority !== 'medium' ? `
            <span class="task-row__chip task-row__priority ${priorityClass}">
              ${priorityLabel}
            </span>
          ` : ''}
          ${assignee ? `
            <span class="task-row__chip task-row__chip--assignee" data-no-copy>
              <span class="task-row__avatar">${renderAvatar({ name: assignee.name, color: assignee.color, size: 16, className: 'task-row__avatar-img' })}</span>
              ${escapeHtml(assignee.name.split(' ')[0])}
            </span>
          ` : ''}
          ${dueLabel ? `
            <span class="task-row__chip task-row__chip--due ${overdue ? 'is-overdue' : ''}">
              ${overdue ? ICON.alert : ICON.calendar}
              <span class="task-row__chip-label">กำหนด</span>
              ${dueLabel}
            </span>
          ` : ''}
          ${task.estimatedTime ? `
            <span class="task-row__chip task-row__chip--est">
              ${ICON.clock}
              <span class="task-row__chip-label">ใช้เวลา</span>
              ${escapeHtml(task.estimatedTime)}
            </span>
          ` : ''}
          ${tags.map(t => `<span class="task-row__tag">#${escapeHtml(t)}</span>`).join('')}
        </div>
        ${task.notes ? `
          <div class="task-row__notes">${escapeHtml(task.notes)}</div>
        ` : ''}
      </div>
      <div class="task-row__actions">
        <button class="task-row__edit" data-task-edit="${task.id}" aria-label="แก้ไข task" type="button">${ICON.edit || ICON.refresh}</button>
        <button class="task-row__delete" data-task-delete="${task.id}" aria-label="ลบ task" type="button">${ICON.trash}</button>
      </div>
    </div>
  `;
}
