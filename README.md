# YP Work · Static Demo

> **สมองของสภานักเรียน** — แพลตฟอร์มภายในสำหรับจัดตารางงาน กลุ่มงาน ฝ่ายงาน และ task ย่อย
> เวอร์ชัน static demo · HTML / Vanilla JS (ES Modules) / CSS · ข้อมูลเก็บใน localStorage · PWA-ready

---

## ทำไมถึงสร้าง

ปัญหาที่สภานักเรียนเจอ: งานกระจัดกระจาย จดในกระดาษ / ส่งไลน์กัน / ใช้ Google Calendar หลายบัญชี — สุดท้ายก็ **ลืม** เพราะไม่มี "สมองกลาง"

YP Work ออกแบบมาให้เข้าครั้งเดียว เห็นทุกอย่าง: วันนี้ทำอะไร, กำลังจะถึงอะไร, งานไหนเลยกำหนด, ใครรับผิดชอบ task อะไร

เวอร์ชันนี้เป็น **demo แบบ static** เพื่อทดสอบแนวคิดก่อนสร้างเว็บจริง — ไม่ต้องต่อ database, ไม่ต้อง deploy, บันทึกข้อมูลใน browser ของผู้ใช้

---

## โครงสร้างแบบ Modular (Fantrove-style)

แยกหน้าที่ชัดเจน ตามแนวทางของ fantrove-page โดยแยก **framework layer** (cross-cutting systems) ออกจาก **views** (per-page rendering) และ **core** (data + business logic):

```
yp-work/
├── index.html                  # หน้า Login (mock 3 คน + hint กดเข้าได้ทันที)
├── app.html                    # App shell host (หลัง login)
├── manifest.webmanifest        # PWA manifest
├── service-worker.js           # PWA offline cache
│
├── assets/
│   ├── css/                    # Design tokens + base + layout + components + pages
│   │   ├── tokens.css          # ← Indigo Trust theme (สี, spacing, radius, shadow, motion) — ห้ามแก้ radius scale
│   │   ├── base.css            # Reset + utilities + skeleton
│   │   ├── layout.css          # Page shell, top-bar, bottom-nav → left-rail (responsive)
│   │   ├── components.css      # Buttons, cards, inputs, modal, toast, chips, avatars
│   │   ├── pages.css           # Page-specific styles (login, today, calendar, events, profile)
│   │   └── framework/
│   │       └── bottom-sheet.css # Bottom sheet system (transform-only animations, scroll lock)
│   │
│   ├── js/
│   │   ├── app.js              # Bootstrap only: mount shell + register routes + start router
│   │   │
│   │   ├── core/               # ── ระบบกลาง (reusable, pure logic) ──
│   │   │   ├── store.js        # localStorage wrapper + seed data + CRUD (events/tasks/users/depts)
│   │   │   ├── auth.js         # Login/logout + session guard
│   │   │   ├── router.js       # Hash-based router (no dependency)
│   │   │   └── ui.js           # Icon set, toast, modal, confirmDialog, date helpers (Thai locale)
│   │   │
│   │   ├── framework/          # ── Cross-cutting systems (Fantrove layer) ──
│   │   │   ├── app-shell.js    # createAppShell() — top-bar + main + FAB + bottom-nav DOM
│   │   │   ├── route-meta.js   # ROUTE_META table (single source of truth) + applyRouteMeta()
│   │   │   ├── avatar.js       # renderAvatar() — SVG-based initials (no copyable text node)
│   │   │   ├── bottom-sheet.js # openBottomSheet() — stacking + patch mode + ESC/back + scroll-lock
│   │   │   ├── scroll-lock.js  # Body scroll lock for modal/sheet
│   │   │   └── history-manager.js # History stack for sheets (back button integration)
│   │   │
│   │   └── views/              # ── แต่ละ view เป็น module อิสระ ──
│   │       ├── today.js        # Today dashboard (hero + งานวันนี้ + กำลังจะถึง + เลยกำหนด + ภาพรวมฝ่าย)
│   │       ├── calendar.js     # Month view + day detail (uses router.replace to avoid history pollution)
│   │       ├── profile.js      # Profile + stats + reset + logout (uses SVG avatar)
│   │       └── events/         # ── Events feature split into focused modules ──
│   │           ├── index.js       # Aggregator — public API for app.js (re-exports + renderEventDetail dispatcher)
│   │           ├── list.js        # Event list page with filters + group-by-month
│   │           ├── detail-single.js # Single-task event detail (patch mode for status)
│   │           ├── detail-group.js  # Group event detail (patch mode for task status)
│   │           ├── create.js      # Create event bottom sheet
│   │           ├── edit.js        # Edit event bottom sheet
│   │           ├── manage.js      # Manage event bottom sheet (edit/delete/add-task)
│   │           ├── add-task.js    # Add task to group event bottom sheet
│   │           ├── task-row.js    # Shared task row renderer (used by detail-group)
│   │           └── day.js         # Day view — events on a specific date
│   │
│   └── icons/
│       ├── icon.svg            # SVG source (gradient + "YP")
│       ├── icon-192.png        # PWA icon
│       └── icon-512.png        # PWA icon (maskable)
```

