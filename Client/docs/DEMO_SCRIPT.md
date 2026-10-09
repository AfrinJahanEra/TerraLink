# TerraLink 5–7 Minute Demo Script

## Before the demo
- Use a laptop or tablet browser and select Project Manager.
- Add the EmailJS and Google OAuth variables in Vercel.
- Add the deployed `https://…vercel.app` URL to Google OAuth Authorized JavaScript origins.
- In Team, replace one member email and WhatsApp number with addresses you can access.
- In Integrations, connect Google and run each Send test once.
- Use Reset demo, then reconnect Google because its access token is session-only.

## 1. Dashboard — 35 seconds
Say: “TerraLink turns a possible wetland change into a reviewable, accountable workflow.”
- Show five monitored sites, the review count, open tasks, and current budget.
- Point to the integration status strip and the Sample data banner.

## 2. Wetland map — 40 seconds
Say: “The map combines real basemap services with clearly labelled sample monitoring records.”
- Filter to Needs review.
- Switch between imagery and street layers.
- Open Pond A.

## 3. Change analysis — 55 seconds
Say: “A satellite signal is evidence for review, not proof of encroachment.”
- Change the comparison period.
- Pan or zoom the synchronized before/after views.
- Record a review decision with a short explanation.

## 4. Assign work — 55 seconds
Say: “A manager turns the reviewed finding into an accountable field task.”
- Create a Pond A task and assign it to the member whose real contact details were configured.
- Keep Email, Calendar, and WhatsApp enabled.
- Explain that EmailJS sends immediately, Google creates an event after OAuth, and WhatsApp prepares a message for human confirmation.

## 5. Track progress and evidence — 40 seconds
Say: “The field coordinator sees only assigned work and can update progress and evidence.”
- Switch to Field Coordinator.
- Open the new task, add a note, and move it to In progress.
- Return to Project Manager.

## 6. Costs and warning — 45 seconds
Say: “Costs remain linked across task, site, and programme totals.”
- Add a ৳4,200 expense to the new task.
- Show the updated task actual cost, Pond A actual total, and dashboard budget.
- Lower Pond A’s planned allocation below actual spending to show the red over-budget state and manager email rule.

## 7. Bangla Assistant — 45 seconds
Say: “The assistant is intentionally simulated and answers only from visible workspace records.”
- Select Pond A.
- Ask “কোন কাজ বাকি?” and show the newly created task and live cost figures.
- Ask “কোন task overdue?” and point to Task source chips.
- Enter an unsupported question and show “পর্যাপ্ত তথ্য পাওয়া যায়নি”.

## 8. Generate report — 60 seconds
Say: “The final report captures the current operational state with transparent limitations and attribution.”
- Select Pond A and the full date range.
- Generate the preview.
- Show cover, observation evidence, decision, task table, cost variance, limitations, sources, and Sample data disclaimer.
- Select Email this report and confirm the EmailJS notification log.
- Select Print / Save as PDF and show the A4 print preview.

## Integration evidence and close — 30 seconds
- Open Integrations and show Email, Calendar, and WhatsApp log entries.
- Open the prepared WhatsApp message without sending it.
- Show the Google Calendar event and its one-day reminder.
- Open About and Help to explain Real vs Simulated boundaries.
- Finish with Reset demo and confirm the original data returns.

## Edge-case checks
- Wetland C demonstrates Insufficient data.
- Pond B or Lake D demonstrates No change.
- A reduced site allocation demonstrates the over-budget warning.
- Missing keys, rejected OAuth, or provider quota errors produce Failed log entries and never crash the app.
