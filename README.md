# TerraLink

**A wetland monitoring and response workspace for NGO project teams and communities in Bangladesh.**

TerraLink turns a possible change in a wetland, seen from satellite imagery or reported by a resident with a photo, into a documented, accountable and costed field response. Review, task assignment, scheduling, expenses, communication and reporting all happen in one ERP-style workspace instead of across spreadsheets, chat groups and email threads.

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
- **Residents can report what they see.** Anyone can explore the public map. To send a photo report for a real Dhaka water body, a person signs in with the **User** role, so every report is tied to an account. Reports start as Pending and a manager verifies or rejects each one with a recorded reason.
- **Real outlines on real imagery.** Five Dhaka water bodies are drawn from their OpenStreetMap shorelines on satellite imagery.
- **Measured change, not invented change.** Pick a water body and two dates. TerraLink finds real Sentinel-2 scenes, measures the water inside the outline on each date, and reports the difference with its uncertainty, or says plainly that the data does not support a measurement.
- **Verified outcome.** A verified report becomes an assigned task with a deadline, costs that need approval, completion photos, and a manager's decision on whether the problem was resolved.
- **Bangla-first assistance.** A Bangla assistant answers operational questions, such as which tasks are pending or overdue, using only the records visible in the workspace.
- **Reports from live state.** A printable A4 report is generated from the current workspace, including evidence, decisions, tasks, cost variance, limitations and sources.

## 3. Who It Is For

| User | Need |
|---|---|
| **Project managers** at environmental NGOs | Review findings, approve work, control budgets, brief stakeholders |
| **Field coordinators** | See only their own tasks and the sites they are at, start work, submit completion photos, record field costs |
| **Office operators** | Keep records complete: receipts, reports, schedules and team details. They see everything but do not decide, assign or approve |
| **Programme leads and donors** | Receive clear, sourced and honest progress reports |
| **Users** (residents and community members) | Explore the monitored water bodies, report a problem with a photo and a map pin, and follow the review status of their own reports |

## 4. End-to-End Workflow

```
 Satellite comparison          Manager review             Field operations
 ────────────────────          ──────────────             ────────────────
 Site flagged as          ──►  Review queue        ──►    Task created and assigned
 "Needs review"                Site review                 Field visit scheduled
                               Documented decision        Calendar / email / WhatsApp
                                                                 │
                                                                 ▼
 Reporting                     Finance                    Verification
 ─────────                     ───────                    ────────────
 A4 report generated     ◄──   Expenses linked to   ◄──   Evidence, notes and
 Shared by email               task and site budget       status updates
 Briefing scheduled            Over-budget warning
```

1. A monitored site is marked **Needs review**, or a resident sends a photo report that a manager checks and verifies.
2. The manager opens the **Site review** page, compares the annual satellite composites, and records a decision with a reason.
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
| **Dashboard** | Role-aware summary: KPIs, a map of the sites, the items that need a decision, open tasks, the upcoming schedule (14-day lookahead) and budget health. Coordinators see only their own work and meetings. |

### Monitoring

| Module | Description |
|---|---|
| **Wetland map** | Satellite map of the five monitored Dhaka water bodies, drawn as polygons from their mapped outlines, with status filters, a searchable directory, community report markers, and a street layer. |
| **Sites register** | Tabular register of every site with location, mapped area, open community reports, status, open tasks and linked budget figures. |
| **Community reports** | Review queue for photo reports from residents. Each report shows its photos, location, dates and review history, and a manager can start review, verify, or reject with a reason, then create a field task from a verified report. |
| **Satellite comparison** | Choose a water body and two dates. TerraLink picks the clearest Sentinel-2 scene near each date, draws both over the same extent with a swipe or side-by-side view, shows the water mask and mapped outline, and reports measured water area per date, the change, a verdict and the data quality. A manager or operator can save the result to the site record. |
| **Site review** | The saved measurement (or an honest "not yet measured"), the observation record and the manager decision panel. |
| **Review queue** | Observations awaiting a documented decision, sites with data-quality gaps (for example heavy cloud cover), and the register of recorded decisions. |

### Field Operations

