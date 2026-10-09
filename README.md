# TerraLink

**A wetland monitoring and response workspace for NGO project teams in Bangladesh.**

TerraLink turns a possible change in a wetland, seen from satellite imagery, into a documented, accountable and costed field response. Review, task assignment, scheduling, expenses, communication and reporting all happen in one ERP-style workspace instead of across spreadsheets, chat groups and email threads.

| | |
|---|---|
| **Live demo** | [https://terralink-probah.vercel.app](https://terralink-probah.vercel.app) |
| **Project type** | Interactive frontend prototype |
| **Status** | Functional demonstration with sample monitoring data |


---

## 1. Problem Statement

Wetlands such as ponds, beels, haors and lakes are central to flood control, fisheries, groundwater recharge and livelihoods in Bangladesh. Around fast-growing areas such as Dhaka, Gazipur, Savar and Narayanganj they are under steady pressure from land filling, encroachment, construction and seasonal degradation.

NGOs and community programmes that protect these sites face a practical operational gap rather than a lack of concern.

| Challenge | What happens today |
|---|---|
| **Detection is disconnected from action** | Satellite imagery can show that visible water area has changed, but there is no structured step that turns that signal into a reviewed decision and a field assignment. |
| **Evidence is scattered** | Observations, photos and field notes live in personal phones, chat groups and separate folders. Decisions are rarely recorded with a reason. |
| **Accountability is unclear** | It is often unclear who was asked to verify a site, by when, and whether the work was completed. |
| **Costs are not linked to work** | Field expenses are tracked in spreadsheets that are not connected to the task, the site or the programme budget, so overspending is noticed late. |
| **Coordination is manual** | Meetings, deadlines and reminders are arranged one message at a time, with no shared schedule or communication record. |
| **Reporting is slow** | Donor and programme reports are assembled by hand from many sources, which is time-consuming and hard to verify. |
| **Language barrier** | Many field staff are more comfortable asking questions in Bangla than navigating English dashboards. |

The result is that a possible wetland loss may be noticed but not verified, verified but not documented, or acted on without a clear record of cost and responsibility.

## 2. Our Solution

TerraLink is a single operational workspace that connects the full chain of work:

**Observe → Review → Decide → Assign → Schedule → Verify → Record cost → Communicate → Report**

Core ideas:

- **A change is a prompt for human review, not proof.** Every satellite observation goes to a review queue where a manager records a documented decision (Confirmed for follow-up, Inconclusive, or No change) with a written reason.
- **Every decision becomes accountable work.** Confirmed findings become field tasks with an assignee, priority, due date, estimated cost and activity history.
- **Costs stay linked.** Each expense is tied to a task and a site, and rolls up into site budgets and programme totals. Over-budget situations are flagged straight away.
- **Integrations sit where the work happens.** Calendar events, email notices and WhatsApp messages are actions inside tasks, meetings, budgets and reports. They are not a separate page.
- **Bangla-first assistance.** A Bangla assistant answers operational questions, such as which tasks are pending or overdue, using only the records visible in the workspace.
- **Reports from live state.** A printable A4 report is generated from the current workspace, including evidence, decisions, tasks, cost variance, limitations and sources.

## 3. Who It Is For

| User | Need |
|---|---|
| **Project managers** at environmental NGOs | Review findings, approve work, control budgets, brief stakeholders |
| **Field coordinators** | See only their assigned sites and tasks, add evidence, record field costs |
| **Office operators** | Maintain task, team and expense records, prepare reports |
| **Programme leads and donors** | Receive clear, sourced and honest progress reports |

## 4. End-to-End Workflow

```
 Satellite comparison          Manager review             Field operations
 ────────────────────          ──────────────             ────────────────
 Site flagged as          ──►  Review queue        ──►    Task created and assigned
 "Needs review"                Change analysis            Field visit scheduled
                               Documented decision        Calendar / email / WhatsApp
                                                                 │
                                                                 ▼
 Reporting                     Finance                    Verification
 ─────────                     ───────                    ────────────
 A4 report generated     ◄──   Expenses linked to   ◄──   Evidence, notes and
 Shared by email               task and site budget       status updates
 Briefing scheduled            Over-budget warning
```

1. A monitored site shows a possible reduction in visible water area and is marked **Needs review**.
2. The manager opens the **Change analysis** page, compares before and after imagery, and records a decision with a reason.
3. A **field verification task** is created and assigned. A field visit is scheduled and the assignee is notified.
4. The field coordinator updates progress, adds notes and evidence, and records **actual costs**.
5. Expenses update the **site budget** and **programme totals**. Overspending is highlighted and a budget review can be scheduled.
6. The manager generates a **report**, shares it by email, and schedules a briefing if needed.
7. Every action is kept in the **audit trail** and **communications log**.

## 5. Modules

The navigation is organised like an ERP, with each area of work in its own module.

### Overview

| Module | Description |
|---|---|
| **Dashboard** | Role-aware summary: KPIs, the current priority site, monitoring snapshot, open tasks, upcoming schedule (14-day lookahead), activity trends, budget health and an assistant prompt. Coordinators see only their own work and meetings. |

### Monitoring

| Module | Description |
|---|---|
| **Wetland map** | Interactive map of all monitored sites with status filters, a searchable site directory, and switchable street and satellite imagery layers. |
| **Sites register** | Tabular register of every site with location, area, change percentage, status, open tasks and linked budget figures. |
| **Change analysis** | Side-by-side before and after satellite comparison with selectable periods, synchronised pan and zoom, analysis summary (earlier area, later area, change, clear-pixel coverage) and the manager decision panel. |
| **Review queue** | Observations awaiting a documented decision, sites with data-quality gaps (for example heavy cloud cover), and the register of recorded decisions. |

### Field Operations

| Module | Description |
|---|---|
| **Tasks** | Board and list views with filters, a task detail drawer, comments, activity history and status workflow (Review pending, Approved, In progress, Reported complete). Follow-up actions are available from each task: add the deadline to Google Calendar, download an .ics file, send an email or WhatsApp reminder, schedule a field visit, or record an expense. |
| **Schedule and meetings** | Month calendar and agenda views of meetings and task deadlines. Supports field visits, review meetings, report briefings, budget reviews and team syncs, with attendees, agenda, calendar sync and invitations. |

### Finance

| Module | Description |
|---|---|
| **Budgets** | Planned allocation, actual cost, remaining and committed amounts per site or per task. Includes over-budget alerts, allocation editing for managers, and a one-click "Schedule budget review" action. |
| **Expenses** | Expense ledger linked to tasks and sites, with filtering, totals and a guided form for new records. |

### People

| Module | Description |
|---|---|
| **Team** | Member directory with contact details, availability, WhatsApp links and live workload, calculated from open tasks. |

### Reporting

| Module | Description |
|---|---|
| **Reports** | Generates an A4 report for a chosen site and date range: cover, observation evidence, decision, task table, cost variance, limitations, sources and sample-data disclaimer. Supports print or save as PDF, sharing by email with a cover note, and scheduling a report briefing. |
| **Bangla assistant** | Guided question-and-answer in Bangla, calculated from the current workspace state, with source chips that show which records were used. When information is not available it answers clearly instead of guessing. |

### Administration

| Module | Description |
|---|---|
| **Communications** | Complete log of email, calendar and WhatsApp activity with status (Sent, Opened, Failed) and error details. |
| **Audit trail** | Chronological record of decisions, task changes, expenses, budget edits and communications across the workspace. |
| **Settings** | Service connection status, provider credential checks, automation preferences and workspace reset. |

## 6. Roles and Permissions

The prototype has three roles. You can switch roles at any time from the top bar to see how access changes.

| Capability | Project Manager | Field Coordinator | Office Operator |
|---|:---:|:---:|:---:|
| View dashboard, map, sites and change analysis | Yes | Yes | Yes |
| Record review decisions | Yes | No | No |
| Create tasks | Yes | No | Yes |
| Reassign tasks | Yes | No | No |
| Update task progress | Yes | Own tasks | No |
| Add comments and evidence | Yes | Own tasks | Yes |
| Schedule meetings and field visits | Yes | No | Yes |
| Manage team records | Yes | No | Yes |
| Record expenses | Yes | Own tasks | Yes |
| Edit budget allocations | Yes | No | No |
| Generate and share reports | Yes | Yes | Yes |
| Communications log and audit trail | Yes | No | Yes |
| Settings | Yes | No | No |

Sample users: Nusrat Jahan (Project Manager), Rahim Uddin (Field Coordinator), Sadia Akter (Office Operator).

## 7. Contextual Integrations

Integrations appear as actions at the point of need, not as a standalone page.

| Where | Action | Service |
|---|---|---|
| Task drawer | Add deadline to calendar, download .ics, email reminder, WhatsApp reminder | Google Calendar, EmailJS, WhatsApp click-to-chat |
| Task creation | Notify assignee by email, calendar and WhatsApp | EmailJS, Google Calendar, WhatsApp |
| Change analysis | Schedule a field verification visit | Schedule module and Google Calendar |
| Schedule | Create meetings, sync to calendar, send invitations | Google Calendar, EmailJS, .ics |
| Budgets | Over-budget notice to the manager, schedule a budget review | EmailJS, Schedule module |
| Reports | Share by email with a cover note, schedule a briefing | EmailJS, Schedule module |

Integration behaviour:

- **Google Calendar** uses OAuth through Google Identity Services. When OAuth is not configured or is declined, TerraLink falls back to a prefilled Google Calendar link so the user can still add the event.
- **Email** is sent through EmailJS with optional per-notification templates.
- **WhatsApp** uses click-to-chat links (`wa.me`). The message is prepared and the person reviews it before sending. Nothing is sent automatically.
- **Failures never break the app.** Missing keys, cancelled OAuth or quota errors are recorded as Failed entries in the communications log.

## 8. Real Services and Simulated Data

TerraLink is open about what is real and what is illustrative.

| Component | Status |
|---|---|
| Street basemap (OpenStreetMap) | Real |
| Satellite basemap (Esri World Imagery) | Real |
| Sentinel-2 cloudless yearly mosaics (EOX) in change analysis | Real imagery |
| Email delivery (EmailJS) | Real, when configured |
| Google Calendar events | Real, when configured |
| WhatsApp messages | Real click-to-chat, sent by the user |
| Site list, area figures and change percentages | Sample data |
| Dashboard site thumbnails | Illustrative visuals |
| Team members, tasks, budgets and expenses | Sample data |
| Bangla assistant | Simulated, rule-based over workspace records |
| Authentication | Demo role selection, no real accounts |

All sample content is labelled **Sample** in the interface. A prototype banner is shown across the workspace.

## 9. Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 with a custom design theme |
| Routing | React Router 7 (lazy-loaded routes, URL-driven drawers and forms) |
| Maps | Leaflet with React Leaflet |
| Charts | Recharts and lightweight SVG charts |
| Icons | Lucide (monochrome) |
| Email | EmailJS browser SDK |
| Calendar | Google Identity Services and Google Calendar API v3 |
| Messaging | WhatsApp click-to-chat |
| Typography | IBM Plex Sans (interface), Hind Siliguri (Bangla) |
| Quality | ESLint with React Hooks and React Refresh rules |
| Hosting | Vercel (single-page application rewrites) |

## 10. Architecture

TerraLink is a frontend-only application. There is no backend server in this prototype.

**State management**
- A single `AppContext` uses `useReducer` to hold sites, review decisions, tasks, meetings, expenses, budgets, team members, notification logs and settings.
- Workspace state is saved to `localStorage` under `terralink.workspace.v1`, so work is kept across page reloads and screens.
- Decisions recorded on a site override that site's sample status. Every module (map, register, review queue, dashboard and reports) reads from the same state.

**Services layer**
- `services/email.js`: EmailJS dispatch with template routing and safe failure handling.
- `services/calendar.js`: Google OAuth token flow, event creation and the prefilled-link fallback.
- `services/whatsapp.js`: validated click-to-chat link generation.
- Every outbound action writes a structured entry to the communications log.

**Routing and navigation**
- One navigation configuration drives both the sidebar and the page titles.
- Role-restricted routes (Communications, Audit trail, Settings) are guarded.
- Drawers and forms are driven by the URL (for example `/tasks?task=TL-104` or `/schedule?new=field_visit&site=pond-a`), so any record or action can be linked directly from another module.

**Time and locale**
- Dates and schedules use the Asia/Dhaka time zone.
- Currency is shown in Bangladeshi Taka, with Bangla numeral formatting where helpful.

## 11. Project Structure

```
Prototype/
├── README.md
└── Client/
    ├── index.html
    ├── vite.config.js
    ├── vercel.json
    ├── .env.example
    ├── docs/
    │   └── DEMO_SCRIPT.md
    ├── public/
    └── src/
        ├── assets/            Illustrative site imagery
        ├── components/
        │   ├── brand/         Logo
        │   ├── budget/        Allocation and expense forms, planned vs actual chart
        │   ├── communications/ Communication history
        │   ├── dashboard/     KPI cards, snapshots, schedule, insights
        │   ├── integrations/  Service cards, notification log
        │   ├── layout/        Sidebar, top bar, banner, about panel
        │   ├── map/           Wetland map and site panel
        │   ├── reports/       Report preview and share modal
        │   ├── schedule/      Calendar, agenda, meeting forms
        │   ├── site/          Image comparison, analysis, decision panel
        │   ├── tasks/         Task board, cards, detail drawer
        │   ├── team/          Member cards and forms
        │   └── ui/            Button, Badge, PageHeader, SummaryStrip, Toast
        ├── constants/         Navigation, roles, status definitions
        ├── context/           Application state and reducer
        ├── data/              Sample sites, tasks, team, budgets, expenses
        ├── hooks/             useApp, useNotice, useClickOutside, useLocalStorage
        ├── pages/             One page per module
        ├── services/          Email, calendar and WhatsApp services
        └── utils/             Formatting, schedule, audit, communications helpers
```

## 12. Getting Started

### Prerequisites

- Node.js 20.19 or later (required by Vite 8)
- npm 10 or later

### Installation

```bash
git clone <repository-url>
cd Prototype/Client
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:5173` and choose a role on the sign-in screen.

### Other commands

| Command | Purpose |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

The application works without any environment variables. Integrations then fall back safely: calendar actions open a prefilled Google Calendar page, and email attempts are logged as Failed with an explanation.

## 13. Environment Configuration

Copy `.env.example` to `.env` inside `Client/` and fill in the values you need.

| Variable | Required for | Description |
|---|---|---|
| `VITE_EMAILJS_PUBLIC_KEY` | Email | EmailJS public key |
| `VITE_EMAILJS_SERVICE_ID` | Email | EmailJS service identifier |
| `VITE_EMAILJS_TEMPLATE_ID` | Email | Default template for all notifications |
| `VITE_EMAILJS_TEMPLATE_TASK_ASSIGN_ID` | Optional | Task assignment template |
| `VITE_EMAILJS_TEMPLATE_OVER_BUDGET_ID` | Optional | Over-budget notice template |
| `VITE_EMAILJS_TEMPLATE_TASK_COMPLETE_ID` | Optional | Task completion template |
| `VITE_EMAILJS_TEMPLATE_REPORT_SUMMARY_ID` | Optional | Report sharing template |
| `VITE_EMAILJS_TEMPLATE_MEETING_INVITE_ID` | Optional | Meeting invitation template |
| `VITE_EMAILJS_TEMPLATE_TASK_REMINDER_ID` | Optional | Task reminder template |
| `VITE_EMAILJS_REPLY_TO` | Optional | Reply-to address for outgoing email |
| `VITE_GOOGLE_CLIENT_ID` | Calendar | Google Cloud OAuth Web client ID |

**EmailJS template variables:** `to_name`, `to_email`, `subject`, `message`, `notification_type`, `task_id`, `task_title`, `site_name`, `assignee_name`, `due_date`, `action_url`.

**Google Calendar setup**
1. Create a project in Google Cloud Console and enable the Google Calendar API.
2. Create an OAuth client ID of type Web application.
3. Add `http://localhost:5173` and your deployed domain as Authorized JavaScript origins.
4. Set `VITE_GOOGLE_CLIENT_ID` and restart the development server.

Never commit `.env` files. Only the `VITE_` variables listed above are exposed to the browser, and none of them are secret server credentials.

## 14. Deployment

The project deploys to Vercel as a static single-page application.

1. Import the repository into Vercel and set the root directory to `Client`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add the environment variables from section 13 in the Vercel project settings.
4. Add the production domain to the Google OAuth Authorized JavaScript origins.

`vercel.json` contains the rewrite rule that sends every route to `index.html`, so direct links such as `/tasks?task=TL-104` work.

## 15. Demonstration Guide

A timed 5 to 7 minute walkthrough is available in [`Client/docs/DEMO_SCRIPT.md`](Client/docs/DEMO_SCRIPT.md). Recommended path:

1. **Dashboard:** priority site, KPIs and upcoming schedule.
2. **Wetland map:** filter by Needs review and open Pond A.
3. **Change analysis:** compare periods and record a decision.
4. **Tasks:** create and assign a verification task, then send notifications.
5. **Schedule:** schedule the field visit and sync it to the calendar.
6. **Role switch:** act as Field Coordinator, update the task and add evidence.
7. **Expenses and Budgets:** record a cost and show the over-budget warning.
8. **Bangla assistant:** ask "কোন কাজ বাকি?" and "কোন task overdue?".
9. **Reports:** generate, print and share the report.
10. **Communications and Audit trail:** show the full record of actions.

Edge cases worth showing: Wetland C (insufficient data because of cloud cover), Pond B and Lake D (no change), and a reduced budget allocation (over-budget state).

## 16. Design Principles

- **Professional and calm:** light interface, restrained shadows and a deep green navigation rail.
- **Colour carries meaning:** status is shown with small indicator dots on neutral labels. Red is kept for real problems such as overspending and failures.
- **Monochrome iconography:** consistent neutral icons, no decorative imagery and no emoji.
- **Honest data labelling:** every illustrative value is marked as sample data.
- **Responsive:** built for laptops and tablets, with a collapsible sidebar that adapts to screen height.
- **Accessible:** semantic headings, labelled controls, keyboard focus states and reduced-motion support.
- **Bilingual:** English interface with Bangla assistance and Bangla currency formatting.

## 17. Responsible Use and Limitations

- A detected change in visible water area is **a reason to investigate**. It is not proof of encroachment, ecological loss or legal non-compliance. Field verification and human judgement are always required.
- Optical satellite imagery is affected by cloud, shadow, seasonal water levels and resolution limits. TerraLink shows clear-pixel coverage and marks low-quality comparisons as Insufficient data.
- Site measurements, tasks, budgets and team records in this prototype are **sample data**.
- Data is stored in the user's browser only. Clearing browser storage or using Reset in Settings restores the original sample workspace.
- The Bangla assistant is rule-based and answers only from workspace records. It is not a general-purpose language model.

## 18. Roadmap

| Phase | Planned capability |
|---|---|
| Data | Automated water-index analysis (for example NDWI or MNDWI) from Sentinel-2 to flag sites by threshold |
| Platform | Backend API, database, real authentication and organisation accounts |
| Field | Offline-capable mobile capture with geotagged photos |
| Messaging | WhatsApp Business Cloud API with consent management |
| Intelligence | Bangla language model assistant grounded on workspace records |
| Finance | Approval workflows, receipts and donor-specific budget lines |
| Reporting | Scheduled reports, donor templates and data export |
| Collaboration | Community reporting channel and multi-organisation sharing |

## 19. Team

| Member | Role | Contact |
|---|---|---|
| Afrin Jahan Era | Full-Stack Developer and Product Design | [GitHub](https://github.com/AfrinJahanEra) · [LinkedIn](https://www.linkedin.com/in/afrin-jahan-era-054b22417/) |
| *Member name* | *Role* | *Contact* |
| *Member name* | *Role* | *Contact* |

Institution: Islamic University of Technology (IUT), Bangladesh.

## 20. Acknowledgements and Data Attribution

- **Sentinel-2 cloudless** mosaics by [EOX IT Services GmbH](https://maps.eox.at/), containing modified Copernicus Sentinel data.
- **Basemap** data from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **World Imagery** by Esri and its data providers.
- **Icons** by [Lucide](https://lucide.dev/).
- **Fonts** IBM Plex Sans and Hind Siliguri via Google Fonts.

## 21. License

This project was created as a prototype for demonstration and evaluation. All rights reserved by the TerraLink team unless a separate license file is added. Third-party data and services remain subject to their own terms.
