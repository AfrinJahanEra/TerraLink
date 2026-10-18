# TerraLink

**A wetland monitoring and response workspace for NGO project teams and communities in Bangladesh.**

TerraLink turns a possible change in a wetland, seen from satellite imagery or reported by a resident with a photo, into a documented, accountable and costed field response. Review, task assignment, scheduling, expenses, communication and reporting all happen in one ERP-style workspace instead of across spreadsheets, chat groups and email threads.

| | |
|---|---|
| **Live demo** | [https://terralink-probah.vercel.app](https://terralink-probah.vercel.app) |
| **Project type** | Interactive prototype: a React web app with a small Node server for shared data and email |
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
- **Integrations sit where the work happens.** Calendar events and email are actions inside tasks, meetings, budgets and reports. There is no separate integrations or settings page.
- **Residents can report what they see.** Anyone can explore the public map. To send a photo report for a real Dhaka water body, a person signs in with the **User** role, so every report is tied to an account. Reports start as Pending and a manager verifies or rejects each one with a recorded reason.
- **Real outlines on real imagery.** Five Dhaka water bodies are drawn from their OpenStreetMap shorelines on satellite imagery.
- **Measured change, not invented change.** Pick a water body and two dates. TerraLink finds real Sentinel-2 scenes, measures the water inside the outline on each date, and reports the difference with its uncertainty, or says plainly that the data does not support a measurement.
- **Verified outcome.** A verified report becomes an assigned task with a deadline, costs that need approval, completion photos, and a manager's decision on whether the problem was resolved.
- **AI-checked photo evidence.** Report photos are scanned for waste when they are added, and a vision model compares the problem photo with the after-photos before a manager closes a task (section 8).
- **Notifications that reach people.** Assigning a task emails the coordinator with a calendar invitation, and a manager can start a Google Meet from a task (section 11).
- **Assistance in English, Bangla and Banglish.** TerraLink Copilot answers operational questions, such as which tasks are pending or overdue, using only the records the signed-in role may see (section 10).
- **Reports from live state.** A report is generated from the current workspace, including evidence, decisions, tasks, cost variance, limitations and sources. It downloads as a PDF or is emailed to chosen people with the PDF attached.

## 3. Who It Is For

| User | Need |
|---|---|
| **Project managers** at environmental NGOs | Review findings, assign and approve work, control budgets, brief stakeholders. They never do the field work they approve |
| **Field coordinators** | See only their own tasks and the sites they are at, start work, submit completion photos, record field costs |
| **Programme leads and donors** | Receive clear, sourced and honest progress reports |
| **Users** (residents and community members) | Explore the monitored water bodies, report a problem with a photo and a map pin, and follow the review status of their own reports |

## 4. End-to-End Workflow

```
 Satellite comparison          Manager review             Field operations
 ────────────────────          ──────────────             ────────────────
 Site flagged as          ──►  Review queue        ──►    Task created and assigned
 "Needs review"                Site review                 Field visit scheduled
                               Documented decision        Calendar / email
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
7. Each task and meeting keeps its own history of emails and calendar events.

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
| **Community reports** | Review queue for photo reports from residents. Each report shows its photos, location, dates and review history, and a manager can start review, verify, or reject with a reason, then create a field task from a verified report. Each report also shows the AI waste detection: marked photos, severity and a PDF. |
| **Satellite comparison** | Choose a water body and two dates. TerraLink picks the clearest Sentinel-2 scene near each date, draws both over the same extent with a swipe or side-by-side view, shows the water mask and mapped outline, and reports measured water area per date, the change, a verdict and the data quality. A manager or operator can save the result to the site record. |
| **Site review** | The saved measurement (or an honest "not yet measured"), the observation record and the manager decision panel. |
| **Review queue** | Observations awaiting a documented decision, sites with data-quality gaps (for example heavy cloud cover), and the register of recorded decisions. |

### Field Operations

| Module | Description |
|---|---|
| **Tasks** | Board and list of assigned work. A task can come from a verified community report and keeps the link. Stages: Open, In progress, Blocked (reason required), Awaiting verification, Completed and Cancelled (reason required); overdue is a flag, not a stage. The task drawer shows the original report photo beside the completion photos, approved and pending costs against the estimate, and the manager's review. Follow-up actions: email reminder and Google Meet. The completion review includes the AI cleanup check (section 8.2). |
| **Schedule and meetings** | Month calendar and agenda views of meetings and task deadlines. Supports field visits, review meetings, report briefings, budget reviews and team syncs, with attendees, agenda, calendar sync and invitations. |

### Finance

| Module | Description |
|---|---|
| **Budgets** | Planned allocation, actual cost, remaining and committed amounts per site or per task. Includes over-budget alerts, allocation editing for managers, and a one-click "Schedule budget review" action. |
| **Expenses** | Ledger of costs by category with an optional receipt photo. An expense counts toward the task and site cost only after the project manager approves it; a rejected one needs a reason. |

### People

| Module | Description |
|---|---|
| **Team** | Member directory with email, availability and live workload, calculated from open tasks. |

### Reporting

| Module | Description |
|---|---|
| **Reports** | Generates a report for a chosen site and date range: key figures, water bodies, decisions, community reports, tasks, cost variance, limitations and sources. **Download PDF** saves it to the device. **Send** opens a list of people (team members plus any extra address); each person has their own Send button, and the email carries a subject, a summary table and the PDF as an attachment. A report briefing can also be scheduled. |
| **TerraLink Copilot** | Free-text questions in English, Bangla or Banglish, answered from the current workspace state within the role's access, with source chips that show which records were used (section 10). When information is not available it says so instead of guessing. |

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

## 6. Roles and Permissions

The prototype has two staff roles and a **User** role for the community. There is no role switcher: to use a different role, sign out and sign in again (the account menu says so). The sign-in and register screens show what the chosen role can do, fill in demo details for it, validate the fields, and keep a `next` link so a visitor returns to the page they came from. The User role has no staff workspace and lands on the community pages.

Each role sees only what it needs, and can do only what it is responsible for. The rules live in one table (`app/src/constants/access.js`). The sidebar, the route guard, the data each page receives, every button, and the state functions all read from it, so the app does not merely hide a button: the action is refused too. A page outside your role shows a "not part of your role" notice and a link to what you can open, and **My role and access** (account menu or dashboard) lists what you can and cannot do.

**What each role is for**

| | Project Manager | Field Coordinator |
|---|---|---|
| Purpose | Decides, assigns and approves | Does the field work on assigned tasks |
| Sees | The whole programme | Only their own tasks, the sites those tasks are at, their schedule and their expenses |

**Pages** (a page a role does not have is absent from its sidebar and blocked if opened by URL)

| Page | Project Manager | Field Coordinator |
|---|:---:|:---:|
| Dashboard | Yes | Yes (my work) |
| Wetland map | Yes | My sites only |
| Sites register, Site review | Yes | No (read-only record of a site they have a task at) |
| Satellite comparison | Yes | No |
| Community reports, Review queue | Yes | No |
| Tasks | All | Own only |
| Schedule and meetings | All | Own only |
| Budgets | Yes | No |
| Expenses | All | Own tasks only |
| Team | Yes | No |
| Reports | Yes | No |
| TerraLink Copilot | Yes | Own tasks, no budget figures |

**Actions**

| Action | Project Manager | Field Coordinator |
|---|:---:|:---:|
| Record a review decision for a site | Yes | No |
| Verify or reject a community report | Yes | No |
| Run a satellite comparison, save a measurement | Yes | No |
| Create a task, assign or reassign it (to a field coordinator), change its deadline or estimate | Yes | No |
| Start, block or submit completion evidence on a task | No (the assignee does the work) | Own tasks |
| Approve completion and close a task, or send it back | Yes | No |
| Cancel or reopen a task | Yes | No |
| Add a note to a task | Yes | Own tasks |
| Send a reminder by email | Yes | No |
| Record an expense (pending until approved) | Yes, approved on entry | Own tasks |
| Approve or reject an expense | Yes | No |
| Edit a budget allocation | Yes | No |
| Schedule meetings and field visits | Yes | No |
| Manage team records | Yes | No |
| Generate and share a programme report | Yes | No |
| Reset the demo data (account menu) | Yes | No |

Sample users: Nusrat Jahan (Project Manager), Rahim Uddin (Field Coordinator), Karim Hossain (User).

**The User role.** Users cannot open any staff page; those routes send them to the community map. Section 7 describes what a User can do.

## 7. The User (Community) Experience

The **User** role is for residents and community members. It has no staff workspace: a User lands on the community pages, can see only public information, and can submit and follow their own reports.

**Journey**

1. **Explore.** `/explore` and `/explore/:siteId` are open to everyone, signed in or not. They show the five monitored Dhaka water bodies on satellite imagery with a calm three-state status (stable, needs attention, not enough data), the saved water-area measurement when there is one, and the public list of reports.
2. **Sign in as a User.** A signed-out visitor who opens **Report a problem** is sent to log in or register as a User and returns to the form afterwards. Staff roles see an explanation instead of the form, because staff review reports and do not submit them.
3. **Report a problem** (`/report`). One page of numbered cards:
   - **Photo evidence:** up to 3 photos (JPG, PNG or WebP, 10 MB each). Each photo is scanned by the AI waste check as soon as it is added (see section 8). The report can only be submitted once at least one photo shows waste; otherwise the form asks for a closer photo of the waste.
   - **Details:** type of problem, the date it was seen (not in the future), and a short description.
   - **Location:** a map with a water-body selector and a pin. **Use my location** fills it from the device. A pin outside every outline is saved as a location-based report.
4. **Follow it** (`/my-reports`). Counts by status, filters, and a progress tracker for each report: Submitted, Under review, Verified, Action taken, Resolved. The reviewer's reasons and the action taken are shown.

**What a report stores:** the photos, the AI-marked copies of the photos, the AI summary and its PDF, the pin, the date, the description and the reporter's name and email from the account. Reviewers see the reporter; the public map shows only "Reporter".

**Privacy and limits.** A User cannot open any staff page; those routes send them to the community map. Reports start as **Pending**. A manager verifies or rejects each one with a recorded reason, and a rejected report is hidden from the public map but kept in the Community reports queue. A verified report becomes a field task, and the report is marked **Resolved** only when the manager completes that task with the outcome Resolved.

## 8. AI Photo Checks

TerraLink uses AI on photos in two places. They use different techniques, and this section says which is which.

### 8.1 Waste check on community report photos

When a User adds a photo to a report, the **AI waste detection** window scans it and returns:

- green boxes drawn on the areas that look like waste, each with a label and a confidence;
- a waste type (for example plastic and packaging, mixed household garbage, construction debris);
- the share of the photo covered, a severity (Low, Medium or High) and a recommended action;
- an **AI-marked copy** of the photo, saved with the report, and an **A4 PDF** of the detection that reviewers can download.

The result is saved on the report (`aiAnalysis`). Reviewers see the AI-marked photos with the report's photos, and the same data drives the waste hotspots on the satellite page (section 9).

**What it is.** This is a **prototype detector**, not a trained neural network: `app/src/services/wasteDetection.js` is named *TerraLink WasteNet v0 (prototype)*. It reads the photo's colour and texture on a coarse grid, ignores areas that look like water, vegetation or open sky, and boxes the busiest, least natural-looking regions. For predictable demos, a file name that contains *waste, dump, garbage, trash, plastic, litter* or *debris* is treated as a positive and one that contains *clean* as a negative. The function keeps a fixed result shape so it can be replaced by a trained model (for example an object detector behind an API) without changing the rest of the app.

### 8.2 Before-and-after cleanup check on task photos

When a field coordinator finishes a task, the cleanup check compares the problem photo with the after-photos using a real, pre-trained vision model.

- **Model:** OpenAI's **CLIP ViT-B/32** (a Vision Transformer, not a convolutional network), run **in the browser** with Transformers.js. Photos never leave the device. The quantised vision half is about 89 MB, downloaded once and cached by the browser.
- **How it decides:** each photo becomes an image embedding and is compared with text descriptions of waste (garbage pile, scattered litter, polluted bank, floating plastic) and of clean places (clean shoreline, clear water, clean green area, clean street). The description embeddings were computed once and saved in `app/src/data/clipLabels.json`. The **waste probability** is the share of probability that falls on the waste descriptions.
- **Field coordinator side:** every after-photo is checked as soon as it is added. If the AI still sees waste (waste probability of 55% or more), **Submit for verification is locked** until the photo is replaced. If the model cannot run, the manager checks the photo instead.
- **Manager side:** in *Review the completion*, **Run AI check on the after-photos** shows the report photo ("Before") and the after-photo side by side with waste percentages, then a verdict: **Cleared**, **Partly cleared** (30% to 55%) or **Not cleared** (55% or more), a confidence, the reduction in waste, and a location check against the report spot (a warning above 150 m). Any after-photo that still shows waste makes the verdict Not cleared.
- **The AI suggests; the manager decides.** The verdict pre-fills the outcome and the review note, and it is saved with the decision. Only the project manager can approve and close the task.

The "Before" photo is the report the task was opened from. For a task created from a site review, which has no report of its own, it is the newest photographed, non-rejected report on the same water body from before the work was submitted, and the caption says so.

## 9. Satellite and Aerial Imagery

### 9.1 Measuring change

Sentinel-2 scenes are compared by NDWI to measure water area on two dates, with stated uncertainty. The method is described in section 14 ("Measuring water area").

### 9.2 Sharpened satellite images

Sentinel-2 true-colour pixels are 10 m wide, so the raw image looks soft. TerraLink applies a **Sharpen** step to the *displayed* image:

1. a per-channel **contrast stretch** between the 1st and 99th percentile of each band;
2. a small **saturation** lift (about 15%);
3. an **unsharp mask** (each pixel plus 0.8 times its difference from the 3×3 neighbourhood mean).

It runs in the browser on a canvas (`app/src/services/imageEnhance.js`). It is on by default in the satellite comparison viewer, with a **Sharpen** toggle, and is also used in the 5× zoom of a waste hotspot and in the site PDF. It is classic image processing: it only redistributes the brightness of pixels that were measured, **adds no detail and uses no AI**, and the images are captioned "contrast-stretched and sharpened". The NDWI water measurement is calculated from the raw bands and never from the sharpened picture.

### 9.3 Waste hotspots on the satellite page

On the satellite comparison page, every community report at that water body in which the AI found waste is pinned at its GPS position on the later image (and on a high-resolution aerial view). The scanning sweep that plays over the image is a visual effect: the hotspots come from the geotagged, AI-checked ground photos, because a 10 m satellite pixel is too coarse to show the waste itself.

Selecting a hotspot opens an **evidence chain** of three images, each with its real source and date:

| Step | Image | Source |
|---|---|---|
| **1. Where** | Sentinel-2 crop at 5× zoom, sharpened, with the spot marked | Copernicus Sentinel-2, 10 m |
| **2. Closer** | Aerial photo of the same spot with the report radius marked, plus the capture date and sensor | Esri World Imagery, about 0.3 to 0.6 m |
| **3. What** | The AI-marked ground photo from the report | The User's photo and the waste check in section 8.1 |

The **Site report PDF** collects the satellite images, the measurement, the hotspots and a plain-language summary. Aerial imagery is a mosaic, so its date is often older than the Sentinel-2 scene; the card says when an aerial photo was taken before the report.

## 10. TerraLink Copilot (Assistant)

**TerraLink Copilot** answers free-text questions about lakes, tasks, reports, expenses, meetings and the team, using only the records that role is allowed to see.

- **Languages:** questions can be typed in **English, Bangla or Banglish** (for example "কোন কাজ বাকি?", "amar kaj ki?", "which task is overdue"). Answers are written in English. Lake names are recognised in English and in Bangla script.
- **Role-based access:** each answer is labelled *Public lake information*, *Your own data*, *Confidential · manager only* or *Not permitted*, with source chips that name the records used. The project manager gets everything, including budgets, all expenses, team workload and who reported what. A field coordinator gets public facts about every lake plus their own tasks, budget and expenses; a question about confidential data is declined with a reason.
- **Conversation:** it remembers the lake from the previous question (so "and what work is open there?" works), suggests follow-up questions, and can show the relevant photos in an answer.
- **Honest by design:** when the information is not in the workspace it says so instead of guessing.

**How it works.** The Copilot is a **rule-based engine that runs entirely in the browser** (`app/src/utils/assistantEngine.js`). It matches the intent of a question from English, Bangla and Banglish keywords, then builds the answer from the live workspace state. It does **not** call a language model or any external AI service, and it is not a general-purpose chatbot. Sample questions for testing are in `app/docs/copilot-test-questions.txt`.

A trained language model that answers in Bangla and is grounded on workspace records is on the roadmap (section 22).

## 11. Email, Calendar and Google Meet

Integrations appear as actions at the point of need, not as a standalone settings page. Every email, calendar event and meeting is written to a structured **communication history** that the task or meeting drawer shows, with the status **Sent** or **Failed** and the reason.

| Where | What happens | Service |
|---|---|---|
| Task creation or reassignment | The assignee gets a branded email with an **iCalendar invitation** for the deadline (Gmail and Outlook show Yes / Maybe / No), an **Add to Google Calendar** link and a directions link | Email (SMTP) |
| Task submitted for verification | The project manager is emailed that the work is ready to review (when the task's email notification is on) | Email |
| Task drawer | **Email reminder** to the assignee | Email |
| Task drawer or site page | **Create meeting**: a Google Calendar event with a **Google Meet** link, invitations to every guest, and a branded email with the link | Google Calendar, Google Meet, Email |
| Budgets | The manager is emailed the first time approved spending passes a site's planned allocation | Email |
| Reports | **Download PDF**, or **Send**: each person gets a subject, a summary table and the PDF as an attachment | Email, jsPDF |
| Discord (optional, runs with `npm run dev`) | One forum post per water body, updated when its status, reports, measurements, decisions or tasks change; `/status` shows the current state | Discord bot |

### Email

- Email is sent through **SMTP** (Gmail with an app password, or any SMTP host) by a small server endpoint: the local data server during `npm run dev` / `npm run preview`, or the `app/api/email.js` serverless function on Vercel. Both use the same code (`app/emailServer.js`, Nodemailer), so the SMTP credentials stay on the server and are never bundled into the browser.
- Every link in an email or calendar event (open the task, the budget page or the reports page) points to the deployed site, `https://terralink-probah.vercel.app` by default, even when the email is sent while running locally. Set `VITE_APP_URL` to use another domain.
- If SMTP is not configured, TerraLink falls back to **EmailJS** from the browser. If neither is configured, the action shows "Email is not set up" and records a Failed entry.
- Over SMTP, assignment emails carry an iCalendar `REQUEST` attachment, so the deadline appears in the assignee's calendar without anyone pressing "add to calendar" (EmailJS cannot attach one, so that fallback sends the email without the invitation). Report emails carry the PDF as an attachment.

### Google Calendar

- Uses **Google Identity Services** (OAuth, scope `calendar.events`). The first time an action needs it, Google asks the manager to sign in; the access token is then kept for the browser session and events are created directly in the manager's primary calendar, with a reminder.
- The **Add to Google Calendar** link in the assignment email opens a prefilled Google Calendar page, so it works for the assignee without any setup. Creating a meeting needs `VITE_GOOGLE_CLIENT_ID`, because the event is created in the manager's own calendar; without it the action reports that Google Calendar is not set up.

### Google Meet

- **Create meeting** (task drawer, or *Schedule field verification visit* on a site) asks for a title, date, start time, duration, agenda and guests. Team members are offered as one-click guests and any other email address can be added.
- TerraLink creates the Calendar event with a **Google Meet** conference request. Google sends each guest its own invitation and puts the event in their calendar, then TerraLink emails every guest a branded message with the Meet link and the calendar link.
- The meeting is saved in the workspace with its Meet link and calendar link, and the task's history shows the Google Meet creation and each guest's email. If Google does not return a Meet link, the meeting is reported as failed instead of being shown as created.
- The Meet link belongs to the Google account the manager signs in with.

Failures never break the app. Missing keys, a cancelled Google sign-in or a quota error are shown next to the action and recorded in the history.

## 12. Real Services and Simulated Data

TerraLink is open about what is real and what is illustrative.

| Component | Status |
|---|---|
| Satellite basemap (Esri World Imagery) | Real |
| Street basemap (OpenStreetMap) | Real |
| Water-body outlines (OpenStreetMap way and relation geometry) | Real, community-mapped and unverified |
| Mapped area (calculated from the outline) | Real calculation |
| Dated Sentinel-2 L2A scenes, read from the public archive in the browser | Real imagery |
| Water area measured by NDWI in a satellite comparison | Real measurement, an estimate with stated uncertainty |
| Photo evidence and community reports you submit | Real, stored in this browser and, when the local data server runs, also on it |
| Email delivery (SMTP, or EmailJS as a fallback) | Real, when configured |
| Google Calendar events and Google Meet links | Real, when configured |
| Water-area change | Real only where a comparison has been run and saved |
| Site classifications (for example "No change") | Sample data |
| Three seeded community reports | Sample data, without photos |
| Team members, tasks, budgets and expenses | Sample data |
| TerraLink Copilot | Real answers from workspace records, produced by a rule-based engine in the browser; no language model |
| Waste check on report photos (section 8.1) | Prototype: a colour and texture heuristic with file-name shortcuts for demos, not a trained model |
| Before and after cleanup check (section 8.2) | Real pre-trained model (CLIP ViT-B/32) run in the browser, used zero-shot and not trained on TerraLink data |
| Sharpened satellite images (section 9.2) | Real image processing for display only; adds no detail |
| Aerial photos (Esri World Imagery) | Real imagery; the mosaic date can be older than the Sentinel-2 scene |
| Discord updates | Real, when the bot is configured |
| Authentication | Demo role selection, no real accounts |

All sample content is labelled **Sample** in the interface. A prototype banner is shown across the workspace.

## 13. Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 with a custom design theme |
| Routing | React Router 7 (lazy-loaded routes, URL-driven drawers and forms) |
| Maps | Leaflet with React Leaflet |
| Satellite analysis | Earth Search STAC catalogue, geotiff.js (Cloud Optimized GeoTIFF range reads), proj4 (UTM projection); no backend |
| Aerial imagery | Esri World Imagery tiles and its identify service for the capture date and sensor |
| Charts | Recharts and lightweight SVG charts |
| Icons | Lucide (monochrome) |
| Email | Nodemailer over SMTP (Gmail) on the local data server or a Vercel function; EmailJS browser SDK as a fallback |
| Calendar and meetings | Google Identity Services, Google Calendar API v3 (events and Google Meet conferences), iCalendar invitations |
| AI in the browser | Transformers.js (Hugging Face) running OpenAI CLIP ViT-B/32 (ONNX, 8-bit); canvas image processing |
| Local server | A Vite plugin (Node) that shares the workspace, stores uploaded photos and sends email during dev and preview |
| Discord | discord.js bot started with the dev server |
| PDF | jsPDF and jspdf-autotable, loaded only when a PDF is made |
| Typography | IBM Plex Sans (interface), Hind Siliguri (Bangla) |
| Quality | ESLint with React Hooks and React Refresh rules |
| Hosting | Vercel (single-page application rewrites and the email function in `app/api`) |

## 14. Architecture

TerraLink is a React single-page application. All analysis (satellite measurement, photo checks, the Copilot) runs in the browser. A small Node layer, started as a Vite plugin by `npm run dev` and `npm run preview`, adds three things: a shared workspace file, uploaded photo files and an SMTP email endpoint. On a static host such as Vercel only the email function (`app/api`) exists, and each browser keeps its own workspace.

**State management**
- A single `AppContext` uses `useReducer` to hold sites, review decisions, tasks, meetings, expenses, budgets, team members and notification logs.
- Workspace state is saved to `localStorage` under `terralink.workspace.v3`, so work is kept across page reloads and screens. When the local data server is running it is also saved to `app/local-data/workspace.json` with a revision number: every action is applied to the newest saved copy and other users' changes are pulled every few seconds, so a manager and a coordinator on different browsers see the same data. Photos are kept in IndexedDB and uploaded to `app/local-data/uploads`.
- Decisions recorded on a site override that site's sample status. Every module (map, register, review queue, dashboard and reports) reads from the same state.

**Services layer**
- `services/email.js`: sends through the SMTP endpoint when it is configured, otherwise through EmailJS, with safe failure handling.
- `services/automation.js`: what happens on its own when work is created or finished (assignment email with a calendar invitation, completion notice, budget alert) and the Google Meet meeting flow.
- `services/calendar.js`: Google OAuth token flow, event creation with Google Meet requests, iCalendar invitations and the prefilled Add to Google Calendar link.
- `services/cleanupAi.js`, `services/wasteDetection.js`, `services/imageEnhance.js`: the before-and-after cleanup check, the waste check on report photos and image sharpening (sections 8 and 9).
- `utils/assistantEngine.js`: how the Copilot understands a question and builds its answer (section 10).
- `services/reportPdf.js`: builds the report PDF, for download and as an email attachment.
- Every outbound email and calendar action writes a structured entry that the task or meeting drawer shows as its history.

**Routing and navigation**
- One navigation configuration drives both the sidebar and the page titles.
- Role-restricted routes are guarded by the access table.
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

## 15. Project Structure

```
Prototype/
├── README.md
└── app/
    ├── index.html
    ├── vite.config.js
    ├── vercel.json
    ├── api/                 Vercel functions that send email
    ├── emailServer.js       SMTP delivery (Nodemailer), shared by the local server and api/
    ├── localDataServer.js   Shared workspace, photo uploads and email for dev and preview
    ├── discordBot.js        Discord bot started with the dev server
    ├── docs/
    │   ├── DEMO_SCRIPT.md
    │   └── copilot-test-questions.txt
    ├── public/
    └── src/
        ├── assets/            Landing page imagery
        ├── components/
        │   ├── brand/         Logo
        │   ├── community/     Report form, location picker, report cards and detail
        │   ├── budget/        Allocation and expense forms, planned vs actual chart
        │   ├── communications/ Communication history
        │   ├── dashboard/     KPI cards, snapshots, schedule, insights
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
        ├── services/          Email, calendar and Meet automation, report PDF, photo storage, Sentinel-2 analysis, AI photo checks, image sharpening
        └── utils/             Formatting, schedule, report and communications helpers
```

## 16. Getting Started

### Prerequisites

- Node.js 20.19 or later (required by Vite 8)
- npm 10 or later

### Installation

```bash
git clone <repository-url>
cd app
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:5173` and choose a role on the sign-in screen. `npm run dev` also starts the local data server (shared workspace, photo uploads, email) and, when its Discord settings are present, the Discord bot.

### Other commands

| Command | Purpose |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

The application works without any environment variables. Integrations then fail safely: email and meeting actions show a clear "not set up" message, and a Failed entry is recorded in the history, instead of sending. Download PDF works without any setup, and so do the AI photo checks; the first cleanup check downloads the vision model (about 89 MB) once. Creating a Google Meet needs a Google client ID (section 17).

## 17. Environment Configuration

Create a file named `.env` inside `app/` and add the values you need. It is ignored by git and is not uploaded to Vercel. Variables without a `VITE_` prefix are read only by the local server and the Vercel function; they are never sent to the browser.

| Variable | Needed for | Description |
|---|---|---|
| `SMTP_USER` | Email | The address emails are sent from (a Gmail account works) |
| `SMTP_PASS` | Email | Password for that account. For Gmail use a 16-character **app password**; spaces are ignored |
| `SMTP_HOST` | Optional | SMTP host. Default `smtp.gmail.com` |
| `SMTP_PORT` | Optional | Default `465` (TLS) |
| `SMTP_FROM_NAME` | Optional | Sender name. Default `TerraLink` |
| `SMTP_REPLY_TO` | Optional | Reply-to address |
| `VITE_GOOGLE_CLIENT_ID` | Calendar and Google Meet | Google Cloud OAuth Web client ID |
| `DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_GUILD_ID`, `DISCORD_FORUM_CHANNEL_ID` | Discord bot | All four are needed; without them the bot is skipped |
| `VITE_APP_URL` | Optional | The address that links in emails and calendar events open. Default `https://terralink-probah.vercel.app`, so a message sent from a local machine never links to `localhost` |
| `APP_URL` | Optional | Address used in Discord links. Default `http://localhost:5173` |
| `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID` | EmailJS fallback | Used only when SMTP is not configured |
| `VITE_EMAILJS_TEMPLATE_TASK_ASSIGN_ID`, `VITE_EMAILJS_TEMPLATE_OVER_BUDGET_ID`, `VITE_EMAILJS_TEMPLATE_TASK_COMPLETE_ID`, `VITE_EMAILJS_TEMPLATE_REPORT_SUMMARY_ID`, `VITE_EMAILJS_TEMPLATE_MEETING_INVITE_ID`, `VITE_EMAILJS_TEMPLATE_TASK_REMINDER_ID` | Optional | Per-notification EmailJS templates |
| `VITE_EMAILJS_REPLY_TO` | Optional | Reply-to address for EmailJS email |

**EmailJS fallback.** Template variables: `to_name`, `to_email`, `subject`, `message`, `notification_type`, `task_id`, `task_title`, `site_name`, `assignee_name`, `due_date`, `action_url`. For the report email, create a template (set it as `VITE_EMAILJS_TEMPLATE_REPORT_SUMMARY_ID`, or use the default) with To = `{{to_email}}`, Subject = `{{subject}}`, and an HTML body that contains `{{{message_html}}}` (three braces, so the table is not escaped). Under Attachments add a **Variable attachment** with parameter `report_pdf` and file name `{{report_filename}}`. EmailJS cannot attach a calendar invitation, so only the SMTP path sends one.

**Google Calendar and Google Meet setup**
1. Create a project in Google Cloud Console and enable the **Google Calendar API**.
2. Configure the OAuth consent screen. While it is in Testing, add each manager's Google account as a test user.
3. Create an OAuth client ID of type **Web application**. No client secret is used.
4. Add `http://localhost:5173` and your deployed domain as Authorized JavaScript origins.
5. Set `VITE_GOOGLE_CLIENT_ID` and restart the development server.

Never commit `.env` files. The `VITE_` variables are exposed to the browser, and none of them is a secret server credential.

## 18. Deployment

The project deploys to Vercel as a static single-page application.

1. Import the repository into Vercel and set the root directory to `app`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add the environment variables from section 17 in the Vercel project settings.
4. Add the production domain to the Google OAuth Authorized JavaScript origins.

`vercel.json` contains the rewrite rule that sends every route to `index.html`, so direct links such as `/tasks?task=TL-104` work.

Add the `SMTP_*` variables in Vercel too: the `app/api/email` function reads them on the server. The deployed demo has no shared-workspace server, so each browser keeps its own data and uploaded photos (section 14).

## 19. Demonstration Guide

A timed 5 to 7 minute walkthrough is available in [`app/docs/DEMO_SCRIPT.md`](app/docs/DEMO_SCRIPT.md). Recommended path:

1. **Dashboard:** priority site, KPIs and upcoming schedule.
2. **Public explorer and report form:** open `/explore` while signed out, select Dhanmondi Lake, choose **Report a problem here**, sign in as a User, then submit a photo report and follow it under **My reports**. Watch the AI waste check mark the photo before the report can be sent.
3. **Community reports:** sign in as Project Manager, check the evidence and verify the report.
4. **Satellite comparison:** pick a water body and two dates, read the measured water area and its uncertainty, and save it to the site record.
5. **Tasks:** from the verified report, create a task, assign it, and set the estimated cost.
6. **Sign out and sign in as Field Coordinator:** start the work, add an expense (it stays pending), and submit completion photos.
7. **Verification and cost:** as Project Manager, approve the expense, send the work back once, then approve it with the outcome Resolved. Run the AI cleanup check on the after-photo, then show the before and after photos and the report marked Resolved.
8. **TerraLink Copilot:** ask "কোন কাজ বাকি?" and "কোন task overdue?".
9. **Reports:** generate the report, download the PDF and send it to a person by email.
10. **Meeting:** from a task, create a Google Meet and show the invitation email and the Meet link in the task's history.

Edge cases worth showing: Gol Talab (insufficient data because it is under one hectare), a report pinned outside every outline (saved as a location-based report), a rejected report (hidden from the public map, kept in the review queue), and a reduced budget allocation (over-budget state).

## 20. Design Principles

- **Professional and calm:** light interface, restrained shadows and a deep green navigation rail.
- **One accent colour on the community side:** teal for actions and progress, slate for everything else, amber only for "needs attention".
- **Colour carries meaning:** status is shown with small indicator dots on neutral labels. Red is kept for real problems such as overspending and failures.
- **Monochrome iconography:** consistent neutral icons, no decorative imagery and no emoji.
- **Honest data labelling:** sample values are marked as sample data, and a figure that has not been measured is shown as "Not yet measured".
- **Responsive:** built for laptops and tablets, with a collapsible sidebar that adapts to screen height.
- **Accessible:** semantic headings, labelled controls, keyboard focus states and reduced-motion support.
- **Bilingual:** English interface with Bangla assistance and Bangla currency formatting.
- **Usable on a phone:** the public report form and map work at phone width, because residents report from the field.

## 21. Responsible Use and Limitations

- A change seen in imagery, or a photo from a resident, is **a reason to investigate**. It is not proof of encroachment, ecological loss or legal non-compliance. Field verification and human judgement are always required.
- Optical satellite imagery is affected by cloud, shadow, seasonal water levels and resolution limits. TerraLink picks the clearest scene, leaves cloud and shadow pixels out, and reports how many usable pixels there were. A water body under one hectare, or a comparison whose dates are far apart in the seasonal cycle, is reported as not reliable.
- Site classifications, tasks, budgets and team records in this prototype are **sample data**.
- Data is kept in the browser (local storage and IndexedDB). When the local data server runs, the workspace and uploaded photos are also saved in `app/local-data` and shared by everyone using that server. On a static host such as Vercel, data stays in each browser and is not shared between devices. **Reset demo data** in the account menu restores the original sample workspace and removes uploaded photos.
- Water-body outlines come from OpenStreetMap contributors and are simplified. They are not an official survey, so each boundary is marked unverified.
- A water body under about one hectare is only a few 10 m satellite pixels wide. TerraLink marks such sites (Gol Talab) as Insufficient data and points to field evidence instead.
- A verified community report means its evidence was reviewed. It does not by itself establish the condition of the whole water body.
- TerraLink Copilot is rule-based and answers only from workspace records. It is not a language model and cannot answer general questions.
- The AI waste check on report photos is a prototype heuristic, not a validated detector. It can miss waste and can mark clutter that is not waste, so a reviewer must look at the photo, and demo file names can change its verdict.
- The cleanup check uses a general-purpose vision model that was not trained on Bangladeshi water bodies. It gives a probability, not proof; it suggests and the manager decides. Its location check relies on the position the device reports.
- Sharpening makes satellite images easier to read but adds no information, and it is never used for the water-area measurement.

## 22. Roadmap

| Phase | Planned capability |
|---|---|
| Data | Validate the NDWI measurement against surveyed boundaries and add MNDWI, multi-year trends and scheduled monitoring |
| Platform | Backend API and shared database so reports sync across devices, object storage for photos, real authentication and organisation accounts |
| Field | Offline-capable mobile capture, photo EXIF location checks and duplicate-report detection |
| Intelligence | A trained, validated waste-detection model to replace the prototype detector, and a Bangla language model assistant grounded on workspace records |
| Finance | Approval workflows, receipts and donor-specific budget lines |
| Reporting | Scheduled reports, donor templates and data export |
| Collaboration | Reporter follow-up by SMS, and multi-organisation sharing |

## 23. Team

| Member | Role | Contact |
|---|---|---|
| Afrin Jahan Era | Full-Stack Developer and Product Design | [GitHub](https://github.com/AfrinJahanEra) · [LinkedIn](https://www.linkedin.com/in/afrin-jahan-era-054b22417/) |
| *Member name* | *Role* | *Contact* |
| *Member name* | *Role* | *Contact* |

Institution: Islamic University of Technology (IUT), Bangladesh.

## 24. Acknowledgements and Data Attribution

- **Sentinel-2 L2A** scenes: contains modified Copernicus Sentinel data, served by the [Earth Search](https://element84.com/earth-search/) catalogue and AWS Open Data.
- **Basemap** data and **water-body outlines** from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the ODbL.
- **World Imagery** (basemap and aerial photos) by Esri and its data providers.
- **CLIP ViT-B/32** by OpenAI, ONNX conversion by [Xenova](https://huggingface.co/Xenova/clip-vit-base-patch32), run in the browser with [Transformers.js](https://huggingface.co/docs/transformers.js).
- **Icons** by [Lucide](https://lucide.dev/).
- **Fonts** IBM Plex Sans and Hind Siliguri via Google Fonts.

## 25. License

This project was created as a prototype for demonstration and evaluation. All rights reserved by the TerraLink team unless a separate license file is added. Third-party data and services remain subject to their own terms.
