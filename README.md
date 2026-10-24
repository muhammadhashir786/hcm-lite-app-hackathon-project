# HCM Lite - Human Capital Management Web App

A lightweight, client-side Human Capital Management (HCM) web application built for the **Saylani Hackathon (Beginner Track - 24 October 2026)** at Zaitoon Ashraf IT Park.

---

## 🔗 Quick Links & Live Demo

- **Live Demo:** [Add your GitHub Pages / Live Link Here]
- **Repository:** [Add your GitHub Repo Link Here]

### 🔑 Default / Evaluation Credentials

The application bootstraps cleanly on first load. For evaluation or testing, use the following roles:

| Role         | Email             | Password | Access Level                                                           |
| :----------- | :---------------- | :------- | :--------------------------------------------------------------------- |
| **Admin**    | `admin@test.com`  | `1234`   | Full access (Employees CRUD, Leaves Review, Settings, Company Metrics) |
| **Employee** | `ali@company.com` | `1234`   | Self-Service (Attendance Punch, Apply Leave, Personal Payslip)         |

---

## 📌 Project Overview

HCM Lite provides complete HR lifecycle management with role-based access for **Admin** and **Employee** roles. It runs entirely on client-side vanilla web standards without any external frameworks, libraries, or backend databases. All application state is preserved via browser `localStorage`.

- **Tech Stack:** Vanilla HTML5, Modern CSS3 (Custom Design System & Mobile Responsive), Vanilla JavaScript (ES6+).
- **Persistence:** Browser `localStorage` (Zero dummy data, bootstraps empty).
- **Access Control:** Multi-page architecture with strict client-side route guards.

---

## 🚀 Key Features & Modules

### 1. First-Run Setup & Authentication

- **Empty Bootstrap:** Detects fresh browser instances and prompts first-time Admin setup (`Company Name`, `Admin Name`, `Email`, `Password`).
- **Role-Based Auth & Route Guards:** Protected multi-page routes via `protectPage()` preventing unauthorized cross-role access.
- **Auto-Provisioning:** Adding a staff member automatically creates login access for that employee.

### 2. Admin Portal

- **Dashboard:** Real-time summary metric cards (Total Employees, Today Present, Today Late, Pending Leaves) and today's attendance table.
- **Employee Management:** Add, edit, delete, live search by name/email, and filter by department.
- **Leave Requests Review:** Approve or reject applications with mandatory feedback comments.
- **Company Settings:** Configure work timings, grace periods, yearly leave quotas, and operational working days.
- **Company Announcements:** Broadcast urgent notices directly to employee dashboards.
- **Universal Payslip:** View and print payroll statements for any registered staff member.

### 3. Employee Self-Service

- **Daily Attendance Punch:** Strict 1-check-in per day enforcement, late detection, and auto-marking half-day for work under 5 hours.
- **Leave Application Modal:** Validates date ranges, counts only business working days, blocks overlapping dates, and restricts requests exceeding available quota.
- **Personal Payslip:** Transparent salary breakdown with deductions for absences and half-days, formatted for printable/PDF export.
- **Announcements Feed:** Live updates posted by administration.

### 4. Smart Helper (AI Touch)

A floating interactive assistant powered by `localStorage` keyword matching:

- **Admin Inquiries:** Total employee count, today's attendance summary, employees currently on leave, and late arrivals.
- **Employee Inquiries (Strict Privacy):** Remaining leave balance, personal attendance status, and daily punch logs.

---

## 📂 Folder Structure

```text
├── index.html              # First-run company setup & Login portal
├── README.md               # Project documentation
├── css/
│   └── style.css           # Global design system, badges, layout & responsive queries
├── js/
│   ├── storage.js          # Unified read/write helpers for localStorage
│   ├── auth.js             # Session management, authentication & route protection
│   ├── employees.js        # Staff CRUD, validation, search & department filtering
│   ├── attendance.js       # Punch in/out logic, late calculations & work hour logging
│   ├── leave.js            # Leave applications, quota depletion & approval workflows
│   └── helper.js           # Smart Helper chat widget and query parser
└── pages/
    ├── admin.html          # Admin overview, metrics, announcements & punch preview
    ├── employee.html       # Employee dashboard, punch controls & leave requests
    ├── employees.html     # Employee management & directory
    ├── leaves.html         # Admin leave approval dashboard
    ├── payslip.html        # Dynamic monthly salary statement with PDF print styling
    └── settings.html       # Configurable company timings and working day rules
```