| Module | Description |
|---|---|
| **Tasks** | Board and list of assigned work. A task can come from a verified community report and keeps the link. Stages: Open, In progress, Blocked (reason required), Awaiting verification, Completed and Cancelled (reason required); overdue is a flag, not a stage. The task drawer shows the original report photo beside the completion photos, approved and pending costs against the estimate, and the manager's review. Follow-up actions: calendar deadline, .ics, email or WhatsApp reminder, field visit. |
| **Schedule and meetings** | Month calendar and agenda views of meetings and task deadlines. Supports field visits, review meetings, report briefings, budget reviews and team syncs, with attendees, agenda, calendar sync and invitations. |

### Finance

| Module | Description |
|---|---|
| **Budgets** | Planned allocation, actual cost, remaining and committed amounts per site or per task. Includes over-budget alerts, allocation editing for managers, and a one-click "Schedule budget review" action. |
| **Expenses** | Ledger of costs by category with an optional receipt photo. An expense counts toward the task and site cost only after the project manager approves it; a rejected one needs a reason. |

### People

| Module | Description |
|---|---|
| **Team** | Member directory with contact details, availability, WhatsApp links and live workload, calculated from open tasks. |

### Reporting

| Module | Description |
|---|---|
| **Reports** | Generates an A4 report for a chosen site and date range: cover, observation evidence, decision, task table, cost variance, limitations, sources and sample-data disclaimer. Supports print or save as PDF, sharing by email with a cover note, and scheduling a report briefing. |
| **Bangla assistant** | Guided question-and-answer in Bangla, calculated from the current workspace state, with source chips that show which records were used. When information is not available it answers clearly instead of guessing. |

### Community pages (open to everyone, reporting needs a User)

The user header is deliberately minimal: the logo returns to the map, and a signed-in user has My reports and Sign out. Reporting is reached from the buttons on the map and report pages. The public map uses three calm states (stable, needs attention, not enough data) in the theme's teal and grey with one amber, instead of six status colours.

| Page | Description |
|---|---|
| **Monitoring map** (`/explore`) | One-screen satellite map with a side list in two tabs, water bodies and reports. Header tiles show water bodies, open, verified and resolved reports. Users also see a shortcut to their own reports. |
| **Water body page** (`/explore/:id`) | Outline on satellite imagery, key facts, the saved measurement if there is one, and the community reports for that water body. |
| **Report a problem** (`/report`) | User-only form laid out as numbered cards: photo evidence, what happened, and a large location map with a water-body selector and a live pin readout. Includes a short guide and the user's recent reports. |
| **My reports** (`/my-reports`) | Counts by status, filters, a progress tracker for each report (Submitted, Under review, Verified, Action taken, Resolved), the reviewer's reasons, and the action taken. |

### Administration

| Module | Description |
|---|---|
| **Communications** | Complete log of email, calendar and WhatsApp activity with status (Sent, Opened, Failed) and error details. |
| **Audit trail** | Chronological record of decisions, task changes, expenses, budget edits and communications across the workspace. |
| **Settings** | Service connection status, provider credential checks, automation preferences and workspace reset. |

## 6. Roles and Permissions

The prototype has three staff roles and a **User** role for the community. There is no role switcher: to use a different role, sign out and sign in again (the account menu says so). The sign-in and register screens show what the chosen role can do, fill in demo details for it, validate the fields, and keep a `next` link so a visitor returns to the page they came from. The User role has no staff workspace and lands on the community pages.

Each role sees only what it needs, and can do only what it is responsible for. The rules live in one table (`Client/src/constants/access.js`). The sidebar, the route guard, the data each page receives, every button, and the state functions all read from it, so the app does not merely hide a button: the action is refused too. A page outside your role shows a "not part of your role" notice and a link to what you can open, and **My role and access** (account menu or dashboard) lists what you can and cannot do.

**What each role is for**

| | Project Manager | Field Coordinator | Office Operator |
|---|---|---|---|
| Purpose | Decides, assigns and approves | Does the field work on assigned tasks | Keeps the records and the paperwork |
| Sees | The whole programme | Only their own tasks, the sites those tasks are at, their schedule and their expenses | The whole programme, read-only on decisions |

**Pages** (a page a role does not have is absent from its sidebar and blocked if opened by URL)