### หลักการออกแบบ

| หลักการ | วิธีปฏิบัติ |
|---|---|
| **Layered** | `core/` (data) → `framework/` (cross-cutting systems) → `views/` (per-page) → `app.js` (orchestration) — ไม่ skip layer |
| **Single source of truth** | `ROUTE_META` table เดียวกำหนดว่าแต่ละ route แสดงอะไรบ้าง (FAB? bottom nav? back? title?) |
| **Framework as module** | App shell + route meta + avatar + bottom sheet แยกเป็น module — `app.js` แค่ plug routes เข้า shell |
| **Patch, don't re-render** | Bottom sheet + event detail ใช้ `patch()` แทน `innerHTML = ...` เพื่อกัน re-trigger entrance animation |
| **Mobile first** | Bottom nav ที่กลายเป็น left-rail บน desktop (≥900px) — เหมือน fantrove |
| **Design tokens** | ทุกค่าสี/spacing/radius/shadow อยู่ใน `tokens.css` — เปลี่ยน theme เจาะจุดเดียว |
| **No build step** | ใช้ ES Modules ตรง ๆ — browser รันได้ทันที ไม่ต้อง webpack/vite |
| **Safe areas** | รองรับ iPhone notch / home bar ผ่าน `env(safe-area-inset-*)` |
| **Accessibility** | `prefers-reduced-motion`, `:focus-visible`, ARIA roles บน modal/dialog |
| **Copy-resistant avatar** | ใช้ SVG `<text>` แทน text node — browser ถือว่าเป็น graphic ไม่ใช่ selectable text → long-press ก็ copy ไม่ได้ |

