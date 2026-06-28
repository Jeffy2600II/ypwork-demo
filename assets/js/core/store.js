/* ═══════════════════════════════════════════════════════════════
   YP WORK · CORE/STORE
   assets/js/core/store.js
   localStorage wrapper + seed data + CRUD สำหรับ events/tasks/users/departments
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'yp-work:data:v2';
const SESSION_KEY = 'yp-work:session:v2';

/* ── Seed Data ──
   ฝ่ายงาน — ประธาน/รอง/เลขา อยู่ "ฝ่ายบริหาร"
   หัวหน้าฝ่ายอื่น ๆ แยกตามฝ่ายของตน
   ออกแบบให้เพิ่ม/ลดฝ่ายง่าย — เพิ่มได้ใน array departments ได้เลย */
const SEED = {
  users: [
    /* ── ฝ่ายบริหาร ── */
    {
      id: 'u1',
      name: 'ธนกร ศรีสุข',
      role: 'president',
      roleLabel: 'ประธานสภานักเรียน',
      departmentId: 'd1',
      nationalId: '1100501245621',
      studentCode: '38001',
      color: '#4F46E5'
    },
    {
      id: 'u2',
      name: 'พิมพ์ใจ รักไทย',
      role: 'vice_president',
      roleLabel: 'รองประธานสภานักเรียน',
      departmentId: 'd1',
      nationalId: '1109902785410',
      studentCode: '38002',
      color: '#7C3AED'
    },
    {
      id: 'u3',
      name: 'ก้องเกียรติ ใฝ่รู้',
      role: 'secretary',
      roleLabel: 'เลขานุการสภานักเรียน',
      departmentId: 'd1',
      nationalId: '1112345678912',
      studentCode: '38003',
      color: '#A855F7'
    },
    /* ── ฝ่ายกิจกรรม ── */
    {
      id: 'u4',
      name: 'ปวีณา สดใส',
      role: 'head',
      roleLabel: 'หัวหน้าฝ่ายกิจกรรม',
      departmentId: 'd2',
      nationalId: '1109903456781',
      studentCode: '38004',
      color: '#14B8A6'
    },
    {
      id: 'u5',
      name: 'ภาณุพงศ์ ดีงาม',
      role: 'member',
      roleLabel: 'สมาชิกฝ่ายกิจกรรม',
      departmentId: 'd2',
      nationalId: '1112345678923',
      studentCode: '38005',
      color: '#3B82F6'
    },
    /* ── ฝ่ายวิชาการ ── */
    {
      id: 'u6',
      name: 'อนพัทย์ รักษ์เรียน',
      role: 'head',
      roleLabel: 'หัวหน้าฝ่ายวิชาการ',
      departmentId: 'd3',
      nationalId: '1109904567812',
      studentCode: '38006',
      color: '#10B981'
    },
    /* ── ฝ่ายทำเนียบ ── */
    {
      id: 'u7',
      name: 'ชนัญดา บันทึกดี',
      role: 'head',
      roleLabel: 'หัวหน้าฝ่ายทำเนียบ',
      departmentId: 'd4',
      nationalId: '1109905678123',
      studentCode: '38007',
      color: '#F59E0B'
    },
    /* ── ฝ่ายการเงิน ── */
    {
      id: 'u8',
      name: 'กิตติพงษ์ นับเลข',
      role: 'head',
      roleLabel: 'หัวหน้าฝ่ายการเงิน',
      departmentId: 'd5',
      nationalId: '1109906781234',
      studentCode: '38008',
      color: '#EC4899'
    },
    /* ── ฝ่ายประชาสัมพันธ์ ── */
    {
      id: 'u9',
      name: 'วรินทร เสียงดี',
      role: 'head',
      roleLabel: 'หัวหน้าฝ่ายประชาสัมพันธ์',
      departmentId: 'd6',
      nationalId: '1109907891235',
      studentCode: '38009',
      color: '#D946EF'
    }
  ],
  departments: [
    {
      id: 'd1',
      name: 'ฝ่ายบริหาร',
      color: '#4F46E5',
      icon: '👥',
      description: 'ประธาน รองประธาน และเลขานุการสภานักเรียน — ดูแลภาพรวมและประสานงานระหว่างฝ่าย'
    },
    {
      id: 'd2',
      name: 'ฝ่ายกิจกรรม',
      color: '#14B8A6',
      icon: '🎨',
      description: 'ดูแลกิจกรรมวันสำคัญ พิธีการ การแสดง และการจัดงานของโรงเรียน'
    },
    {
      id: 'd3',
      name: 'ฝ่ายวิชาการ',
      color: '#10B981',
      icon: '📚',
      description: 'ดูแลการแข่งขันทางวิชาการ การส่งเสริมความรู้ และร่วมมือกับครูที่ปรึกษาวิชาการ'
    },
    {
      id: 'd4',
      name: 'ฝ่ายทำเนียบ',
      color: '#F59E0B',
      icon: '📋',
      description: 'ดูแลเอกสาร การประชุม การเก็บบันทึก และระเบียบต่าง ๆ ของสภานักเรียน'
    },
    {
      id: 'd5',
      name: 'ฝ่ายการเงิน',
      color: '#EC4899',
      icon: '💰',
      description: 'ดูแลงบประมาณ การเบิกจ่าย การรับบริจาค และการระดมทุนของสภานักเรียน'
    },
    {
      id: 'd6',
      name: 'ฝ่ายประชาสัมพันธ์',
      color: '#D946EF',
      icon: '📢',
      description: 'ดูแลการประชาสัมพันธ์ โซเชียลมีเดีย ป้ายประกาศ และการติดต่อกับภายนอก'
    }
  ],
  events: [
    {
      id: 'e1',
      type: 'group',
      title: 'วันแม่แห่งชาติ',
      date: getRelativeDate(8),
      endDate: null,
      time: '08:00',
      location: 'หอประชุมโรงเรียน',
      description: 'จัดกิจกรรมเฉลิมพระเกียรติพระบรมราชชนนี ในวันแม่แห่งชาติ มีการแสดง การร้องเพลง และการมอบพวงมาลัย',
      departmentId: 'd2',
      status: 'planning',
      color: '#14B8A6',
      createdAt: getRelativeDate(-3),
      tasks: [
        { id: 't1', title: 'จองหอประชุมและเวที', assigneeId: 'u4', dueDate: getRelativeDate(2), status: 'done', priority: 'high', estimatedTime: '1 วัน', tags: ['สถานที่'], notes: '' },
        { id: 't2', title: 'ซ้อมร้องเพลงพระมหากรุณาธิคุณ', assigneeId: 'u5', dueDate: getRelativeDate(4), status: 'ongoing', priority: 'medium', estimatedTime: '3 วัน', tags: ['การแสดง'], notes: 'ซ้อมทุกวันหลังเลิกเรียน 16.30–18.00 น.' },
        { id: 't3', title: 'ทำพวงมาลัยดอกไม้ 80 ชุด', assigneeId: 'u4', dueDate: getRelativeDate(6), status: 'todo', priority: 'medium', estimatedTime: '2 วัน', tags: ['วัสดุ'], notes: '' },
        { id: 't4', title: 'เตรียมอุปกรณ์เสียงและหน้าจอ LED', assigneeId: 'u5', dueDate: getRelativeDate(5), status: 'todo', priority: 'high', estimatedTime: '1 วัน', tags: ['อุปกรณ์'], notes: '' },
        { id: 't5', title: 'แจกจ่ายของที่ระลึกให้นักเรียน', assigneeId: 'u4', dueDate: getRelativeDate(8), status: 'todo', priority: 'low', estimatedTime: '3 ชม.', tags: [], notes: '' },
        { id: 't6', title: 'สรุปรายงานการจัดกิจกรรมส่งครูที่ปรึกษา', assigneeId: 'u3', dueDate: getRelativeDate(10), status: 'todo', priority: 'medium', estimatedTime: '1 วัน', tags: ['เอกสาร'], notes: 'ส่งให้ฝ่ายบริหารตรวจก่อนเสมอ' }
      ]
    },
    {
      id: 'e2',
      type: 'task',
      title: 'ส่งรายงานการประชุมสภานักเรียนครั้งที่ 3',
      date: getRelativeDate(2),
      endDate: null,
      time: '16:30',
      location: 'ห้องสภานักเรียน',
      description: 'ครูที่ปรึกษามอบหมายให้สรุปรายงานการประชุมและส่งกลับภายในวันที่กำหนด',
      departmentId: 'd4',
      status: 'todo',
      color: '#F59E0B',
      createdAt: getRelativeDate(-2),
      tasks: []
    },
    {
      id: 'e3',
      type: 'task',
      title: 'ขออนุมัติเอกสารการจัดซื้อวัสดุกิจกรรม',
      date: getRelativeDate(1),
      endDate: null,
      time: '10:00',
      location: 'ห้องธุรการ',
      description: 'นำใบเสนอราคาและแผนงานไปขอลงนามผู้อำนวยการเพื่ออนุมัติงบประมาณ',
      departmentId: 'd5',
      status: 'todo',
      color: '#EC4899',
      createdAt: getRelativeDate(-1),
      tasks: []
    },
    {
      id: 'e4',
      type: 'task',
      title: 'ออกแบบป้ายประกาศวันแม่',
      date: getRelativeDate(3),
      endDate: null,
      time: '',
      location: '',
      description: 'ออกแบบป้ายประกาศเผยแพร่กิจกรรมวันแม่ฯ ที่จะจัดขึ้น ลงที่ป้ายหน้าเสาธงและหน้าห้องกิจกรรม',
      departmentId: 'd6',
      status: 'todo',
      color: '#D946EF',
      createdAt: getRelativeDate(-1),
      tasks: []
    },
    {
      id: 'e5',
      type: 'group',
      title: 'การแข่งขันตอบปัญหาวิชาการระดับชั้น',
      date: getRelativeDate(15),
      endDate: null,
      time: '09:00',
      location: 'ห้องประชุม 1',
      description: 'จัดการแข่งขันตอบปัญหาวิชาการ คัดเลือกผู้แทนระดับชั้นมัธยมศึกษาตอนต้น',
      departmentId: 'd3',
      status: 'planning',
      color: '#10B981',
      createdAt: getRelativeDate(-1),
      tasks: [
        { id: 't7', title: 'จัดทำข้อสอบ', assigneeId: 'u6', dueDate: getRelativeDate(8), status: 'ongoing', priority: 'high', estimatedTime: '3 วัน', tags: ['เนื้อหา'], notes: '' },
        { id: 't8', title: 'ประสานงานคณะกรรมการตัดสิน', assigneeId: 'u6', dueDate: getRelativeDate(10), status: 'todo', priority: 'medium', estimatedTime: '1 วัน', tags: [], notes: '' },
        { id: 't9', title: 'เตรียมรางวัลและเกียรติบัตร', assigneeId: 'u6', dueDate: getRelativeDate(13), status: 'todo', priority: 'low', estimatedTime: '1 วัน', tags: ['รางวัล'], notes: '' }
      ]
    }
  ]
};