| Page | Project Manager | Field Coordinator | Office Operator |
|---|:---:|:---:|:---:|
| Dashboard | Yes | Yes (my work) | Yes (records) |
| Wetland map | Yes | My sites only | Yes |
| Sites register, Site review | Yes | No (read-only record of a site they have a task at) | Yes, read-only |
| Satellite comparison | Yes | No | Yes |
| Community reports, Review queue | Yes | No | Yes, read-only |
| Tasks | All | Own only | All, read-only |
| Schedule and meetings | All | Own only | All |
| Budgets | Yes | No | Yes, read-only |
| Expenses | All | Own tasks only | All |
| Team | Yes | No | Yes |
| Reports | Yes | No | Yes |
| Bangla assistant | Yes | Own tasks, no budget figures | Yes |
| Communications, Audit trail | Yes | No | Yes |
| Settings | Yes | No | No |

**Actions**

| Action | Project Manager | Field Coordinator | Office Operator |
|---|:---:|:---:|:---:|
| Record a review decision for a site | Yes | No | No |
| Verify or reject a community report | Yes | No | No |
| Run a satellite comparison, save a measurement | Yes | No | Yes |
| Create a task, assign or reassign it, change its deadline or estimate | Yes | No | No |
| Start, block or submit completion evidence on a task | Yes | Own tasks | No |
| Approve completion and close a task, or send it back | Yes | No | No |
| Cancel or reopen a task | Yes | No | No |
| Add a note to a task | Yes | Own tasks | Yes |
| Send a reminder (email or WhatsApp) | Yes | No | Yes |
| Record an expense (pending until approved) | Yes, approved on entry | Own tasks | Yes |
| Approve or reject an expense | Yes | No | No |
| Edit a budget allocation | Yes | No | No |
| Schedule meetings and field visits | Yes | No | Yes |
| Manage team records | Yes | No | Yes |
| Generate and share a programme report | Yes | No | Yes |
| Change settings, integrations, reset the workspace | Yes | No | No |

Sample users: Nusrat Jahan (Project Manager), Rahim Uddin (Field Coordinator), Sadia Akter (Office Operator), Karim Hossain (User).

**The User role.** The map pages (`/explore` and `/explore/:siteId`) are open to everyone. `/report` and `/my-reports` need a signed-in User: a visitor who is signed out is sent to log in or register as a User and returns to the form afterwards, and staff roles see an explanation instead of the form, because staff review reports and do not submit them. Users cannot open any staff page; those routes send them to the community map. A report stores the reporter's name and email from the account. Reviewers see them; the public map shows only "Reporter".

## 7. Contextual Integrations

Integrations appear as actions at the point of need, not as a standalone page.

| Where | Action | Service |
|---|---|---|
| Task drawer | Add deadline to calendar, download .ics, email reminder, WhatsApp reminder | Google Calendar, EmailJS, WhatsApp click-to-chat |
| Task creation | Notify assignee by email, calendar and WhatsApp | EmailJS, Google Calendar, WhatsApp |
| Site review | Schedule a field verification visit | Schedule module and Google Calendar |
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
| Satellite basemap (Esri World Imagery) | Real |
| Street basemap (OpenStreetMap) | Real |
| Water-body outlines (OpenStreetMap way and relation geometry) | Real, community-mapped and unverified |
| Mapped area (calculated from the outline) | Real calculation |
| Dated Sentinel-2 L2A scenes, read from the public archive in the browser | Real imagery |
| Water area measured by NDWI in a satellite comparison | Real measurement, an estimate with stated uncertainty |
| Photo evidence and community reports you submit | Real, stored in this browser only |
| Email delivery (EmailJS) | Real, when configured |
| Google Calendar events | Real, when configured |
| WhatsApp messages | Real click-to-chat, sent by the user |
| Water-area change | Real only where a comparison has been run and saved |
| Site classifications (for example "No change") | Sample data |
| Three seeded community reports | Sample data, without photos |
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
| Satellite analysis | Earth Search STAC catalogue, geotiff.js (Cloud Optimized GeoTIFF range reads), proj4 (UTM projection); no backend |
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

### Measuring water area