### Architecture diagram (data flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  index.html                                                      │
│    └─ auth.login() ── redirect ──> app.html                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  app.js (orchestration)                                          │
│    1. createAppShell(user, navItems, onFABClick)                 │
│    2. mountAppShell(shell, #app)                                 │
│    3. router.register('today', applyRouteMeta → renderToday)     │
│    4. router.start()                                             │
└─────────────────────────────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐
│ framework/  │  │ core/router  │  │ views/                    │
│ app-shell   │  │ (hash route) │  │   today.js                │
│ route-meta  │  │              │  │   calendar.js             │
│ avatar      │  │  On navigate │  │   events/index.js ──┐     │
│ bottom-sheet│  │  → handler   │  │   profile.js        │     │
│ scroll-lock │  │  is called   │  └────────────────────┼─────┘
│ history-mgr │  │              │                        │
└─────────────┘  └──────────────┘  views/events/         │
                                       index.js ─────────┤
                                       list.js           │
                                       detail-single.js  │
                                       detail-group.js ──┤
                                       create.js         │
                                       edit.js           │
                                       manage.js ────────┤
                                       add-task.js       │
                                       task-row.js ──────┘
                                       day.js
```

`framework/bottom-sheet.js` is used by all `create/edit/manage/add-task` modules — sheets stack with auto z-index, support back button + ESC + backdrop tap, and can `patch()` content without re-animating.

---

## วิธีรัน

### วิธีที่ 1: เปิดไฟล์ตรง ๆ
> ⚠️ ไม่แนะนำ — browser บางตัวบล็อก ES Modules จาก `file://`

### วิธีที่ 2: Local server (แนะนำ)

```bash
cd yp-work
python3 -m http.server 8765
# หรือ: npx serve .
# แล้วเปิด http://localhost:8765
```

### วิธีที่ 3: ติดตั้งเป็น PWA
1. เปิดผ่าน HTTPS (หรือ localhost)
2. เมนู browser → "ติดตั้งแอป" / "Add to Home Screen"
3. ใช้เหมือน native app ได้เลย — มี icon, splash screen, offline

---

## บัญชีสาธิต (Login)

คลิกการ์ดในส่วน "บัญชีสาธิต" ที่หน้า Login เพื่อเข้าได้ทันที — หรือกรอก:

| บทบาท | เลขบัตรประชาชน | รหัสนักเรียน |
|---|---|---|
| ประธานสภานักเรียน | 1100501245621 | 38001 |
| รองประธานฯ | 1109902785410 | 38002 |
| เลขานุการฯ | 1112345678912 | 38003 |

---

## Features ที่ทดสอบได้

### ✅ Login
- Form กรอกเลขบัตร 13 หลัก + รหัสนักเรียน 5 หลัก (ตัวเลขเท่านั้น)
- Hint cards กดเข้าได้ทันทีเพื่อทดสอบ role/ฝ่ายต่างกัน — ใช้ SVG avatar กัน copy

### ✅ App Shell (Fantrove pattern)
- **FAB และ bottom nav แสดงเฉพาะหน้าที่เกี่ยวข้อง** — คุมด้วย `ROUTE_META` table ใน `framework/route-meta.js`
  - หน้า top-level (today/calendar/events/profile) → แสดง bottom nav + FAB (ยกเว้น profile)
  - หน้า detail (event/day) → ซ่อน bottom nav + FAB แสดงปุ่ม back แทน
- **Avatar บน top-bar** ใช้ SVG (กัน copy ตัวอักษร) — กดเข้าหน้า profile ได้

### ✅ Bottom Sheet System (Fantrove-quality)
- **เปิด/ปิดลื่นไหล** — ใช้ `transform: translateY()` เท่านั้น + double rAF trigger (ไม่กระตุก)
- **Overlay ล็อค scroll** — `touch-action: none` บน backdrop + JS prevent touchmove → แตะ overlay ไม่เลื่อน
- **Stack ซ้อนกันได้** — เปิด sheet ใหม่ทับ sheet เดิม z-index จัดอัตโนมัติ ปิดอันบนอันล่างยังอยู่
- **รองรับ hardware back / ESC / แตะ backdrop** — ผ่าน `framework/history-manager.js`
- **Patch mode** — อัพเดตเนื้อหา sheet โดยไม่ re-trigger entrance animation (`sheet.patch(newBody)`)
- **Auto-cleanup** — เมื่อ navigate หน้าใหม่ sheets ทั้งหมดปิดอัตโนมัติ

### ✅ Event Detail (Patch mode)
- เปลี่ยนสถานะ task → อัพเดตเฉพาะ task row + stat grid ไม่ re-render ทั้งหน้า
- ทำให้ animation ไม่กระตุก และ scroll position คงที่

### ✅ Calendar History
- กดปุ่มเดือนก่อน/ถัดไปใช้ `router.replace()` — ไม่เพิ่ม history stack ทำให้กด back แล้วกลับไปหน้าก่อนหน้าจริง ๆ ไม่ใช่ย้อนเดือนทีละเดือน

### ✅ Today Dashboard (หน้าหลัก)
- Hero gradient สวัสดีตามช่วงเวลา + สถิติ 3 ตัว (งานวันนี้ / กำลังจะถึง / เลยกำหนด)
- งานวันนี้ + กำลังจะถึง + งานที่เลยกำหนด (highlight แดง)
- ภาพรวมฝ่ายกิจกรรม: stat grid 4 ช่อง + สมาชิก + คำอธิบาย

### ✅ Calendar
- Month view ภาษาไทย (ปี พ.ศ.) พร้อม event indicator
- วันนี้ highlight ด้วย gradient
- กดวันที่มีงาน 1 งาน → กระโดดไป detail ทันที / หลายงาน → หน้า day view
- Navigation เดือนก่อน/ถัดไป + ปุ่ม "วันนี้" (ใช้ `router.replace` ไม่เพิ่ม history)

### ✅ Events
- List เรียงตามเดือน มี filter 5 แบบ (ทั้งหมด / กลุ่มงาน / งานเดี่ยว / ที่ฉันมีส่วนร่วม / เลยกำหนด)
- Detail: hero gradient + stat grid + คำอธิบาย + task ย่อย (สำหรับกลุ่มงาน)
- ทำ task เสร็จ: คลิกวงกลม → toggle done + line-through + อัปเดต progress อัตโนมัติ
- เพิ่ม/ลบ task ในกลุ่มงาน (ผ่าน bottom sheet ที่ stack ซ้อนได้)
- แก้ไข / ลบงาน (ผ่าน manage sheet → edit sheet)

### ✅ Profile
- Hero gradient + สถิติ 4 ตัว (งานในฝ่าย / task ที่รับผิดชอบ / เสร็จแล้ว / ค้างทำ)
- Avatar hero ใช้ SVG ขนาด 96px (กัน copy)
- ข้อมูลบัญชี (เลขบัตรประชาชนแสดงเป็น masked dots กดเพื่อ reveal)
- รีเซ็ตข้อมูลสาธิต (คืนค่าเริ่มต้น)
- ออกจากระบบ

### ✅ PWA
- Manifest ครบ: name, icons, shortcuts, theme_color
- Service worker: precache + cache-first + offline shell fallback
- ติดตั้งได้จริงบนมือถือ

---

## ข้อมูลตัวอย่าง (Seed)

| ID | ประเภท | ชื่อ | Tasks |
|---|---|---|---|
| e1 | กลุ่มงาน | วันแม่แห่งชาติ | 6 tasks (1 done, 1 ongoing, 4 todo) |
| e2 | งานเดี่ยว | ส่งรายงานการประชุมสภาฯ ครั้งที่ 3 | — |
| e3 | งานเดี่ยว | ขออนุมัติเอกสารการจัดซื้อวัสดุกิจกรรม | — |

วันที่คำนวณแบบ relative (เช่น "อีก 8 วัน") จากวันที่เปิด — ทำให้ทดสอบได้ตลอดเวลา ไม่ต้องแก้ข้อมูล

---

## ทดสอบอัตโนมัติ

ผ่านครบทั้ง 2 ชุด:

1. **Logic tests** (`scripts/test-store.mjs`) — 20/20 passed
   ทดสอบ store + auth: seed data, login, CRUD events/tasks, toggle done, reset, etc.

2. **E2E browser tests** (`scripts/test-browser.mjs`) — 26/26 passed
   ทดสอบจริงใน Chrome (Playwright): login → today → calendar → events → detail → toggle task → create → profile → logout โดยไม่มี console errors

---

## แนวทางต่อยอด (เมื่อสร้างเว็บจริง)

เมื่อ demo นี้ตอบโจทย์แล้ว ขั้นถัดไปคือแปลงเป็นเว็บจริง:

### 1. Backend + Database
- เปลี่ยน `core/store.js` จาก localStorage เป็น fetch API ที่ต่อกับ DB จริง
- API shape คงไว้: `store.getEvents()`, `store.addEvent(payload)`, `store.toggleTaskDone(eventId, taskId)` — view modules ไม่ต้องแก้
- ใช้ YP Labs (https://github.com/Jeffy2600II/yplabs) เป็น backend หลักตามที่คุณบอก

### 2. Authentication จริง
- เปลี่ยน `core/auth.js` จาก mock credential เป็นระบบจริง
- อาจใช้ OTP, หรือ SSO ของโรงเรียน

### 3. Real-time collaboration
- เพิ่ม WebSocket สำหรับ task update แบบ live (คนหนึ่งทำเสร็จ → คนอื่นเห็นทันที)
- Modular structure ทำให้เพิ่มได้โดยไม่กระทบ view modules

### 4. Notifications
- Service worker พร้อมแล้ว — เพิ่ม push notification ได้ทันที
- แจ้งเตือนก่อนงาน 1 วัน / เตือน task ที่เลยกำหนด

### 5. ฝ่ายงานเพิ่ม
- Seed มีแค่ "ฝ่ายกิจกรรม" — เพิ่มได้ผ่าน `store.js` หรือสร้างหน้า admin สำหรับจัดการ
- เพิ่มได้ในอนาคต: วิชาการ, สื่อสาร, ธุรการ, ยุทธศาสตร์

### 6. Migration path
- เมื่อเปลี่ยนเป็น Next.js: โครงสร้าง modular ของวันนี้ map ตรงกับ Next.js App Router
  - `views/today.js` → `app/(app)/today/page.tsx`
  - `views/calendar.js` → `app/(app)/calendar/page.tsx`
  - `views/events/index.js` → `app/(app)/events/page.tsx` (aggregator)
  - `views/events/list.js` → `app/(app)/events/_components/EventList.tsx`
  - `views/events/detail-*.js` → `app/(app)/events/[id]/_components/{SingleDetail,GroupDetail}.tsx`
  - `framework/app-shell.js` → `app/(app)/layout.tsx` (shell layout)
  - `framework/route-meta.js` → `lib/route-meta.ts` + generateMetadata per route
  - `framework/bottom-sheet.js` → `components/BottomSheet.tsx` (client component)
  - `framework/avatar.js` → `components/Avatar.tsx`
  - `core/store.js` → `lib/store.ts` + Server Actions
  - `core/auth.js` → `lib/auth.ts` + middleware

---

## Tech Stack

- **HTML5** — semantic markup
- **CSS3** — custom properties (design tokens), Grid, Flexbox, `env(safe-area-inset-*)`
- **Vanilla JS (ES Modules)** — no framework, no build step
- **localStorage / sessionStorage** — ข้อมูล demo
- **PWA** — manifest + service worker
- **Indigo Trust theme** — Indigo #4F46E5 + Violet #7C3AED, design tokens แยกเป็นชั้น

---

## Design Language (v3 · Fantrove-aligned)

ตั้งแต่เวอร์ชัน 3.0 เป็นต้นไป YP Work ใช้โครงสร้าง design system ตรงตาม Fantrove
เปลี่ยนเฉพาะสี (Indigo Trust) — ส่วนโครงสร้างอื่น ๆ ทั้งหมดยืมจาก Fantrove tokens.css:

| Token group | ค่า (ยืมจาก Fantrove) |
|---|---|
| **Border radius** | xs 12 · sm 17 · md 27 · lg 37 · xl 47 · pill 999 (px) |
| **Spacing** | 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 · 80 (px, 4px grid) |
| **Typography** | xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30 · 4xl 36 (px) |
| **Font weights** | 400 / 500 / 600 / 700 / 800 / 900 (มี extrabold + black) |
| **Shadows** | sm · md · lg · indigo · focus — โครงสร้างเดียวกับ Fantrove แต่ใช้ indigo tint |
| **Transitions** | fast 150ms · normal 260ms · slow 400ms (spring easing) |
| **Layout** | container-max 1110 · nav-bottom 64 · nav-top 50 · page-pad-x 1.6rem |
| **Component structure** | button (chunky border + radius xl) · card (radius lg + inset shadow) · input wrapper (height 44 + radius pill) · list-item (radius md + layered shadow) · filter-pill (radius pill + 1px border) |

สีของ YP Work ยังคงเดิม 100% — Indigo Trust theme (#4F46E5 + #7C3AED + violet)
จุดที่แตกต่างจาก Fantrove มีเพียง: เลี่ยง teal/cyan ทั้งหมด แล้วใช้ indigo tint แทน

---

## License & Credits

- Design system โครงสร้างยืมจาก [fantrove-page](https://github.com/fantrove/fantrove-page) (พัฒนามากว่า 1 ปี)
  - tokens.css · modern-styles.css · nav-core.css · home.css · setting.css · search-compact-overrides.css · top-navigation-bar.css
- สี (theme): Indigo Trust — สร้างเฉพาะสำหรับ YP Work
- Backend ในอนาคต: [YP Labs](https://github.com/Jeffy2600II/yplabs)

© 2026 YP Work · Demo สำหรับทดสอบแนวคิด