/* ── Date helper (returns YYYY-MM-DD) ── */
function getRelativeDate(offsetDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ── Internal state ── */
let _data = null;
const _listeners = new Set();

function _load() {
  if (_data) return _data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _data = JSON.parse(raw);
      return _data;
    }
  } catch (e) {
    console.warn('[store] load failed, reseeding', e);
  }
  _data = structuredClone(SEED);
  _persist();
  return _data;
}

function _persist() {
  if (!_data) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
  } catch (e) {
    console.error('[store] persist failed', e);
  }
  _notify();
}

function _notify() {
  for (const fn of _listeners) {
    try { fn(_data); } catch (e) { console.error(e); }
  }
}

/* ── Public API ── */
export const store = {
  /* Subscription */
  subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },

  /* Reset to seed (ใช้สำหรับ "รีเซ็ตข้อมูลสาธิต") */
  reset() {
    _data = structuredClone(SEED);
    _persist();
  },

  /* Getters */
  getUsers() { return _load().users; },
  getUserById(id) { return _load().users.find(u => u.id === id) || null; },
  getUserByCredentials(nationalId, studentCode) {
    return _load().users.find(u =>
      u.nationalId === nationalId && u.studentCode === studentCode
    ) || null;
  },
  getDepartments() { return _load().departments; },
  getDepartmentById(id) { return _load().departments.find(d => d.id === id) || null; },
  getEvents() { return _load().events; },
  getEventById(id) { return _load().events.find(e => e.id === id) || null; },

  getEventsByDate(dateStr) {
    return _load().events.filter(e => e.date === dateStr);
  },

  getEventsBetween(startStr, endStr) {
    return _load().events.filter(e => e.date >= startStr && e.date <= endStr);
  },

  getUpcomingEvents(limit = 5) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    return _load().events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  },

  getTodaysEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    return _load().events.filter(e => e.date === todayStr);
  },

  getOverdueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const overdue = [];
    for (const ev of _load().events) {
      for (const t of ev.tasks || []) {
        if (t.dueDate && t.dueDate < todayStr && t.status !== 'done') {
          overdue.push({ ...t, eventId: ev.id, eventTitle: ev.title });
        }
      }
    }
    return overdue;
  },

  /* Mutations: Events */
  addEvent(payload) {
    const ev = {
      id: 'e' + Date.now(),
      type: payload.type || 'group',
      title: payload.title?.trim() || 'ไม่มีชื่องาน',
      date: payload.date,
      endDate: payload.endDate || null,
      time: payload.time || '',
      location: payload.location || '',
      description: payload.description || '',
      departmentId: payload.departmentId || 'd1',
      status: payload.status || 'todo',
      color: payload.color || '#4F46E5',
      createdAt: new Date().toISOString().slice(0, 10),
      tasks: payload.type === 'group' ? (payload.tasks || []) : []
    };
    _load().events.push(ev);
    _persist();
    return ev;
  },

  /* ตั้งสถานะของงานเดี่ยวโดยตรง (ไม่กระทบ task list เพราะงานเดี่ยวไม่มี task) */
  setEventStatus(eventId, status) {
    const ev = _load().events.find(e => e.id === eventId);
    if (!ev) return null;
    // ป้องกันการ override สถานะของกลุ่มงานที่ควรคำนวณจาก task
    if (ev.type === 'group' && ev.tasks && ev.tasks.length > 0) {
      console.warn('[store] setEventStatus: group events with tasks should use task status');
      return null;
    }
    ev.status = status;
    _persist();
    return ev;
  },

  /* ตั้งสถานะ task โดยตรง (todo/ongoing/done) — ใช้กับ task ในกลุ่มงาน */
  setTaskStatus(eventId, taskId, status) {
    const ev = _load().events.find(e => e.id === eventId);
    if (!ev || !ev.tasks) return null;
    const t = ev.tasks.find(t => t.id === taskId);
    if (!t) return null;
    t.status = status;
    _recomputeEventStatus(ev);
    _persist();
    return t;
  },

  updateEvent(id, patch) {
    const data = _load();
    const idx = data.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    data.events[idx] = { ...data.events[idx], ...patch };
    _persist();
    return data.events[idx];
  },

  deleteEvent(id) {
    const data = _load();
    data.events = data.events.filter(e => e.id !== id);
    _persist();
  },

  /* Mutations: Tasks (within group events)
     Payload accepts { title, assigneeId, dueDate, notes, priority, estimatedTime, tags }
     — flexible form data, mirrors the create-event form's richness.
     Backward-compat: if second arg is a string, treat it as the title. */
  addTask(eventId, payload) {
    const ev = _load().events.find(e => e.id === eventId);
    if (!ev) return null;
    if (!ev.tasks) ev.tasks = [];
    if (typeof payload === 'string') payload = { title: payload };
    const t = {
      id: 't' + Date.now(),
      title: (payload.title || '').trim(),
      assigneeId: payload.assigneeId || null,
      dueDate: payload.dueDate || null,
      notes: payload.notes || '',
      priority: payload.priority || 'medium',       // low | medium | high
      estimatedTime: payload.estimatedTime || '',    // free-form text e.g. "2 ชม."
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      status: 'todo'
    };
    ev.tasks.push(t);
    _persist();
    return t;
  },

  updateTask(eventId, taskId, patch) {
    const ev = _load().events.find(e => e.id === eventId);
    if (!ev || !ev.tasks) return null;
    const idx = ev.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    ev.tasks[idx] = { ...ev.tasks[idx], ...patch };
    // Auto-update event status based on tasks
    _recomputeEventStatus(ev);
    _persist();
    return ev.tasks[idx];
  },

  toggleTaskDone(eventId, taskId) {
    const ev = _load().events.find(e => e.id === eventId);
    if (!ev || !ev.tasks) return null;
    const t = ev.tasks.find(t => t.id === taskId);
    if (!t) return null;
    t.status = t.status === 'done' ? 'todo' : 'done';
    _recomputeEventStatus(ev);
    _persist();
    return t;
  },

  deleteTask(eventId, taskId) {
    const ev = _load().events.find(e => e.id === eventId);
    if (!ev || !ev.tasks) return;
    ev.tasks = ev.tasks.filter(t => t.id !== taskId);
    _persist();
  },

  /* Session — ใช้ localStorage แทน sessionStorage
     เหตุผล: sessionStorage อาจสูญหายเมื่อ navigate ข้ามหน้า
     โดยเฉพาะใน PWA standalone mode หรือเมื่อ service worker
     intercept navigation request → ทำให้เกิด redirect loop */
  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  setSession(user) {
    const safe = {
      id: user.id,
      name: user.name,
      role: user.role,
      roleLabel: user.roleLabel,
      departmentId: user.departmentId,
      color: user.color,
      nationalId: user.nationalId || '',
      studentCode: user.studentCode || '',
      loginAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
    return safe;
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
};

/* Auto-update event status from tasks — เฉพาะ group events ที่มี task */
function _recomputeEventStatus(ev) {
  if (ev.type !== 'group') return;
  if (!ev.tasks || ev.tasks.length === 0) return;
  const total = ev.tasks.length;
  const done = ev.tasks.filter(t => t.status === 'done').length;
  if (done === 0) ev.status = 'planning';
  else if (done === total) ev.status = 'done';
  else ev.status = 'ongoing';
}

/* Expose for debugging */
window.__ypStore = store;