The comparison runs in the browser; there is no backend.

1. **Find scenes.** The Earth Search STAC catalogue lists Sentinel-2 L2A scenes whose footprint fully covers the outline within the chosen window (7 to 60 days). Clear scenes (scene cloud cover of 20% or less) are preferred, then the one closest to the requested date. The real acquisition date and scene ID are shown.
2. **Read pixels.** Only the window around the water body is downloaded from the Cloud Optimized GeoTIFFs (bands B03 green, B08 near-infrared, the scene classification and true colour), using HTTP range requests.
3. **Classify water.** A pixel inside the outline, plus a 10 m tolerance for geolocation error, is water when NDWI = (Green - NIR) / (Green + NIR) is above 0. Cloud, shadow, no-data, cirrus and snow pixels are left out. The reflectance offset that some scenes carry is detected from the data, because the catalogue flag is unreliable.
4. **Cross-check.** ESA's own scene classification gives an independent water area for the same pixels. If the two disagree by more than a quarter, the image is marked Limited.
5. **Report the difference.** Change = later - earlier, percent = change / earlier x 100 (unavailable when the earlier area is zero). The uncertainty is half the area of water pixels that touch non-water pixels. A difference inside the combined uncertainty is reported as "No measurable change" instead of a decrease or increase.
6. **Decline when the data cannot support it.** Under one hectare, no usable scene, an unusable image, or dates that are more than 45 days apart in the seasonal cycle are reported as not reliable or flagged as indicative.

Results are cached in the browser, so a repeated comparison takes seconds. The first run for a pair takes about half a minute on a typical connection. This is a screening measurement from 10 m pixels, not a survey, and it cannot see floating plants, very turbid water, or the cause of any change.

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
        ├── assets/            Landing page imagery
        ├── components/
        │   ├── brand/         Logo
        │   ├── community/     Report form, location picker, report cards and detail
        │   ├── budget/        Allocation and expense forms, planned vs actual chart
        │   ├── communications/ Communication history
        │   ├── dashboard/     KPI cards, snapshots, schedule, insights
        │   ├── integrations/  Service cards, notification log
        │   ├── layout/        Sidebar, top bar, banner, about panel, public layout
        │   ├── login/         Landing and sign-in visuals
        │   ├── map/           Wetland map, site panel, shared map explorer
        │   ├── reports/       Report preview and share modal
        │   ├── schedule/      Calendar, agenda, meeting forms
        │   ├── compare/       Comparison viewer, measured-area summary, data-quality panel
        │   ├── site/          Measured comparison card, decision panel
        │   ├── tasks/         Task board, cards, detail drawer, workflow, evidence, expenses, completion review
        │   ├── team/          Member cards and forms
        │   └── ui/            Button, Badge, PageHeader, SummaryStrip, Toast
        ├── constants/         Navigation, roles, status definitions
        ├── context/           Application state and reducer
        ├── data/              Water-body outlines, sample sites, tasks, team, budgets, expenses, sample reports
        ├── hooks/             useApp, useNotice, useClickOutside, useLocalStorage
        ├── pages/             One page per module
        ├── services/          Email, calendar, WhatsApp, photo storage, Sentinel-2 analysis and observation cache
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
2. **Public explorer and report form:** open `/explore` while signed out, select Dhanmondi Lake, choose **Report a problem here**, sign in as a User, then submit a photo report and follow it under **My reports**.
3. **Community reports:** sign in as Project Manager, check the evidence and verify the report.
4. **Satellite comparison:** pick a water body and two dates, read the measured water area and its uncertainty, and save it to the site record.
5. **Tasks:** from the verified report, create a task, assign it, and set the estimated cost.
6. **Sign out and sign in as Field Coordinator:** start the work, add an expense (it stays pending), and submit completion photos.
7. **Verification and cost:** as Project Manager, approve the expense, send the work back once, then approve it with the outcome Resolved. Show the before and after photos and the report marked Resolved.
8. **Bangla assistant:** ask "কোন কাজ বাকি?" and "কোন task overdue?".
9. **Reports:** generate, print and share the report.
10. **Communications and Audit trail:** show the full record of actions.

Edge cases worth showing: Gol Talab (insufficient data because it is under one hectare), a report pinned outside every outline (saved as a location-based report), a rejected report (hidden from the public map, kept in the audit trail), and a reduced budget allocation (over-budget state).

## 16. Design Principles

- **Professional and calm:** light interface, restrained shadows and a deep green navigation rail.
- **One accent colour on the community side:** teal for actions and progress, slate for everything else, amber only for "needs attention".
- **Colour carries meaning:** status is shown with small indicator dots on neutral labels. Red is kept for real problems such as overspending and failures.
- **Monochrome iconography:** consistent neutral icons, no decorative imagery and no emoji.
- **Honest data labelling:** sample values are marked as sample data, and a figure that has not been measured is shown as "Not yet measured".
- **Responsive:** built for laptops and tablets, with a collapsible sidebar that adapts to screen height.
- **Accessible:** semantic headings, labelled controls, keyboard focus states and reduced-motion support.
- **Bilingual:** English interface with Bangla assistance and Bangla currency formatting.
- **Usable on a phone:** the public report form and map work at phone width, because residents report from the field.

## 17. Responsible Use and Limitations

- A change seen in imagery, or a photo from a resident, is **a reason to investigate**. It is not proof of encroachment, ecological loss or legal non-compliance. Field verification and human judgement are always required.
- Optical satellite imagery is affected by cloud, shadow, seasonal water levels and resolution limits. TerraLink picks the clearest scene, leaves cloud and shadow pixels out, and reports how many usable pixels there were. A water body under one hectare, or a comparison whose dates are far apart in the seasonal cycle, is reported as not reliable.
- Site classifications, tasks, budgets and team records in this prototype are **sample data**.
- Data is stored in the user's browser only. Photos are kept in the browser's IndexedDB and reports in local storage. Clearing browser storage or using Reset in Settings restores the original sample workspace and removes uploaded photos. Reports are not shared between devices.
- Water-body outlines come from OpenStreetMap contributors and are simplified. They are not an official survey, so each boundary is marked unverified.
- A water body under about one hectare is only a few 10 m satellite pixels wide. TerraLink marks such sites (Gol Talab) as Insufficient data and points to field evidence instead.
- A verified community report means its evidence was reviewed. It does not by itself establish the condition of the whole water body.
- The Bangla assistant is rule-based and answers only from workspace records. It is not a general-purpose language model.

## 18. Roadmap

| Phase | Planned capability |
|---|---|
| Data | Validate the NDWI measurement against surveyed boundaries and add MNDWI, multi-year trends and scheduled monitoring |
| Platform | Backend API and shared database so reports sync across devices, object storage for photos, real authentication and organisation accounts |
| Field | Offline-capable mobile capture, photo EXIF location checks and duplicate-report detection |
| Messaging | WhatsApp Business Cloud API with consent management |
| Intelligence | Bangla language model assistant grounded on workspace records |
| Finance | Approval workflows, receipts and donor-specific budget lines |
| Reporting | Scheduled reports, donor templates and data export |
| Collaboration | Reporter follow-up by SMS or WhatsApp, and multi-organisation sharing |

## 19. Team

| Member | Role | Contact |
|---|---|---|
| Afrin Jahan Era | Full-Stack Developer and Product Design | [GitHub](https://github.com/AfrinJahanEra) · [LinkedIn](https://www.linkedin.com/in/afrin-jahan-era-054b22417/) |
| *Member name* | *Role* | *Contact* |
| *Member name* | *Role* | *Contact* |

Institution: Islamic University of Technology (IUT), Bangladesh.

## 20. Acknowledgements and Data Attribution

- **Sentinel-2 L2A** scenes: contains modified Copernicus Sentinel data, served by the [Earth Search](https://element84.com/earth-search/) catalogue and AWS Open Data.
- **Basemap** data and **water-body outlines** from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the ODbL.
- **World Imagery** by Esri and its data providers.
- **Icons** by [Lucide](https://lucide.dev/).
- **Fonts** IBM Plex Sans and Hind Siliguri via Google Fonts.

## 21. License

This project was created as a prototype for demonstration and evaluation. All rights reserved by the TerraLink team unless a separate license file is added. Third-party data and services remain subject to their own terms.
